import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

test(
  "PostgreSQL : clients, équipe, isolation, absences et réservations concurrentes",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.APP_ORIGIN = "http://localhost:5173";
    const { app, db } = await import("./index.js");
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.on("listening", resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
    const marker = crypto.randomUUID();
    const institutes: string[] = [],
      emails: string[] = [];
    const request = (
      path: string,
      method = "GET",
      cookie = "",
      body?: unknown,
    ) =>
      fetch(base + path, {
        method,
        headers: {
          Origin: process.env.APP_ORIGIN!,
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    async function create(path: string, cookie: string, body: unknown) {
      const response = await request(path, "POST", cookie, body);
      const data = await response.json();
      assert.equal(response.status, 201, JSON.stringify(data));
      return data as { id: string };
    }
    try {
      const cookies: string[] = [];
      const members: string[] = [];
      for (const letter of ["a", "b"]) {
        const email = `${letter}-${marker}@test.belleza.invalid`;
        emails.push(email);
        const registered = await request("/auth/register", "POST", "", {
          email,
          password: "Booking-test-password-123",
          name: "Test Owner",
          instituteName: `Booking ${letter} ${marker}`,
        });
        assert.equal(registered.status, 201);
        cookies.push(registered.headers.get("set-cookie")!.split(";")[0]);
        const me = (await (
          await request("/me", "GET", cookies.at(-1)!)
        ).json()) as { institute: { id: string } };
        institutes.push(me.institute.id);
        members.push(
          (
            await db.member.findFirstOrThrow({
              where: { instituteId: me.institute.id },
            })
          ).id,
        );
      }
      const [a, b] = cookies;
      const clientInput = {
        name: "Client test",
        phone: "+2250700000000",
        email: "",
        birthDate: "",
        marketingConsent: false,
        active: true,
      };
      const ca = await create("/clients", a, clientInput),
        cb = await create("/clients", b, clientInput);
      const serviceInput = {
        name: "Soin test",
        category: "Esthétique",
        duration: 60,
        price: 15000,
      };
      const sa = await create("/services", a, serviceInput),
        sb = await create("/services", b, serviceInput);
      const employeeInput = (serviceId: string) => ({
        name: "Collaboratrice test",
        phone: "",
        job: "Esthéticienne",
        active: true,
        serviceIds: [serviceId],
        schedules: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          startMinute: 420,
          endMinute: 1260,
        })),
      });
      const ea = await create("/employees", a, employeeInput(sa.id)),
        eb = await create("/employees", b, employeeInput(sb.id));
      assert.equal((await request("/clients/" + cb.id, "GET", a)).status, 404);
      assert.equal(
        (
          await request("/clients/" + cb.id, "PATCH", a, {
            ...clientInput,
            name: "Intrusion",
          })
        ).status,
        404,
      );
      assert.equal(
        (await request("/employees/" + eb.id, "PATCH", a, employeeInput(sb.id)))
          .status,
        404,
      );
      const clients = (await (await request("/clients", "GET", a)).json()) as {
        items: { id: string }[];
      };
      assert.equal(
        clients.items.some((c) => c.id === cb.id),
        false,
      );
      assert.equal(
        (await request("/employees", "POST", a, employeeInput(sb.id))).status,
        400,
      );
      await assert.rejects(
        db.employeeService.create({
          data: {
            instituteId: institutes[0],
            employeeId: ea.id,
            serviceId: sb.id,
          },
        }),
      );
      const future = new Date(Date.now() + 4 * 86400000)
        .toISOString()
        .slice(0, 10);
      const at = (hour: string) => future + "T" + hour + ":00Z";
      const booking = {
        clientId: ca.id,
        employeeId: ea.id,
        serviceId: sa.id,
        startsAt: at("09:00"),
      };
      assert.equal(
        (
          await request("/appointments", "POST", a, {
            ...booking,
            serviceId: sb.id,
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await request("/appointments", "POST", a, {
            ...booking,
            startsAt: at("06:30"),
          })
        ).status,
        409,
      );
      const first = await create("/appointments", a, booking);
      assert.equal(
        (
          await request("/appointments", "POST", a, {
            ...booking,
            startsAt: at("09:30"),
          })
        ).status,
        409,
      );
      await create("/appointments", a, { ...booking, startsAt: at("10:00") });
      const concurrent = await Promise.all([
        request("/appointments", "POST", a, {
          ...booking,
          startsAt: at("12:00"),
        }),
        request("/appointments", "POST", a, {
          ...booking,
          startsAt: at("12:00"),
        }),
      ]);
      const results = await Promise.all(
        concurrent.map(async (r) => ({
          status: r.status,
          data: await r.json(),
        })),
      );
      assert.deepEqual(
        results.map((r) => r.status).sort(),
        [201, 409],
        JSON.stringify(results),
      );
      const availability = (await (
        await request(
          `/availability?date=${future}&employeeId=${ea.id}&serviceId=${sa.id}`,
          "GET",
          a,
        )
      ).json()) as string[];
      assert.equal(
        availability.includes(new Date(at("09:00")).toISOString()),
        false,
      );
      assert.equal(
        availability.includes(new Date(at("11:00")).toISOString()),
        true,
      );
      assert.equal(
        (
          await request(
            `/availability?date=${future}&employeeId=${eb.id}&serviceId=${sb.id}`,
            "GET",
            a,
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await request("/employees/" + ea.id + "/absences", "POST", a, {
            startsAt: at("09:00"),
            endsAt: at("10:00"),
          })
        ).status,
        409,
      );
      const absence = await create("/employees/" + ea.id + "/absences", a, {
        startsAt: at("15:00"),
        endsAt: at("16:00"),
        reason: "Indisponibilité",
      });
      assert.equal(
        (
          await request("/appointments", "POST", a, {
            ...booking,
            startsAt: at("15:00"),
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            `/employees/${ea.id}/absences/${absence.id}`,
            "DELETE",
            b,
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await request(
            `/employees/${ea.id}/absences/${absence.id}`,
            "DELETE",
            a,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await request("/appointments/" + first.id + "/status", "PATCH", b, {
            status: "CONFIRMED",
          })
        ).status,
        404,
      );
      assert.equal(
        (await request("/appointments/" + first.id, "PATCH", b, booking))
          .status,
        404,
      );
      assert.equal(
        (
          await request("/appointments/" + first.id + "/status", "PATCH", a, {
            status: "COMPLETED",
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/appointments/" + first.id + "/status", "PATCH", a, {
            status: "CONFIRMED",
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request("/appointments/" + first.id + "/status", "PATCH", a, {
            status: "IN_PROGRESS",
          })
        ).status,
        409,
      );
      const changed = await request("/appointments/" + first.id, "PATCH", a, {
        ...booking,
        startsAt: at("14:00"),
      });
      assert.equal(changed.status, 200);
      assert.equal(
        (
          await request("/appointments/" + first.id + "/status", "PATCH", a, {
            status: "CANCELLED",
          })
        ).status,
        200,
      );
      await create("/appointments", a, { ...booking, startsAt: at("14:00") });
      assert.equal(
        (
          await request("/employees/" + ea.id, "PATCH", a, {
            ...employeeInput(sa.id),
            active: false,
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/employees/" + ea.id, "PATCH", a, {
            ...employeeInput(sa.id),
            serviceIds: [],
          })
        ).status,
        409,
      );
      await db.member.update({
        where: { id: members[0] },
        data: { role: "PRACTITIONER" },
      });
      await db.employee.update({
        where: { id: ea.id },
        data: { memberId: members[0] },
      });
      assert.equal((await request("/clients", "GET", a)).status, 403);
      assert.equal(
        (await request("/appointments", "POST", a, booking)).status,
        403,
      );
      const practitionerStaff = (await (
        await request("/employees", "GET", a)
      ).json()) as { items: { id: string }[] };
      assert.deepEqual(
        practitionerStaff.items.map((e) => e.id),
        [ea.id],
      );
      const ownDashboard = (await (
        await request("/dashboard", "GET", a)
      ).json()) as {
        clients: number | null;
        appointments: { employeeId: string }[];
      };
      assert.equal(ownDashboard.clients, null);
      assert.ok(
        ownDashboard.appointments.every((item) => item.employeeId === ea.id),
      );
      await db.employee.update({
        where: { id: ea.id },
        data: { memberId: null },
      });
      assert.deepEqual(
        (await (await request("/dashboard", "GET", a)).json()).appointments,
        [],
      );
      await db.member.update({
        where: { id: members[0] },
        data: { role: "CASHIER" },
      });
      assert.equal(
        (
          await request(
            "/appointments?from=" +
              encodeURIComponent(at("00:00")) +
              "&to=" +
              encodeURIComponent(at("23:00")),
            "GET",
            a,
          )
        ).status,
        403,
      );
      assert.equal(
        (await request("/clients", "POST", a, clientInput)).status,
        403,
      );
      const cashierDashboard = await (
        await request("/dashboard", "GET", a)
      ).json();
      assert.equal(cashierDashboard.clients, null);
      assert.deepEqual(cashierDashboard.appointments, []);
    } finally {
      await db.institute.deleteMany({ where: { id: { in: institutes } } });
      await db.user.deleteMany({ where: { email: { in: emails } } });
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.$disconnect();
    }
  },
);
