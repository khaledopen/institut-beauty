import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

test(
  "PostgreSQL : A ne peut lire, modifier ni supprimer une prestation de B",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    // Utiliser une base de test distincte ; seules les données créées par ce test sont supprimées.
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.APP_ORIGIN = "http://localhost:5173";
    const { app, db } = await import("./index.js");
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.on("listening", resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
    const marker = crypto.randomUUID();
    const emails = [
      `a-${marker}@test.belleza.invalid`,
      `b-${marker}@test.belleza.invalid`,
    ];
    const institutes: string[] = [];
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
    try {
      const cookies: string[] = [];
      for (const [i, email] of emails.entries()) {
        const response = await request("/auth/register", "POST", "", {
          name: "Test Owner",
          instituteName: `Test ${i} ${marker}`,
          email,
          password: "Unique-test-password-123",
        });
        assert.equal(response.status, 201);
        cookies.push(response.headers.get("set-cookie")!.split(";")[0]);
        const me = (await (await request("/me", "GET", cookies[i])).json()) as {
          institute: { id: string };
        };
        institutes.push(me.institute.id);
      }
      const payload = {
        name: "Soin institut B",
        category: "Esthétique",
        price: 15000,
        duration: 60,
      };
      const created = await request("/services", "POST", cookies[1], payload);
      assert.equal(created.status, 201);
      const service = (await created.json()) as { id: string };
      const list = (await (
        await request("/services", "GET", cookies[0])
      ).json()) as { id: string }[];
      assert.equal(
        list.some((s) => s.id === service.id),
        false,
      );
      assert.equal(
        (await request("/services/" + service.id, "GET", cookies[0])).status,
        404,
      );
      assert.equal(
        (
          await request("/services/" + service.id, "PATCH", cookies[0], {
            name: "Compromis",
          })
        ).status,
        404,
      );
      assert.equal(
        (await request("/services/" + service.id, "DELETE", cookies[0])).status,
        404,
      );
      const intact = (await (
        await request("/services/" + service.id, "GET", cookies[1])
      ).json()) as { name: string };
      assert.equal(intact.name, payload.name);
      assert.equal((await request("/services", "GET")).status, 401);
      assert.equal(
        (
          await request("/services", "POST", cookies[0], {
            ...payload,
            instituteId: institutes[1],
          })
        ).status,
        201,
      );
      assert.equal(
        await db.service.count({ where: { instituteId: institutes[1] } }),
        1,
      );
      await db.member.updateMany({
        where: { instituteId: institutes[0] },
        data: { role: "RECEPTIONIST" },
      });
      assert.equal(
        (await request("/services", "POST", cookies[0], payload)).status,
        403,
      );
    } finally {
      await db.institute.deleteMany({ where: { id: { in: institutes } } });
      await db.user.deleteMany({ where: { email: { in: emails } } });
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.$disconnect();
    }
  },
);
