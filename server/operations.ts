import type { Express, Request, Response, NextFunction } from "express";
import type { Institute, Member, PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
import {
  BusinessError,
  statuses,
  canTransition,
  withinSchedule,
} from "./booking.js";
import { tenantWhere, canManageServices } from "./policy.js";
type AuthRequest = Request & { member?: Member & { institute: Institute } };
type Authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;
const clientSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,25}$/, "Numéro de téléphone invalide."),
  email: z.union([z.email(), z.literal("")]).default(""),
  birthDate: z
    .union([z.iso.date(), z.literal("")])
    .default("")
    .refine(
      (v) => !v || new Date(v) <= new Date(),
      "La date de naissance doit être passée.",
    ),
  marketingConsent: z.boolean().default(false),
  active: z.boolean().default(true),
});
const scheduleSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((s) => s.endMinute > s.startMinute, "La fin doit suivre le début.");
const employeeSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(25).default(""),
    job: z.string().trim().min(2).max(100),
    active: z.boolean().default(true),
    memberId: z.uuid().nullable().default(null),
    serviceIds: z.array(z.uuid()).max(200),
    schedules: z.array(scheduleSchema).min(1).max(7),
  })
  .refine(
    (e) =>
      new Set(e.schedules.map((s) => s.weekday)).size === e.schedules.length,
    "Un seul horaire par jour.",
  )
  .refine(
    (e) => new Set(e.serviceIds).size === e.serviceIds.length,
    "Prestation en double.",
  );
const bookingSchema = z.object({
  clientId: z.uuid(),
  employeeId: z.uuid(),
  serviceId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
});
const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).default(""),
  archived: z.enum(["true", "false"]).default("false"),
});
const staffInclude = {
  schedules: true,
  services: {
    include: { service: { select: { id: true, name: true, active: true } } },
  },
  absences: { orderBy: { startsAt: "asc" as const } },
};
const appointmentInclude = {
  employee: { select: { id: true, name: true, job: true } },
  client: { select: { id: true, name: true, phone: true } },
  service: { select: { id: true, name: true } },
};
function access(req: AuthRequest, roles: readonly string[]) {
  if (!roles.includes(req.member!.role))
    throw new BusinessError(403, "Votre rôle ne permet pas cette opération.");
  return req.member!;
}
export function registerOperations(
  app: Express,
  db: PrismaClient,
  authenticate: Authenticate,
) {
  const readers = ["OWNER", "MANAGER", "RECEPTIONIST"];
  app.get("/api/clients", authenticate, async (req: AuthRequest, res) => {
    const { instituteId } = access(req, readers);
    const { page, limit, search, archived } = pageSchema.parse(req.query);
    const where: Prisma.ClientWhereInput = {
      instituteId,
      active: archived !== "true",
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    };
    const [items, total] = await Promise.all([
      db.client.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { appointments: true } } },
      }),
      db.client.count({ where }),
    ]);
    res.json({ items, total, page, limit });
  });
  app.get("/api/clients/:id", authenticate, async (req: AuthRequest, res) => {
    const { instituteId } = access(req, readers);
    const client = await db.client.findFirst({
      where: tenantWhere(instituteId, String(req.params.id)),
      include: {
        appointments: {
          orderBy: { startsAt: "desc" },
          take: 100,
          include: appointmentInclude,
        },
      },
    });
    if (!client) throw new BusinessError(404, "Client introuvable.");
    res.json(client);
  });
  app.post("/api/clients", authenticate, async (req: AuthRequest, res) => {
    const { instituteId } = access(req, readers);
    const { email, birthDate, ...data } = clientSchema.parse(req.body);
    res.status(201).json(
      await db.client.create({
        data: {
          ...data,
          instituteId,
          email: email || null,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
      }),
    );
  });
  app.patch("/api/clients/:id", authenticate, async (req: AuthRequest, res) => {
    const { instituteId } = access(req, readers);
    const { email, birthDate, ...data } = clientSchema.parse(req.body);
    const result = await db.client.updateMany({
      where: tenantWhere(instituteId, String(req.params.id)),
      data: {
        ...data,
        email: email || null,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });
    if (!result.count) throw new BusinessError(404, "Client introuvable.");
    res.json({ ok: true });
  });
  app.get("/api/employees", authenticate, async (req: AuthRequest, res) => {
    const member = access(req, [...readers, "PRACTITIONER"]);
    const { page, limit, search, archived } = pageSchema.parse(req.query);
    const where = {
      instituteId: member.instituteId,
      active: archived !== "true",
      name: { contains: search, mode: "insensitive" as const },
      ...(member.role === "PRACTITIONER" ? { memberId: member.id } : {}),
    };
    const [items, total] = await Promise.all([
      db.employee.findMany({
        where,
        include: staffInclude,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.employee.count({ where }),
    ]);
    res.json({ items, total, page, limit });
  });
  async function saveEmployee(req: AuthRequest) {
    const { instituteId } = access(req, ["OWNER", "MANAGER"]);
    const data = employeeSchema.parse(req.body);
    const id = req.params.id ? String(req.params.id) : undefined;
    return db.$transaction(
      async (tx) => {
        if (
          id &&
          !(await tx.employee.findFirst({
            where: tenantWhere(instituteId, id),
          }))
        )
          throw new BusinessError(404, "Collaborateur introuvable.");
        if (
          (await tx.service.count({
            where: { instituteId, id: { in: data.serviceIds } },
          })) !== data.serviceIds.length
        )
          throw new BusinessError(
            400,
            "Une prestation ne fait pas partie de votre institut.",
          );
        if (
          data.memberId &&
          !(await tx.member.findFirst({
            where: { instituteId, id: data.memberId, role: "PRACTITIONER" },
          }))
        )
          throw new BusinessError(
            400,
            "Le membre doit être un praticien de cet institut.",
          );
        if (id) {
          await tx.$queryRaw`SELECT "id" FROM "Employee" WHERE "id"=${id} AND "instituteId"=${instituteId} FOR UPDATE`;
          const upcoming = await tx.appointment.findMany({
            where: {
              instituteId,
              employeeId: id,
              endsAt: { gt: new Date() },
              status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
            },
          });
          if (
            upcoming.some(
              (a) =>
                !data.active ||
                (a.serviceId !== null &&
                  !data.serviceIds.includes(a.serviceId)) ||
                !withinSchedule(a.startsAt, a.endsAt, data.schedules),
            )
          )
            throw new BusinessError(
              409,
              "Des rendez-vous sont déjà prévus sur ces horaires. Réaffectez-les ou annulez-les avant de modifier la disponibilité.",
            );
        }
        const { serviceIds, schedules, ...employee } = data;
        const saved = id
          ? await tx.employee.update({
              where: { instituteId_id: { instituteId, id } },
              data: employee,
            })
          : await tx.employee.create({ data: { ...employee, instituteId } });
        await tx.employeeService.deleteMany({
          where: { instituteId, employeeId: saved.id },
        });
        await tx.employeeSchedule.deleteMany({
          where: { instituteId, employeeId: saved.id },
        });
        await tx.employeeService.createMany({
          data: serviceIds.map((serviceId) => ({
            instituteId,
            employeeId: saved.id,
            serviceId,
          })),
        });
        await tx.employeeSchedule.createMany({
          data: schedules.map((s) => ({
            ...s,
            instituteId,
            employeeId: saved.id,
          })),
        });
        return tx.employee.findUniqueOrThrow({
          where: { id: saved.id },
          include: staffInclude,
        });
      },
      { isolationLevel: "Serializable" },
    );
  }
  app.post("/api/employees", authenticate, async (req: AuthRequest, res) => {
    res.status(201).json(await saveEmployee(req));
  });
  app.patch(
    "/api/employees/:id",
    authenticate,
    async (req: AuthRequest, res) => {
      res.json(await saveEmployee(req));
    },
  );
  app.post(
    "/api/employees/:id/absences",
    authenticate,
    async (req: AuthRequest, res) => {
      const { instituteId } = access(req, ["OWNER", "MANAGER"]);
      const employeeId = String(req.params.id);
      const input = z
        .object({
          startsAt: z.iso.datetime({ offset: true }),
          endsAt: z.iso.datetime({ offset: true }),
          reason: z.string().trim().max(200).default(""),
        })
        .parse(req.body);
      const startsAt = new Date(input.startsAt),
        endsAt = new Date(input.endsAt);
      if (endsAt <= startsAt)
        throw new BusinessError(
          400,
          "La fin de l’absence doit suivre son début.",
        );
      const result = await db.$transaction(
        async (tx) => {
          const employee = await tx.employee.findFirst({
            where: tenantWhere(instituteId, employeeId),
          });
          if (!employee)
            throw new BusinessError(404, "Collaborateur introuvable.");
          await tx.$queryRaw`SELECT "id" FROM "Employee" WHERE "id"=${employeeId} AND "instituteId"=${instituteId} FOR UPDATE`;
          if (
            await tx.appointment.count({
              where: {
                instituteId,
                employeeId,
                status: { notIn: ["CANCELLED", "NO_SHOW"] },
                startsAt: { lt: endsAt },
                endsAt: { gt: startsAt },
              },
            })
          )
            throw new BusinessError(
              409,
              "Un rendez-vous existe pendant cette absence.",
            );
          return tx.employeeAbsence.create({
            data: {
              instituteId,
              employeeId,
              startsAt,
              endsAt,
              reason: input.reason,
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
      res.status(201).json(result);
    },
  );
  app.delete(
    "/api/employees/:id/absences/:absenceId",
    authenticate,
    async (req: AuthRequest, res) => {
      const { instituteId } = access(req, ["OWNER", "MANAGER"]);
      const result = await db.employeeAbsence.deleteMany({
        where: {
          instituteId,
          employeeId: String(req.params.id),
          id: String(req.params.absenceId),
        },
      });
      if (!result.count) throw new BusinessError(404, "Absence introuvable.");
      res.json({ ok: true });
    },
  );
  app.get("/api/appointments", authenticate, async (req: AuthRequest, res) => {
    const member = access(req, [...readers, "PRACTITIONER"]);
    const query = z
      .object({
        from: z.iso.datetime({ offset: true }),
        to: z.iso.datetime({ offset: true }),
        employeeId: z.uuid().optional(),
        status: z.enum(statuses).optional(),
      })
      .parse(req.query);
    const from = new Date(query.from),
      to = new Date(query.to);
    if (to <= from || to.getTime() - from.getTime() > 93 * 86400000)
      throw new BusinessError(
        400,
        "Choisissez une période de 93 jours maximum.",
      );
    const items = await db.appointment.findMany({
      where: {
        instituteId: member.instituteId,
        startsAt: { gte: from, lt: to },
        employeeId: query.employeeId,
        status: query.status,
        ...(member.role === "PRACTITIONER"
          ? { employee: { memberId: member.id } }
          : {}),
      },
      include: appointmentInclude,
      orderBy: { startsAt: "asc" },
      take: 1001,
    });
    if (items.length > 1000)
      throw new BusinessError(
        400,
        "Réduisez la période pour afficher moins de 1 000 rendez-vous.",
      );
    res.json(items);
  });
  async function bookingContext(
    tx: Prisma.TransactionClient,
    instituteId: string,
    input: z.infer<typeof bookingSchema>,
    excludeId?: string,
  ) {
    const [client, service, employee] = await Promise.all([
      tx.client.findFirst({
        where: { instituteId, id: input.clientId, active: true },
      }),
      tx.service.findFirst({
        where: { instituteId, id: input.serviceId, active: true },
      }),
      tx.employee.findFirst({
        where: { instituteId, id: input.employeeId, active: true },
        include: { schedules: true, services: true },
      }),
    ]);
    if (!client || !service || !employee)
      throw new BusinessError(
        404,
        "Client, prestation ou collaborateur introuvable dans votre institut.",
      );
    await tx.$queryRaw`SELECT "id" FROM "Employee" WHERE "id"=${employee.id} AND "instituteId"=${instituteId} FOR UPDATE`;
    if (!employee.services.some((s) => s.serviceId === service.id))
      throw new BusinessError(
        400,
        "Ce collaborateur n’est pas habilité pour cette prestation.",
      );
    const startsAt = new Date(input.startsAt),
      endsAt = new Date(startsAt.getTime() + service.duration * 60000);
    if (startsAt < new Date())
      throw new BusinessError(400, "Le rendez-vous doit être dans le futur.");
    if (startsAt.getUTCSeconds() !== 0 || startsAt.getUTCMilliseconds() !== 0)
      throw new BusinessError(400, "Choisissez une heure sans secondes.");
    if (!withinSchedule(startsAt, endsAt, employee.schedules))
      throw new BusinessError(
        409,
        "Ce créneau est en dehors des horaires de travail.",
      );
    const conflict = {
      instituteId,
      employeeId: employee.id,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    };
    if (
      (await tx.employeeAbsence.count({ where: conflict })) ||
      (await tx.appointment.count({
        where: {
          ...conflict,
          id: { not: excludeId },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
      }))
    )
      throw new BusinessError(409, "Ce créneau n’est plus disponible.");
    return {
      ...input,
      instituteId,
      customerName: client.name,
      phone: client.phone,
      serviceName: service.name,
      price: service.price,
      duration: service.duration,
      startsAt,
      endsAt,
    };
  }
  app.post("/api/appointments", authenticate, async (req: AuthRequest, res) => {
    const { instituteId } = access(req, readers);
    const input = bookingSchema.parse(req.body);
    res.status(201).json(
      await db.$transaction(
        async (tx) =>
          tx.appointment.create({
            data: await bookingContext(tx, instituteId, input),
            include: appointmentInclude,
          }),
        { isolationLevel: "Serializable" },
      ),
    );
  });
  app.patch(
    "/api/appointments/:id",
    authenticate,
    async (req: AuthRequest, res) => {
      const { instituteId } = access(req, readers);
      const id = String(req.params.id),
        input = bookingSchema.parse(req.body);
      res.json(
        await db.$transaction(
          async (tx) => {
            const old = await tx.appointment.findFirst({
              where: tenantWhere(instituteId, id),
            });
            if (!old) throw new BusinessError(404, "Rendez-vous introuvable.");
            if (!["PENDING", "CONFIRMED"].includes(old.status))
              throw new BusinessError(
                409,
                "Ce rendez-vous ne peut plus être déplacé.",
              );
            return tx.appointment.update({
              where: { id },
              data: await bookingContext(tx, instituteId, input, id),
              include: appointmentInclude,
            });
          },
          { isolationLevel: "Serializable" },
        ),
      );
    },
  );
  app.patch(
    "/api/appointments/:id/status",
    authenticate,
    async (req: AuthRequest, res) => {
      const member = access(req, [...readers, "PRACTITIONER"]);
      const { status } = z.object({ status: z.enum(statuses) }).parse(req.body);
      const id = String(req.params.id);
      const result = await db.$transaction(
        async (tx) => {
          const old = await tx.appointment.findFirst({
            where: {
              ...tenantWhere(member.instituteId, id),
              ...(member.role === "PRACTITIONER"
                ? { employee: { memberId: member.id } }
                : {}),
            },
          });
          if (!old) throw new BusinessError(404, "Rendez-vous introuvable.");
          if (
            member.role === "PRACTITIONER" &&
            !["IN_PROGRESS", "COMPLETED"].includes(status)
          )
            throw new BusinessError(
              403,
              "Vous pouvez uniquement démarrer ou terminer vos propres rendez-vous.",
            );
          if (!canTransition(old.status, status))
            throw new BusinessError(
              409,
              "Ce changement de statut n’est pas autorisé.",
            );
          if (
            ["IN_PROGRESS", "COMPLETED", "NO_SHOW"].includes(status) &&
            old.startsAt > new Date()
          )
            throw new BusinessError(
              409,
              "Ce rendez-vous n’a pas encore commencé.",
            );
          return tx.appointment.update({
            where: { id },
            data: { status },
            include: appointmentInclude,
          });
        },
        { isolationLevel: "Serializable" },
      );
      res.json(result);
    },
  );
  app.get("/api/availability", authenticate, async (req: AuthRequest, res) => {
    const { instituteId } = access(req, readers);
    const { date, employeeId, serviceId } = z
      .object({ date: z.iso.date(), employeeId: z.uuid(), serviceId: z.uuid() })
      .parse(req.query);
    const [service, employee] = await Promise.all([
      db.service.findFirst({
        where: { instituteId, id: serviceId, active: true },
      }),
      db.employee.findFirst({
        where: { instituteId, id: employeeId, active: true },
        include: { schedules: true, services: true },
      }),
    ]);
    if (!service || !employee)
      throw new BusinessError(404, "Prestation ou collaborateur introuvable.");
    if (!employee.services.some((s) => s.serviceId === serviceId))
      throw new BusinessError(400, "Ce collaborateur n’est pas habilité.");
    const day = new Date(date + "T00:00:00Z");
    const next = new Date(day.getTime() + 86400000);
    const schedule = employee.schedules.find(
      (s) => s.weekday === day.getUTCDay(),
    );
    if (!schedule) {
      res.json([]);
      return;
    }
    const [appointments, absences] = await Promise.all([
      db.appointment.findMany({
        where: {
          instituteId,
          employeeId,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          startsAt: { lt: next },
          endsAt: { gt: day },
        },
      }),
      db.employeeAbsence.findMany({
        where: {
          instituteId,
          employeeId,
          startsAt: { lt: next },
          endsAt: { gt: day },
        },
      }),
    ]);
    const slots: string[] = [];
    for (
      let minute = schedule.startMinute;
      minute + service.duration <= schedule.endMinute;
      minute += 15
    ) {
      const start = new Date(day.getTime() + minute * 60000),
        end = new Date(start.getTime() + service.duration * 60000);
      if (
        start > new Date() &&
        ![...appointments, ...absences].some(
          (a) => a.startsAt < end && a.endsAt > start,
        )
      )
        slots.push(start.toISOString());
    }
    res.json(slots);
  });
}
