import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Users,
  UserRound,
  CalendarDays,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Mail,
  Phone,
  Archive,
  ArrowUpRight,
} from "lucide-react";
import { api, type Me, type Service } from "./api";
import { Modal } from "./ui";
import "./operations.css";

type Page<T> = { items: T[]; total: number; page: number; limit: number };
type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  marketingConsent: boolean;
  active: boolean;
  _count?: { appointments: number };
  appointments?: Appointment[];
};
type Schedule = { weekday: number; startMinute: number; endMinute: number };
type Employee = {
  id: string;
  name: string;
  phone: string;
  job: string;
  active: boolean;
  memberId: string | null;
  schedules: Schedule[];
  services: {
    serviceId: string;
    service: { id: string; name: string; active: boolean };
  }[];
  absences: { id: string; startsAt: string; endsAt: string; reason: string }[];
};
type Appointment = {
  id: string;
  clientId: string | null;
  employeeId: string | null;
  serviceId: string | null;
  customerName: string;
  phone: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  price: number;
  duration: number;
  status: string;
  employee: { id: string; name: string } | null;
};
const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  NO_SHOW: "Absent",
};
const fcfa = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const time = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Abidjan",
  }).format(new Date(value));
const minuteTime = (value: number) =>
  String(Math.floor(value / 60)).padStart(2, "0") +
  ":" +
  String(value % 60).padStart(2, "0");
const toMinutes = (value: string) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
const dayString = (date: Date) => date.toISOString().slice(0, 10);
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone: "Africa/Abidjan",
  }).format(new Date(value));
const demoServices: Service[] = [
  {
    id: "s1",
    name: "Soin visage éclat",
    category: "Esthétique",
    duration: 60,
    price: 15000,
    description: "",
    active: true,
  },
  {
    id: "s2",
    name: "Manucure semi-permanente",
    category: "Onglerie",
    duration: 45,
    price: 12000,
    description: "",
    active: true,
  },
];
const demoClients: Client[] = [
  "Aminata Traoré",
  "Sarah Kouamé",
  "Mariam Diabaté",
  "Grâce N’Guessan",
].map((name, i) => ({
  id: "c" + i,
  name,
  phone: "070000000" + i,
  email: null,
  birthDate: null,
  marketingConsent: false,
  active: true,
  _count: { appointments: i + 1 },
}));
const demoEmployees: Employee[] = [
  "Fatou Bamba",
  "Marie Kouassi",
  "Aïcha Koné",
].map((name, i) => ({
  id: "e" + i,
  name,
  phone: "",
  job: ["Esthéticienne", "Prothésiste ongulaire", "Responsable"][i],
  active: true,
  memberId: null,
  schedules: [1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    startMinute: 540,
    endMinute: 1080,
  })),
  services: demoServices.map((service) => ({ serviceId: service.id, service })),
  absences: [],
}));
const demoAppointments: Appointment[] = demoClients.map((client, i) => {
  const service = demoServices[i % 2],
    employee = demoEmployees[i % 3];
  const startsAt =
    dayString(new Date()) +
    "T" +
    ["09:00", "10:00", "11:30", "14:00"][i] +
    ":00Z";
  return {
    id: "a" + i,
    clientId: client.id,
    employeeId: employee.id,
    serviceId: service.id,
    customerName: client.name,
    phone: client.phone,
    serviceName: service.name,
    startsAt,
    endsAt: new Date(
      new Date(startsAt).getTime() + service.duration * 60000,
    ).toISOString(),
    price: service.price,
    duration: service.duration,
    status: i === 1 ? "PENDING" : "CONFIRMED",
    employee,
  };
});
function useIdentity(demo: boolean) {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<Me>("/me"),
    enabled: !demo,
  });
}
function DemoPrompt() {
  return (
    <div className="ops-demo-note">
      Les données de cet aperçu sont illustratives.{" "}
      <Link to="/connexion">
        Connectez-vous pour enregistrer vos données <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
function FormErrors({
  errors,
}: {
  errors: Record<string, { message?: string } | undefined>;
}) {
  return (
    <>
      {Object.values(errors)
        .filter(Boolean)
        .map((error, i) => (
          <p className="error" key={i}>
            {error?.message}
          </p>
        ))}
    </>
  );
}
function Feedback({
  pending,
  error,
  empty,
}: {
  pending: boolean;
  error: Error | null;
  empty: boolean;
}) {
  return pending ? (
    <div className="empty">Chargement…</div>
  ) : error ? (
    <p className="error" role="alert">
      {error.message}
    </p>
  ) : empty ? (
    <div className="empty">
      <CalendarDays size={32} />
      <h3>Aucun élément pour le moment.</h3>
      <p>Ajoutez vos premières informations pour organiser votre institut.</p>
    </div>
  ) : null;
}
function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <div className="ops-pagination">
      <span>
        {total} résultat{total > 1 ? "s" : ""} · Page {page} sur {pages}
      </span>
      <button
        aria-label="Page précédente"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={19} />
      </button>
      <button
        aria-label="Page suivante"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={19} />
      </button>
    </div>
  );
}
const clientSchema = z.object({
  name: z.string().trim().min(2, "Renseignez un nom."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,25}$/, "Numéro de téléphone invalide."),
  email: z.union([z.email("Adresse e-mail invalide."), z.literal("")]),
  birthDate: z.union([z.iso.date(), z.literal("")]),
  marketingConsent: z.boolean(),
  active: z.boolean(),
});
type ClientForm = z.infer<typeof clientSchema>;
export function ClientsPage({ demo = false }: { demo?: boolean }) {
  const identity = useIdentity(demo);
  const canEdit =
    demo ||
    ["OWNER", "MANAGER", "RECEPTIONIST"].includes(identity.data?.role ?? "");
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false),
    [editing, setEditing] = useState<Client | null | undefined>(),
    [detail, setDetail] = useState<Client | null>(null),
    [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: ["clients", page, search, archived],
    queryFn: () =>
      api<Page<Client>>(
        `/clients?page=${page}&search=${encodeURIComponent(search)}&archived=${archived}`,
      ),
    enabled: !demo,
  });
  const details = useQuery({
    queryKey: ["client", detail?.id],
    queryFn: () => api<Client>("/clients/" + detail!.id),
    enabled: !!detail && !demo,
  });
  const cache = useQueryClient();
  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      birthDate: "",
      marketingConsent: false,
      active: true,
    },
  });
  const save = useMutation({
    mutationFn: (values: ClientForm) =>
      api("/clients" + (editing?.id ? "/" + editing.id : ""), {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      setEditing(undefined);
      setMessage("La fiche client a été enregistrée.");
      void cache.invalidateQueries({ queryKey: ["clients"] });
      void cache.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const list = demo
    ? demoClients.filter(
        (c) => !archived && c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : (query.data?.items ?? []);
  function open(client: Client | null) {
    form.reset(
      client
        ? {
            name: client.name,
            phone: client.phone,
            email: client.email ?? "",
            birthDate: client.birthDate?.slice(0, 10) ?? "",
            marketingConsent: client.marketingConsent,
            active: client.active,
          }
        : {
            name: "",
            phone: "",
            email: "",
            birthDate: "",
            marketingConsent: false,
            active: true,
          },
    );
    save.reset();
    setEditing(client);
  }
  return (
    <main className="dashboard">
      <div className="page-heading">
        <div className="eyebrow">DES LIENS QUI DURENT</div>
        <div>
          <h1>Votre clientèle</h1>
          {canEdit &&
            (demo ? (
              <Link className="button dark" to="/connexion">
                <Plus size={18} />
                Ajouter un client
              </Link>
            ) : (
              <button className="button dark" onClick={() => open(null)}>
                <Plus size={18} />
                Ajouter un client
              </button>
            ))}
        </div>
        <p>
          Retrouvez chaque cliente, chaque client et leur histoire avec vous.
        </p>
      </div>
      {demo && <DemoPrompt />}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <section className="panel ops-panel">
        <div className="ops-toolbar">
          <label className="search-input">
            <Search size={18} />
            <input
              aria-label="Rechercher un client"
              value={search}
              placeholder="Nom ou téléphone…"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="ops-inline-check">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => {
                setArchived(e.target.checked);
                setPage(1);
              }}
            />
            Clients archivés
          </label>
        </div>
        <Feedback
          pending={!demo && query.isPending}
          error={query.error}
          empty={!list.length && !query.isError && !(!demo && query.isPending)}
        />
        {!!list.length && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>CONTACT</th>
                  <th>RENDEZ-VOUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {list.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="ops-person">
                        <span className="ops-initials">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <b>{client.name}</b>
                          <small>
                            {client.marketingConsent
                              ? "Offres acceptées"
                              : "Sans communication promotionnelle"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{client.phone}</div>
                      <small>{client.email || "E-mail non renseigné"}</small>
                    </td>
                    <td>{client._count?.appointments ?? 0}</td>
                    <td>
                      <div className="ops-row-actions">
                        <button onClick={() => setDetail(client)}>
                          Voir la fiche
                        </button>
                        {canEdit && !demo && (
                          <button onClick={() => open(client)}>Modifier</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          total={demo ? list.length : (query.data?.total ?? 0)}
          onChange={setPage}
        />
      </section>
      {editing !== undefined && (
        <Modal label="Fiche client" onClose={() => setEditing(undefined)}>
          <section className="modal">
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setEditing(undefined)}
            >
              <X />
            </button>
            <div className="eyebrow">RELATION CLIENT</div>
            <h2>
              {editing ? "Modifier la fiche" : "Bienvenue à votre cliente."}
            </h2>
            <form onSubmit={form.handleSubmit((values) => save.mutate(values))}>
              <label>
                Nom complet
                <input autoFocus {...form.register("name")} />
              </label>
              <label>
                Téléphone
                <input
                  type="tel"
                  {...form.register("phone")}
                  placeholder="+225 07…"
                />
              </label>
              <label>
                E-mail facultatif
                <input type="email" {...form.register("email")} />
              </label>
              <label>
                Date de naissance facultative
                <input
                  type="date"
                  max={dayString(new Date())}
                  {...form.register("birthDate")}
                />
              </label>
              <label className="check-label">
                <input type="checkbox" {...form.register("marketingConsent")} />
                Accepte les offres promotionnelles
              </label>
              {editing && (
                <label className="check-label">
                  <input type="checkbox" {...form.register("active")} />
                  Fiche active (décocher pour archiver)
                </label>
              )}
              <FormErrors errors={form.formState.errors} />
              {save.isError && (
                <p className="error" role="alert">
                  {save.error.message}
                </p>
              )}
              <button className="button dark" disabled={save.isPending}>
                <Check size={17} />
                {save.isPending ? "Enregistrement…" : "Enregistrer la fiche"}
              </button>
            </form>
          </section>
        </Modal>
      )}
      {detail && (
        <Modal
          label={"Fiche de " + detail.name}
          onClose={() => setDetail(null)}
        >
          <section className="modal ops-detail">
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setDetail(null)}
            >
              <X />
            </button>
            <div className="eyebrow">FICHE CLIENT</div>
            <h2>{detail.name}</h2>
            <p>
              <Phone size={16} />
              {detail.phone}
            </p>
            {detail.email && (
              <p>
                <Mail size={16} />
                {detail.email}
              </p>
            )}
            <h3>Historique des rendez-vous</h3>
            <Feedback
              pending={!demo && details.isPending}
              error={details.error}
              empty={
                demo
                  ? false
                  : !details.data?.appointments?.length &&
                    !details.isPending &&
                    !details.isError
              }
            />
            {(demo
              ? demoAppointments.filter((a) => a.clientId === detail.id)
              : (details.data?.appointments ?? [])
            ).map((a) => (
              <article className="ops-history" key={a.id}>
                <b>{a.serviceName}</b>
                <span>
                  {dateLabel(a.startsAt)} · {time(a.startsAt)}
                </span>
                <span className={"ops-status status-" + a.status}>
                  {statusLabels[a.status]}
                </span>
                <small>
                  {fcfa(a.price)} · Tarif réservé, pas un encaissement
                </small>
              </article>
            ))}
          </section>
        </Modal>
      )}
    </main>
  );
}

const employeeFormSchema = z
  .object({
    name: z.string().trim().min(2, "Renseignez un nom."),
    phone: z.string().max(25),
    job: z.string().trim().min(2, "Renseignez le poste."),
    active: z.boolean(),
    serviceIds: z.array(z.string()),
    workDays: z.array(z.number()).min(1, "Sélectionnez un jour travaillé."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((v) => toMinutes(v.endTime) > toMinutes(v.startTime), {
    message: "La fin doit suivre le début.",
    path: ["endTime"],
  });
type EmployeeForm = z.infer<typeof employeeFormSchema>;
export function EmployeesPage({ demo = false }: { demo?: boolean }) {
  const identity = useIdentity(demo),
    cache = useQueryClient();
  const canEdit =
    demo || ["OWNER", "MANAGER"].includes(identity.data?.role ?? "");
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false),
    [editing, setEditing] = useState<Employee | null | undefined>(),
    [absence, setAbsence] = useState<Employee | null>(null),
    [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: ["employees", page, search, archived],
    queryFn: () =>
      api<Page<Employee>>(
        `/employees?page=${page}&search=${encodeURIComponent(search)}&archived=${archived}`,
      ),
    enabled: !demo,
  });
  const services = useQuery({
    queryKey: ["services"],
    queryFn: () => api<Service[]>("/services"),
    enabled: !demo,
  });
  const form = useForm<EmployeeForm>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      job: "",
      active: true,
      serviceIds: [],
      workDays: [1, 2, 3, 4, 5, 6],
      startTime: "09:00",
      endTime: "18:00",
    },
  });
  const save = useMutation({
    mutationFn: (v: EmployeeForm) =>
      api("/employees" + (editing?.id ? "/" + editing.id : ""), {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify({
          name: v.name,
          phone: v.phone,
          job: v.job,
          active: v.active,
          memberId: editing?.memberId ?? null,
          serviceIds: v.serviceIds,
          schedules: v.workDays.map((weekday) => ({
            weekday,
            startMinute: toMinutes(v.startTime),
            endMinute: toMinutes(v.endTime),
          })),
        }),
      }),
    onSuccess: () => {
      setEditing(undefined);
      setMessage("Votre collaborateur a été enregistré.");
      void cache.invalidateQueries({ queryKey: ["employees"] });
      void cache.invalidateQueries({ queryKey: ["availability"] });
    },
  });
  const absForm = useForm<{
    startsAt: string;
    endsAt: string;
    reason: string;
  }>();
  const absSave = useMutation({
    mutationFn: (v: { startsAt: string; endsAt: string; reason: string }) =>
      api("/employees/" + absence!.id + "/absences", {
        method: "POST",
        body: JSON.stringify({
          ...v,
          startsAt: v.startsAt + ":00Z",
          endsAt: v.endsAt + ":00Z",
        }),
      }),
    onSuccess: () => {
      setAbsence(null);
      setMessage("L’absence a été enregistrée.");
      void cache.invalidateQueries({ queryKey: ["employees"] });
      void cache.invalidateQueries({ queryKey: ["availability"] });
    },
  });
  const absRemove = useMutation({
    mutationFn: ({ employeeId, id }: { employeeId: string; id: string }) =>
      api(`/employees/${employeeId}/absences/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["employees"] });
      void cache.invalidateQueries({ queryKey: ["availability"] });
    },
  });
  const list = demo
    ? demoEmployees.filter(
        (e) => !archived && e.name.toLowerCase().includes(search.toLowerCase()),
      )
    : (query.data?.items ?? []);
  function open(employee: Employee | null) {
    const schedule = employee?.schedules[0];
    form.reset({
      name: employee?.name ?? "",
      phone: employee?.phone ?? "",
      job: employee?.job ?? "",
      active: employee?.active ?? true,
      serviceIds: employee?.services.map((s) => s.serviceId) ?? [],
      workDays: employee?.schedules.map((s) => s.weekday) ?? [1, 2, 3, 4, 5, 6],
      startTime: minuteTime(schedule?.startMinute ?? 540),
      endTime: minuteTime(schedule?.endMinute ?? 1080),
    });
    save.reset();
    setEditing(employee);
  }
  return (
    <main className="dashboard">
      <div className="page-heading">
        <div className="eyebrow">LE TALENT AU CŒUR DE VOTRE INSTITUT</div>
        <div>
          <h1>Votre équipe</h1>
          {canEdit &&
            (demo ? (
              <Link className="button dark" to="/connexion">
                <Plus size={18} />
                Ajouter un collaborateur
              </Link>
            ) : (
              <button className="button dark" onClick={() => open(null)}>
                <Plus size={18} />
                Ajouter un collaborateur
              </button>
            ))}
        </div>
        <p>Les bonnes personnes, les bons horaires, les bonnes prestations.</p>
      </div>
      {demo && <DemoPrompt />}
      {message && <p className="success">{message}</p>}
      <section className="panel ops-panel">
        <div className="ops-toolbar">
          <label className="search-input">
            <Search size={18} />
            <input
              aria-label="Rechercher un collaborateur"
              placeholder="Rechercher dans votre équipe…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="ops-inline-check">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => {
                setArchived(e.target.checked);
                setPage(1);
              }}
            />
            Archivés
          </label>
        </div>
        <Feedback
          pending={!demo && query.isPending}
          error={query.error}
          empty={!list.length && !query.isError && !(!demo && query.isPending)}
        />
        <div className="ops-staff-grid">
          {list.map((employee) => (
            <article key={employee.id}>
              <div className="ops-person">
                <span className="ops-initials">
                  {employee.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <h3>{employee.name}</h3>
                  <p>{employee.job}</p>
                </div>
              </div>
              {employee.phone && (
                <p className="ops-phone">
                  <Phone size={15} />
                  {employee.phone}
                </p>
              )}
              <div className="ops-tags">
                {employee.services.map((s) => (
                  <span key={s.serviceId}>{s.service.name}</span>
                ))}
              </div>
              <h4>Horaires · Abidjan (UTC)</h4>
              <div className="ops-schedules">
                {employee.schedules
                  .slice()
                  .sort((a, b) => a.weekday - b.weekday)
                  .map((s) => (
                    <span key={s.weekday}>
                      <b>{days[s.weekday]}</b>
                      {minuteTime(s.startMinute)} — {minuteTime(s.endMinute)}
                    </span>
                  ))}
              </div>
              {employee.absences.length > 0 && (
                <div className="ops-absence-list">
                  <h4>Absences enregistrées</h4>
                  {employee.absences.map((a) => (
                    <div key={a.id}>
                      <span>
                        {dateLabel(a.startsAt)} → {dateLabel(a.endsAt)}
                      </span>
                      {canEdit && !demo && (
                        <button
                          aria-label="Retirer cette absence"
                          disabled={absRemove.isPending}
                          onClick={() =>
                            absRemove.mutate({
                              employeeId: employee.id,
                              id: a.id,
                            })
                          }
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {canEdit && !demo && (
                <div className="ops-row-actions">
                  <button onClick={() => open(employee)}>Modifier</button>
                  <button
                    onClick={() => {
                      absForm.reset({ startsAt: "", endsAt: "", reason: "" });
                      absSave.reset();
                      setAbsence(employee);
                    }}
                  >
                    Ajouter une absence
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
        {absRemove.isError && (
          <p className="error">{absRemove.error.message}</p>
        )}
        <Pagination
          page={page}
          total={demo ? list.length : (query.data?.total ?? 0)}
          onChange={setPage}
        />
      </section>
      {editing !== undefined && (
        <Modal label="Collaborateur" onClose={() => setEditing(undefined)}>
          <section className="modal ops-wide-modal">
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setEditing(undefined)}
            >
              <X />
            </button>
            <div className="eyebrow">VOTRE ÉQUIPE</div>
            <h2>
              {editing ? "Modifier le collaborateur" : "Un nouveau talent."}
            </h2>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))}>
              <label>
                Nom complet
                <input autoFocus {...form.register("name")} />
              </label>
              <div className="form-row">
                <label>
                  Poste
                  <input
                    {...form.register("job")}
                    placeholder="Esthéticienne, coiffeuse…"
                  />
                </label>
                <label>
                  Téléphone
                  <input type="tel" {...form.register("phone")} />
                </label>
              </div>
              <fieldset>
                <legend>Prestations autorisées</legend>
                {services.isPending ? (
                  <p>Chargement des prestations…</p>
                ) : services.isError ? (
                  <p className="error">{services.error.message}</p>
                ) : !services.data?.length ? (
                  <p>Créez d’abord votre catalogue de prestations.</p>
                ) : (
                  services.data
                    .filter(
                      (s) =>
                        s.active ||
                        editing?.services.some((es) => es.serviceId === s.id),
                    )
                    .map((s) => (
                      <label className="check-label" key={s.id}>
                        <input
                          type="checkbox"
                          checked={form.watch("serviceIds").includes(s.id)}
                          disabled={!s.active}
                          onChange={(e) =>
                            form.setValue(
                              "serviceIds",
                              e.target.checked
                                ? [...form.getValues("serviceIds"), s.id]
                                : form
                                    .getValues("serviceIds")
                                    .filter((id) => id !== s.id),
                            )
                          }
                        />
                        {s.name}
                        {!s.active ? " (inactive)" : ""}
                      </label>
                    ))
                )}
              </fieldset>
              <fieldset>
                <legend>Jours travaillés</legend>
                <div className="ops-days">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                    <label key={day}>
                      <input
                        type="checkbox"
                        checked={form.watch("workDays").includes(day)}
                        onChange={(e) =>
                          form.setValue(
                            "workDays",
                            e.target.checked
                              ? [...form.getValues("workDays"), day]
                              : form
                                  .getValues("workDays")
                                  .filter((d) => d !== day),
                          )
                        }
                      />
                      {days[day]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="form-row">
                <label>
                  Début de journée
                  <input type="time" {...form.register("startTime")} />
                </label>
                <label>
                  Fin de journée
                  <input type="time" {...form.register("endTime")} />
                </label>
              </div>
              <p className="ops-form-note">
                Ces horaires s’appliquent aux jours sélectionnés, en heure
                d’Abidjan. Les absences bloquent la réservation.
              </p>
              {editing && (
                <label className="check-label">
                  <input type="checkbox" {...form.register("active")} />
                  Collaborateur actif
                </label>
              )}
              <FormErrors errors={form.formState.errors} />
              {save.isError && (
                <p className="error" role="alert">
                  {save.error.message}
                </p>
              )}
              <button
                className="button dark"
                disabled={save.isPending || services.isError}
              >
                {save.isPending
                  ? "Enregistrement…"
                  : "Enregistrer le collaborateur"}
              </button>
            </form>
          </section>
        </Modal>
      )}
      {absence && (
        <Modal label="Ajouter une absence" onClose={() => setAbsence(null)}>
          <section className="modal">
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setAbsence(null)}
            >
              <X />
            </button>
            <h2>Absence de {absence.name}</h2>
            <form onSubmit={absForm.handleSubmit((v) => absSave.mutate(v))}>
              <label>
                Début
                <input
                  type="datetime-local"
                  required
                  {...absForm.register("startsAt")}
                />
              </label>
              <label>
                Fin
                <input
                  type="datetime-local"
                  required
                  {...absForm.register("endsAt")}
                />
              </label>
              <label>
                Libellé facultatif
                <input
                  maxLength={200}
                  {...absForm.register("reason")}
                  placeholder="Congé, indisponibilité…"
                />
              </label>
              {absSave.isError && (
                <p className="error" role="alert">
                  {absSave.error.message}
                </p>
              )}
              <button className="button dark" disabled={absSave.isPending}>
                {absSave.isPending
                  ? "Enregistrement…"
                  : "Enregistrer l’absence"}
              </button>
            </form>
          </section>
        </Modal>
      )}
    </main>
  );
}

const bookingFormSchema = z
  .object({
    clientId: z.string().min(1, "Choisissez un client."),
    employeeId: z.string().min(1, "Choisissez un collaborateur."),
    serviceId: z.string().min(1, "Choisissez une prestation."),
    date: z.iso.date("Choisissez une date."),
    startsAt: z.string().min(1, "Choisissez un créneau disponible."),
  })
  .refine((values) => values.startsAt.slice(0, 10) === values.date, {
    message: "Choisissez un créneau de la date sélectionnée.",
    path: ["startsAt"],
  });
type BookingForm = z.infer<typeof bookingFormSchema>;
type View = "day" | "week" | "month" | "list";
function period(date: string, view: View) {
  const start = new Date(date + "T00:00:00Z");
  if (view === "week") {
    const weekday = (start.getUTCDay() + 6) % 7;
    start.setUTCDate(start.getUTCDate() - weekday);
  }
  if (view === "month") start.setUTCDate(1);
  const end = new Date(start);
  if (view === "month") end.setUTCMonth(end.getUTCMonth() + 1);
  else
    end.setUTCDate(
      end.getUTCDate() + (view === "week" || view === "list" ? 7 : 1),
    );
  return { start, end };
}
export function AgendaPage({
  demo = false,
  initialView = "week",
}: {
  demo?: boolean;
  initialView?: View;
}) {
  const identity = useIdentity(demo);
  const role = demo ? "OWNER" : (identity.data?.role ?? "");
  const canEdit = ["OWNER", "MANAGER", "RECEPTIONIST"].includes(role),
    canStatus = canEdit || role === "PRACTITIONER";
  const cache = useQueryClient();
  const [date, setDate] = useState(dayString(new Date())),
    [view, setView] = useState<View>(initialView),
    [employeeFilter, setEmployeeFilter] = useState(""),
    [statusFilter, setStatusFilter] = useState(""),
    [editing, setEditing] = useState<Appointment | null | undefined>(),
    [message, setMessage] = useState(""),
    [selected, setSelected] = useState<Appointment | null>(null),
    [clientSearch, setClientSearch] = useState("");
  const range = period(date, view);
  const query = useQuery({
    queryKey: [
      "appointments",
      range.start.toISOString(),
      range.end.toISOString(),
      employeeFilter,
      statusFilter,
    ],
    queryFn: () =>
      api<Appointment[]>(
        `/appointments?from=${encodeURIComponent(range.start.toISOString())}&to=${encodeURIComponent(range.end.toISOString())}${employeeFilter ? "&employeeId=" + employeeFilter : ""}${statusFilter ? "&status=" + statusFilter : ""}`,
      ),
    enabled: !demo,
  });
  const clients = useQuery({
    queryKey: ["booking-clients", clientSearch],
    queryFn: () =>
      api<Page<Client>>(
        "/clients?limit=100&search=" + encodeURIComponent(clientSearch),
      ),
    enabled: !demo && canEdit,
  });
  const employees = useQuery({
    queryKey: ["booking-employees"],
    queryFn: () => api<Page<Employee>>("/employees?limit=100"),
    enabled: !demo,
  });
  const services = useQuery({
    queryKey: ["services"],
    queryFn: () => api<Service[]>("/services"),
    enabled: !demo && canEdit,
  });
  const employeeItems = demo ? demoEmployees : (employees.data?.items ?? []),
    clientItems = demo ? demoClients : (clients.data?.items ?? []),
    serviceItems = demo ? demoServices : (services.data ?? []);
  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      clientId: "",
      employeeId: "",
      serviceId: "",
      date,
      startsAt: "",
    },
  });
  const serviceId = form.watch("serviceId"),
    employeeId = form.watch("employeeId"),
    bookingDate = form.watch("date");
  const slots = useQuery({
    queryKey: ["availability", serviceId, employeeId, bookingDate],
    queryFn: () =>
      api<string[]>(
        `/availability?date=${bookingDate}&employeeId=${employeeId}&serviceId=${serviceId}`,
      ),
    enabled:
      editing !== undefined &&
      !demo &&
      !!serviceId &&
      !!employeeId &&
      !!bookingDate,
  });
  const invalidate = () => {
    void cache.invalidateQueries({ queryKey: ["appointments"] });
    void cache.invalidateQueries({ queryKey: ["dashboard"] });
    void cache.invalidateQueries({ queryKey: ["availability"] });
    void cache.invalidateQueries({ queryKey: ["clients"] });
    void cache.invalidateQueries({ queryKey: ["client"] });
  };
  const save = useMutation({
    mutationFn: (values: BookingForm) =>
      api<Appointment>(
        "/appointments" + (editing?.id ? "/" + editing.id : ""),
        {
          method: editing?.id ? "PATCH" : "POST",
          body: JSON.stringify({
            clientId: values.clientId,
            employeeId: values.employeeId,
            serviceId: values.serviceId,
            startsAt: values.startsAt,
          }),
        },
      ),
    onSuccess: () => {
      setEditing(undefined);
      setMessage("Le rendez-vous a été enregistré.");
      invalidate();
    },
    onError: () => {
      void cache.invalidateQueries({ queryKey: ["availability"] });
    },
  });
  const change = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<Appointment>("/appointments/" + id + "/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (updated) => {
      setSelected(updated);
      setMessage("Le statut du rendez-vous a été mis à jour.");
      invalidate();
    },
  });
  const appointments = demo
    ? demoAppointments.filter(
        (a) =>
          new Date(a.startsAt) >= range.start &&
          new Date(a.startsAt) < range.end &&
          (!employeeFilter || a.employeeId === employeeFilter) &&
          (!statusFilter || a.status === statusFilter),
      )
    : (query.data ?? []);
  function move(step: number) {
    const next = new Date(date + "T00:00:00Z");
    if (view === "month") {
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + step);
    } else next.setUTCDate(next.getUTCDate() + step * (view === "day" ? 1 : 7));
    setDate(dayString(next));
  }
  function open(a: Appointment | null) {
    save.reset();
    setClientSearch(a?.customerName ?? "");
    form.reset({
      clientId: a?.clientId ?? "",
      employeeId: a?.employeeId ?? "",
      serviceId: a?.serviceId ?? "",
      date: a?.startsAt.slice(0, 10) ?? date,
      startsAt: a?.startsAt ?? "",
    });
    setSelected(null);
    setEditing(a);
  }
  function event(a: Appointment) {
    return (
      <button
        className={"ops-event event-" + a.status}
        key={a.id}
        onClick={() => {
          change.reset();
          setSelected(a);
        }}
      >
        <small>
          {time(a.startsAt)} — {time(a.endsAt)}
        </small>
        <b>{a.customerName}</b>
        <span>{a.serviceName}</span>
        <em>{a.employee?.name ?? "Sans collaborateur"}</em>
        <span className="ops-event-status">{statusLabels[a.status]}</span>
      </button>
    );
  }
  const numberOfDays =
    view === "month"
      ? Math.ceil(
          (((range.start.getUTCDay() + 6) % 7) +
            new Date(range.end.getTime() - 86400000).getUTCDate()) /
            7,
        ) * 7
      : view === "week"
        ? 7
        : 1;
  const calendarStart = new Date(range.start);
  if (view === "month")
    calendarStart.setUTCDate(
      calendarStart.getUTCDate() - ((calendarStart.getUTCDay() + 6) % 7),
    );
  const availableServices = serviceItems.filter((s) => s.active);
  const eligibleEmployees = employeeItems.filter(
    (e) => e.active && e.services.some((s) => s.serviceId === serviceId),
  );
  const chosenService = serviceItems.find((s) => s.id === serviceId);
  const selectorError = clients.error || employees.error || services.error;
  const transitions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  };
  return (
    <main className="dashboard">
      <div className="page-heading">
        <div className="eyebrow">DE BEAUX MOMENTS, BIEN ORGANISÉS</div>
        <div>
          <h1>{initialView === "list" ? "Vos rendez-vous" : "Votre agenda"}</h1>
          {canEdit &&
            (demo ? (
              <Link className="button dark" to="/connexion">
                <Plus size={18} />
                Nouveau rendez-vous
              </Link>
            ) : (
              <button className="button dark" onClick={() => open(null)}>
                <Plus size={18} />
                Nouveau rendez-vous
              </button>
            ))}
        </div>
        <p>
          Une vision claire des soins et des disponibilités de votre équipe.
        </p>
      </div>
      {demo && <DemoPrompt />}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <section className="panel ops-calendar">
        <div className="ops-calendar-toolbar">
          <div className="ops-date-nav">
            <button aria-label="Période précédente" onClick={() => move(-1)}>
              <ChevronLeft size={21} />
            </button>
            <button
              className="ops-today"
              onClick={() => setDate(dayString(new Date()))}
            >
              Aujourd’hui
            </button>
            <button aria-label="Période suivante" onClick={() => move(1)}>
              <ChevronRight size={21} />
            </button>
            <input
              type="date"
              aria-label="Date de l’agenda"
              value={date}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </div>
          <div className="ops-view-switch">
            {(
              [
                ["day", "Jour"],
                ["week", "Semaine"],
                ["month", "Mois"],
                ["list", "Liste"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={view === value ? "selected" : ""}
                onClick={() => setView(value)}
                aria-pressed={view === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="ops-calendar-filters">
          <span>
            {dateLabel(range.start.toISOString())} —{" "}
            {dateLabel(new Date(range.end.getTime() - 1).toISOString())}
          </span>
          <select
            aria-label="Filtrer les collaborateurs"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="">Toute l’équipe</option>
            {employeeItems.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrer les statuts"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Feedback
          pending={!demo && query.isPending}
          error={query.error}
          empty={
            view === "list" &&
            !appointments.length &&
            !query.isError &&
            !(!demo && query.isPending)
          }
        />
        {view === "list" ? (
          <div className="ops-appointment-list">
            {appointments.map((a) => (
              <div key={a.id}>
                <div className="ops-list-date">
                  <b>{dateLabel(a.startsAt)}</b>
                  <span>
                    {time(a.startsAt)} · {a.duration} min
                  </span>
                </div>
                {event(a)}
              </div>
            ))}
          </div>
        ) : (
          <div className={"ops-calendar-grid calendar-" + view}>
            {Array.from({ length: numberOfDays }, (_, i) => {
              const current = new Date(calendarStart.getTime() + i * 86400000),
                key = dayString(current),
                events = appointments.filter(
                  (a) => a.startsAt.slice(0, 10) === key,
                ),
                outside = current < range.start || current >= range.end;
              return (
                <div
                  key={key}
                  className={
                    "ops-calendar-day " +
                    (outside ? "outside " : "") +
                    (key === dayString(new Date()) ? "today" : "")
                  }
                >
                  <header>
                    <b>{days[current.getUTCDay()]}</b>
                    <span>{current.getUTCDate()}</span>
                  </header>
                  <div>
                    {events.map(event)}
                    {!events.length && view === "day" && (
                      <p className="ops-free-day">Aucun rendez-vous ce jour.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="ops-timezone">
          <Clock size={14} /> Horaires d’Abidjan · UTC. Chaque réservation est
          vérifiée à l’enregistrement.
        </p>
      </section>
      {editing !== undefined && (
        <Modal
          label="Réserver un rendez-vous"
          onClose={() => setEditing(undefined)}
        >
          <section className="modal ops-wide-modal">
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setEditing(undefined)}
            >
              <X />
            </button>
            <div className="eyebrow">UNE ATTENTION PARTICULIÈRE</div>
            <h2>
              {editing ? "Déplacer le rendez-vous" : "Un nouveau rendez-vous."}
            </h2>
            {selectorError && (
              <p className="error" role="alert">
                {selectorError.message}
              </p>
            )}
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))}>
              <label>
                Rechercher un client
                <input
                  type="search"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Nom ou téléphone"
                />
              </label>
              <label>
                Client
                <select {...form.register("clientId")}>
                  <option value="">Choisir un client</option>
                  {clientItems.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </option>
                  ))}
                </select>
              </label>
              {clients.data && clients.data.total > 100 && (
                <p className="ops-form-note">
                  Précisez le nom ou le téléphone pour retrouver votre client.
                </p>
              )}
              {!clients.isPending && !clientItems.length && (
                <Link className="ops-form-link" to="/app/clients">
                  Créer d’abord une fiche client →
                </Link>
              )}
              <label>
                Prestation
                <select
                  {...form.register("serviceId")}
                  onChange={(e) => {
                    form.setValue("serviceId", e.target.value);
                    form.setValue("employeeId", "");
                    form.setValue("startsAt", "");
                  }}
                >
                  <option value="">Choisir une prestation</option>
                  {availableServices.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name} · {s.duration} min · {fcfa(s.price)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Collaborateur habilité
                <select
                  {...form.register("employeeId")}
                  onChange={(e) => {
                    form.setValue("employeeId", e.target.value);
                    form.setValue("startsAt", "");
                  }}
                  disabled={!serviceId}
                >
                  <option value="">Choisir un collaborateur</option>
                  {eligibleEmployees.map((e) => (
                    <option value={e.id} key={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              {serviceId &&
                !eligibleEmployees.length &&
                !employees.isPending && (
                  <p className="ops-form-note">
                    Aucun collaborateur habilité. Configurez les prestations
                    autorisées dans Équipe.
                  </p>
                )}
              <label>
                Date
                <input
                  type="date"
                  min={dayString(new Date())}
                  value={bookingDate}
                  {...form.register("date")}
                  onChange={(e) => {
                    form.setValue("date", e.target.value);
                    form.setValue("startsAt", "");
                  }}
                />
              </label>
              <fieldset>
                <legend>
                  Créneaux disponibles ·{" "}
                  {bookingDate
                    ? dateLabel(bookingDate + "T00:00:00Z")
                    : "Choisissez une date"}
                </legend>
                {!employeeId ? (
                  <p className="ops-form-note">
                    Choisissez une prestation et un collaborateur.
                  </p>
                ) : slots.isPending ? (
                  <p>Recherche des disponibilités…</p>
                ) : slots.isError ? (
                  <p className="error" role="alert">
                    {slots.error.message}
                  </p>
                ) : (
                  <div className="ops-slots">
                    {slots.data?.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        className={
                          form.watch("startsAt") === slot ? "selected" : ""
                        }
                        aria-pressed={form.watch("startsAt") === slot}
                        onClick={() =>
                          form.setValue("startsAt", slot, {
                            shouldValidate: true,
                          })
                        }
                      >
                        {time(slot)}
                      </button>
                    ))}
                    {editing && editing.startsAt === form.watch("startsAt") && (
                      <span className="ops-form-note">
                        Créneau actuel : {time(editing.startsAt)}. Pour le
                        déplacer, choisissez un nouveau créneau.
                      </span>
                    )}
                    {!slots.data?.length && (
                      <p className="ops-form-note">
                        Aucun créneau libre à cette date.
                      </p>
                    )}
                  </div>
                )}
              </fieldset>
              {chosenService && (
                <div className="ops-booking-summary">
                  <Clock size={17} />
                  {chosenService.duration} minutes{" "}
                  <b>{fcfa(chosenService.price)}</b>
                  <small>Demande en attente · aucun paiement encaissé</small>
                </div>
              )}
              <FormErrors errors={form.formState.errors} />
              {save.isError && (
                <p className="error" role="alert">
                  {save.error.message}
                </p>
              )}
              <button
                className="button dark"
                disabled={save.isPending || !!selectorError || slots.isError}
              >
                {save.isPending
                  ? "Enregistrement…"
                  : "Enregistrer le rendez-vous"}
              </button>
            </form>
          </section>
        </Modal>
      )}
      {selected && (
        <Modal label="Détail du rendez-vous" onClose={() => setSelected(null)}>
          <section className="modal ops-detail">
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="eyebrow">VOTRE RENDEZ-VOUS</div>
            <h2>{selected.customerName}</h2>
            <span className={"ops-status status-" + selected.status}>
              {statusLabels[selected.status]}
            </span>
            <h3>{selected.serviceName}</h3>
            <p>
              <CalendarDays size={16} />
              {dateLabel(selected.startsAt)} · {time(selected.startsAt)}
            </p>
            <p>
              <Clock size={16} />
              {selected.duration} minutes
            </p>
            <p>
              <UserRound size={16} />
              {selected.employee?.name ?? "Non affecté"}
            </p>
            <p>
              <Phone size={16} />
              {selected.phone}
            </p>
            <div className="ops-booking-summary">
              <b>{fcfa(selected.price)}</b>
              <small>Tarif réservé · aucun encaissement enregistré ici</small>
            </div>
            {demo ? (
              <DemoPrompt />
            ) : (
              <>
                {canEdit &&
                  ["PENDING", "CONFIRMED"].includes(selected.status) && (
                    <button
                      className="button light"
                      onClick={() => open(selected)}
                    >
                      Déplacer / modifier
                    </button>
                  )}
                {canStatus && (
                  <div className="ops-status-actions">
                    {(transitions[selected.status] ?? [])
                      .filter(
                        (status) =>
                          role !== "PRACTITIONER" ||
                          ["IN_PROGRESS", "COMPLETED"].includes(status),
                      )
                      .map((status) => (
                        <button
                          className="button light"
                          disabled={change.isPending}
                          key={status}
                          onClick={() =>
                            change.mutate({ id: selected.id, status })
                          }
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                  </div>
                )}
                {change.isError && (
                  <p className="error" role="alert">
                    {change.error.message}
                  </p>
                )}
              </>
            )}
          </section>
        </Modal>
      )}
    </main>
  );
}
