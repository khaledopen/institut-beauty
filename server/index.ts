import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import {
  PrismaClient,
  Prisma,
  type Member,
  type Institute,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { canManageServices, tenantWhere } from "./policy.js";

export const db = new PrismaClient();
export const app = express();
app.use(helmet(), express.json({ limit: "100kb" }), cookieParser());
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120 }));
const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 20 });
app.use("/api/auth", authLimit);
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.get("origin") !== (process.env.APP_ORIGIN || "http://localhost:5173")
  ) {
    res.status(403).json({ error: "Origine de la requête refusée." });
    return;
  }
  next();
});
type AuthRequest = Request & { member?: Member & { institute: Institute } };
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.belleza_session;
  if (typeof token !== "string") {
    res.status(401).json({ error: "Connectez-vous pour continuer." });
    return;
  }
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { member: { include: { institute: true } } },
  });
  if (!session || session.expiresAt < new Date()) {
    res.status(401).json({ error: "Votre session a expiré." });
    return;
  }
  req.member = session.member;
  next();
}
async function sessionCookie(res: Response, userId: string, memberId: string) {
  const token = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      tokenHash: hash(token),
      userId,
      memberId,
      expiresAt: new Date(Date.now() + 7 * 86400_000),
    },
  });
  res.cookie("belleza_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400_000,
  });
}
const credentials = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
});
app.get("/api/health", async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});
app.post("/api/auth/register", async (req, res) => {
  const input = credentials
    .extend({
      name: z.string().trim().min(2).max(100),
      instituteName: z.string().trim().min(2).max(100),
    })
    .parse(req.body);
  const slug =
    input.instituteName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    randomBytes(3).toString("hex");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, name: input.name, passwordHash },
    });
    const institute = await tx.institute.create({
      data: { name: input.instituteName, slug },
    });
    const member = await tx.member.create({
      data: { userId: user.id, instituteId: institute.id, role: "OWNER" },
    });
    return { user, member };
  });
  await sessionCookie(res, result.user.id, result.member.id);
  res.status(201).json({ ok: true });
});
app.post("/api/auth/login", async (req, res) => {
  const input = z
    .object({
      email: z.email().transform((v) => v.toLowerCase()),
      password: z.string().max(128),
    })
    .parse(req.body);
  const user = await db.user.findUnique({
    where: { email: input.email },
    include: { memberships: { orderBy: { id: "asc" } } },
  });
  const valid = await bcrypt.compare(
    input.password,
    user?.passwordHash ||
      "$2b$12$KbQiTgCG.DxTNmbKKrMGV.RBkSKLU4ljPeShPpITNhHDPPVH79ViK",
  );
  if (!user || !valid || !user.memberships.length) {
    res
      .status(401)
      .json({ error: "Adresse e-mail ou mot de passe incorrect." });
    return;
  }
  await sessionCookie(res, user.id, user.memberships[0].id);
  res.json({ ok: true });
});
app.post("/api/auth/logout", async (req, res) => {
  if (typeof req.cookies.belleza_session === "string")
    await db.session.deleteMany({
      where: { tokenHash: hash(req.cookies.belleza_session) },
    });
  res.clearCookie("belleza_session", { path: "/" }).json({ ok: true });
});
app.get("/api/me", authenticate, async (req: AuthRequest, res) => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: req.member!.userId },
    select: { name: true, email: true },
  });
  res.json({ user, institute: req.member!.institute, role: req.member!.role });
});
const serviceInput = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().max(1000).default(""),
  category: z.string().trim().min(2).max(100),
  price: z.number().int().min(0).max(100_000_000),
  duration: z.number().int().min(5).max(480),
  active: z.boolean().default(true),
});
app.get("/api/services", authenticate, async (req: AuthRequest, res) => {
  res.json(
    await db.service.findMany({
      where: tenantWhere(req.member!.instituteId),
      orderBy: { name: "asc" },
      take: 200,
    }),
  );
});
app.get("/api/services/:id", authenticate, async (req: AuthRequest, res) => {
  const service = await db.service.findFirst({
    where: tenantWhere(req.member!.instituteId, String(req.params.id)),
  });
  if (!service) {
    res.status(404).json({ error: "Prestation introuvable." });
    return;
  }
  res.json(service);
});
app.post("/api/services", authenticate, async (req: AuthRequest, res) => {
  if (!canManageServices(req.member!.role)) {
    res
      .status(403)
      .json({ error: "Vous ne pouvez pas modifier le catalogue." });
    return;
  }
  res
    .status(201)
    .json(
      await db.service.create({
        data: {
          ...serviceInput.parse(req.body),
          instituteId: req.member!.instituteId,
        },
      }),
    );
});
app.patch("/api/services/:id", authenticate, async (req: AuthRequest, res) => {
  if (!canManageServices(req.member!.role)) {
    res.status(403).json({ error: "Accès refusé." });
    return;
  }
  const result = await db.service.updateMany({
    where: tenantWhere(req.member!.instituteId, String(req.params.id)),
    data: serviceInput.partial().parse(req.body),
  });
  if (!result.count) {
    res.status(404).json({ error: "Prestation introuvable." });
    return;
  }
  res.json({ ok: true });
});
app.delete("/api/services/:id", authenticate, async (req: AuthRequest, res) => {
  if (!canManageServices(req.member!.role)) {
    res.status(403).json({ error: "Accès refusé." });
    return;
  }
  const result = await db.service.deleteMany({
    where: tenantWhere(req.member!.instituteId, String(req.params.id)),
  });
  if (!result.count) {
    res.status(404).json({ error: "Prestation introuvable." });
    return;
  }
  res.json({ ok: true });
});
app.get("/api/dashboard", authenticate, async (req: AuthRequest, res) => {
  const instituteId = req.member!.instituteId;
  const [services, clients, appointments] = await Promise.all([
    db.service.count({ where: { instituteId, active: true } }),
    db.client.count({ where: { instituteId } }),
    db.appointment.findMany({
      where: { instituteId, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 8,
    }),
  ]);
  res.json({ services, clients, appointments });
});
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    res
      .status(400)
      .json({ error: error.issues[0]?.message || "Données invalides." });
    return;
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    res.status(409).json({ error: "Cette adresse e-mail est déjà utilisée." });
    return;
  }
  console.error(error instanceof Error ? error.name : "API error");
  res
    .status(503)
    .json({
      error:
        "Service indisponible. Vérifiez la connexion à PostgreSQL et réessayez.",
    });
});
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
    console.log("BELLEZA API : http://127.0.0.1:3001"),
  );
  process.on("SIGTERM", () => server.close(() => void db.$disconnect()));
}
