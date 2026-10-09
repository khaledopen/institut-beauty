import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  UserRound,
  Wallet,
  Package,
  ChartNoAxesCombined,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Clock,
  Check,
  Flower2,
  ShieldCheck,
  Heart,
  MoreHorizontal,
  Pause,
  Play,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { api, type Me, type Service } from "./api";
import hero from "../pexels-gustavo-fring-7446676.jpg";
import portrait from "../pexels-marlonretratos-37273224.jpg";
import goldenBeauty from "../5882641-model-2498663.jpg";
import botanicalSerum from "../pexels-artempodrez-6800779.jpg";
import beautyPortrait from "../pexels-heyy-kazz-705792-31282938.jpg";
import faceCare from "../pexels-kaplanart-14095411.jpg";
import flowerSerum from "../pexels-kubra-tokur-210746713-20171275.jpg";
import floralBeauty from "../pexels-nemmy-media-694031137-20847963.jpg";
import productCare from "../pexels-richan-dwi-putra-88532517-12616442.jpg";
import hairStudio from "../pexels-sie7e-29189917.jpg";
import "./styles.css";
import {
  PageMotion,
  HeroSlideshow,
  PhotoMarquees,
  StudioPhotoStrip,
} from "./motion";

const projectPhotos = [
  {
    src: goldenBeauty,
    title: "La beauté, en lumière",
    category: "MAQUILLAGE",
    alt: "Portrait avec un maquillage doré autour des yeux",
  },
  {
    src: hero,
    title: "Le soin, un savoir-faire",
    category: "ESTHÉTIQUE",
    alt: "Professionnelle réalisant un soin du visage",
  },
  {
    src: hairStudio,
    title: "L’art de la coiffure",
    category: "COIFFURE",
    alt: "Coiffeuse prenant soin des cheveux d’une cliente au salon",
  },
  {
    src: beautyPortrait,
    title: "Chaque visage, une histoire",
    category: "BEAUTÉ",
    alt: "Portrait en gros plan mettant en valeur le regard",
  },
  {
    src: botanicalSerum,
    title: "Les essentiels du soin",
    category: "COSMÉTIQUES",
    alt: "Flacon de sérum sur un fond clair avec une fleur",
  },
  {
    src: faceCare,
    title: "Un moment pour soi",
    category: "SOINS DU VISAGE",
    alt: "Application de soin sur les joues et le visage",
  },
  {
    src: floralBeauty,
    title: "Une élégance singulière",
    category: "INSPIRATION",
    alt: "Portrait en noir et blanc avec une fleur dans les cheveux",
  },
  {
    src: portrait,
    title: "Des gestes experts",
    category: "INSTITUT",
    alt: "Praticienne réalisant un soin du visage dans un institut",
  },
  {
    src: flowerSerum,
    title: "La douceur au quotidien",
    category: "RITUELS BEAUTÉ",
    alt: "Sérum avec une pipette et des fleurs sur un fond sombre",
  },
  {
    src: productCare,
    title: "Le détail qui fait tout",
    category: "PRODUITS",
    alt: "Main tenant un flacon cosmétique sur un fond clair",
  },
];

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
const money = (amount: number) =>
  new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
function Brand() {
  return (
    <Link className="brand" to="/">
      <Flower2 size={29} />
      <span>
        BELLEZA<small>BEAUTY BUSINESS MANAGEMENT</small>
      </span>
    </Link>
  );
}
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal-backdrop"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}
function PhotoGallery({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={
        compact ? "photo-section photo-section-app" : "photo-section section"
      }
      aria-labelledby={compact ? "app-gallery-title" : "gallery-title"}
    >
      <div className="section-heading">
        <div>
          <div className="eyebrow">L’UNIVERS BELLEZA</div>
          <h2 id={compact ? "app-gallery-title" : "gallery-title"}>
            {compact
              ? "La beauté dans chaque détail."
              : "Chaque beauté a sa place."}
          </h2>
        </div>
        <div className="gallery-controls">
          <p>
            Des gestes, des visages, des inspirations.
            <br />
            Dix regards sur votre univers.
          </p>
          <button
            className="gallery-pause"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}{" "}
            {paused ? "Reprendre le défilement" : "Pause du défilement"}
          </button>
        </div>
      </div>
      <PhotoMarquees
        photos={projectPhotos}
        paused={paused || selected !== null}
        onSelect={setSelected}
      />
      {selected !== null && (
        <Modal onClose={() => setSelected(null)}>
          <section
            className="photo-lightbox"
            aria-label={projectPhotos[selected].title}
          >
            <button
              className="photo-close"
              aria-label="Fermer la photo"
              onClick={() => setSelected(null)}
            >
              <X size={24} />
            </button>
            <img
              key={projectPhotos[selected].src}
              src={projectPhotos[selected].src}
              alt={projectPhotos[selected].alt}
            />
            <div>
              <span>{projectPhotos[selected].category}</span>
              <h2>{projectPhotos[selected].title}</h2>
              <p>
                {selected + 1} / {projectPhotos.length}
              </p>
            </div>
            <nav aria-label="Parcourir les photos">
              <button
                onClick={() =>
                  setSelected(
                    (selected + projectPhotos.length - 1) %
                      projectPhotos.length,
                  )
                }
              >
                ← Précédente
              </button>
              <button
                onClick={() =>
                  setSelected((selected + 1) % projectPhotos.length)
                }
              >
                Suivante →
              </button>
            </nav>
          </section>
        </Modal>
      )}
    </section>
  );
}
function Marketing() {
  const [faq, setFaq] = useState<number | null>(0);
  const [previewPaused, setPreviewPaused] = useState(false);
  return (
    <div className="marketing">
      <nav className="public-nav">
        <Brand />
        <div className="public-links">
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#experience">L’expérience Belleza</a>
          <a href="#tarifs">Nos formules</a>
        </div>
        <div className="nav-actions">
          <Link to="/connexion">Connexion</Link>
          <Link className="button dark" to="/inscription">
            Créer mon institut <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> PENSÉ POUR LES PROFESSIONNELS DE LA BEAUTÉ
            </div>
            <h1>
              Votre passion mérite
              <br />
              une gestion <em>plus belle.</em>
            </h1>
            <p>
              Moins d’administratif. Plus de moments précieux.
              <br />
              Offrez à votre institut un espace où tout s’organise,
              <br className="desktop" /> simplement et élégamment.
            </p>
            <div className="hero-actions">
              <Link className="button dark" to="/inscription">
                Créer mon espace <ArrowRight size={18} />
              </Link>
              <Link className="text-button" to="/apercu">
                Découvrir l’application <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="hero-assurance">
              <ShieldCheck size={16} /> Données séparées par institut{" "}
              <span>•</span> Conçu pour la Côte d’Ivoire
            </div>
          </div>
          <div className="hero-visual">
            <HeroSlideshow
              photos={[
                projectPhotos[1],
                ...projectPhotos.filter((photo) => photo.src !== hero),
              ]}
            />
            <div className="floating-card">
              <span className="round-icon">
                <CalendarDays size={20} />
              </span>
              <div>
                <b>Une journée bien organisée</b>
                <small>Votre institut, en un seul regard</small>
              </div>
              <Check size={18} />
            </div>
          </div>
        </section>
        <section className="sector-strip">
          <span>UN ESPACE POUR CHAQUE SAVOIR-FAIRE</span>
          <b>Instituts de beauté</b>
          <i>✧</i>
          <b>Salons de coiffure</b>
          <i>✧</i>
          <b>Spas & bien-être</b>
          <i>✧</i>
          <b>Ongleries & barbershops</b>
        </section>
        <section id="fonctionnalites" className="section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">VOTRE QUOTIDIEN, EN PLUS SIMPLE</div>
              <h2>
                De beaux outils.
                <br />
                De grandes possibilités.
              </h2>
            </div>
            <p>
              Un espace conçu autour de votre métier,
              <br />
              pour vous laisser faire ce que vous aimez.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                Icon: CalendarDays,
                photo: hairStudio,
                alt: "Coiffeuse et cliente dans un salon",
                title: "Un agenda serein",
                text: "Organisez les rendez-vous et les disponibilités de votre équipe.",
                tag: "PLANIFICATION",
              },
              {
                Icon: Heart,
                photo: faceCare,
                alt: "Un moment de soin du visage",
                title: "Des liens qui durent",
                text: "Retrouvez vos clientes, leurs préférences et leurs prochaines visites.",
                tag: "RELATION CLIENT",
              },
              {
                Icon: Wallet,
                photo: botanicalSerum,
                alt: "Flacon de sérum et fleur",
                title: "Une activité plus claire",
                text: "Suivez vos encaissements, vos produits et la santé de votre activité.",
                tag: "GESTION COMMERCIALE",
              },
            ].map(({ Icon, title, text, tag, photo, alt }) => (
              <article key={title}>
                <img
                  className="feature-photo"
                  src={photo}
                  alt={alt}
                  loading="lazy"
                />
                <span className="feature-icon">
                  <Icon size={24} />
                </span>
                <small>{tag}</small>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="roadmap-note">
            Développement progressif : inscription, connexion et catalogue
            disponibles dans cette première version. Agenda et gestion
            commerciale à venir.
          </p>
        </section>
        <section id="experience" className="experience section">
          <div>
            <div className="eyebrow">LE CALME, MÊME LES JOURS CHARGÉS</div>
            <h2>
              Tout votre institut.
              <br />
              <em>Une seule vue.</em>
            </h2>
            <p>
              Une interface douce, des informations lisibles et vos essentiels
              toujours à portée de main.
            </p>
            <Link className="button dark" to="/apercu">
              Explorer la maquette <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="mini-dashboard" data-paused={previewPaused}>
            <div className="mini-top">
              <Flower2 size={20} /> BELLEZA <span>APERÇU DE CONCEPTION</span>
              <button
                className="mini-motion-control"
                aria-label={
                  previewPaused
                    ? "Reprendre l’animation de l’aperçu"
                    : "Mettre l’animation de l’aperçu en pause"
                }
                aria-pressed={previewPaused}
                onClick={() => setPreviewPaused(!previewPaused)}
              >
                {previewPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </div>
            <h3>Chaque détail compte.</h3>
            <div className="mini-cards">
              <div>
                <small>Vos prestations</small>
                <b>Un catalogue à votre image</b>
              </div>
              <div>
                <small>Votre espace</small>
                <b>Simple. Personnel. Sécurisé.</b>
              </div>
            </div>
            <div className="mini-bars" aria-hidden="true">
              {[40, 62, 48, 79, 65, 90, 72, 95, 82].map((h, i) => (
                <span
                  key={i}
                  style={
                    {
                      height: h + "%",
                      "--bar-duration": `${3.6 + (i % 3) * 0.7}s`,
                      "--bar-delay": `${-i * 0.6}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          </div>
        </section>
        <PhotoGallery />
        <section id="tarifs" className="section pricing">
          <div className="eyebrow">GRANDIR À VOTRE RYTHME</div>
          <h2>À chaque ambition, sa formule.</h2>
          <p>
            Les formules seront activées avec le module d’abonnement. Aucun
            paiement n’est collecté ici.
          </p>
          <div className="pricing-grid">
            {["Starter", "Professional", "Premium"].map((plan, i) => (
              <article className={i === 1 ? "featured" : ""} key={plan}>
                <small>
                  {i === 1 ? "POUR ALLER PLUS LOIN" : "VOTRE PROCHAIN CHAPITRE"}
                </small>
                <h3>{plan}</h3>
                <b>Tarif à définir</b>
                <p>
                  {
                    [
                      "Les essentiels pour démarrer.",
                      "Tout pour développer votre institut.",
                      "Une vision globale pour votre enseigne.",
                    ][i]
                  }
                </p>
                <ul>
                  {[
                    [
                      "Agenda et clientèle",
                      "2 collaborateurs",
                      "Tableau de bord",
                    ],
                    [
                      "Caisse et stocks",
                      "Fidélité et promotions",
                      "Rapports avancés",
                    ],
                    [
                      "Gestion multisites",
                      "Permissions avancées",
                      "Rapports consolidés",
                    ],
                  ][i].map((t) => (
                    <li key={t}>
                      <Check size={15} />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  className={"button " + (i === 1 ? "dark" : "light")}
                  to="/inscription"
                >
                  Créer mon espace <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="section faq">
          <div>
            <div className="eyebrow">EN TOUTE SIMPLICITÉ</div>
            <h2>
              Vos questions,
              <br />
              nos réponses.
            </h2>
          </div>
          <div>
            {[
              [
                "Puis-je gérer plusieurs instituts ?",
                "L’architecture prévoit une adhésion par institut et des rôles distincts. La gestion multisites sera développée dans la formule Premium.",
              ],
              [
                "Mes données sont-elles séparées ?",
                "Le serveur utilise l’institut de votre session pour chaque accès métier. Le catalogue ne dépend jamais d’un identifiant envoyé par le navigateur.",
              ],
              [
                "Les paiements Mobile Money sont-ils disponibles ?",
                "Pas encore. Orange Money, MTN et Wave nécessiteront une intégration prestataire validée. Aucun encaissement n’est simulé.",
              ],
            ].map(([q, a], i) => (
              <article key={q}>
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  aria-expanded={faq === i}
                >
                  {q}
                  <Plus size={18} />
                </button>
                {faq === i && <p>{a}</p>}
              </article>
            ))}
          </div>
        </section>
        <section className="cta">
          <Sparkles size={26} />
          <h2>Faites de la place à votre passion.</h2>
          <p>Votre prochain chapitre commence avec un espace bien à vous.</p>
          <Link className="button dark" to="/inscription">
            Créer mon institut <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <footer>
        <Brand />
        <span>Conçu avec soin, pour les métiers de la beauté.</span>
        <small>© 2026 BELLEZA · Version en développement</small>
      </footer>
    </div>
  );
}

const authSchema = z.object({
  name: z.string(),
  instituteName: z.string(),
  email: z.email("Saisissez une adresse e-mail valide."),
  password: z.string().min(12, "Utilisez au moins 12 caractères.").max(128),
});
function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: "", instituteName: "" },
  });
  return (
    <div className="auth-page">
      <aside
        style={{
          backgroundImage: `linear-gradient(0deg,rgba(56,45,50,.65),rgba(56,45,50,.1)),url(${hero})`,
        }}
      >
        <Brand />
        <div>
          <div className="eyebrow">VOTRE MÉTIER EST UN ART</div>
          <h1>
            Prenez soin
            <br />
            de votre <em>avenir.</em>
          </h1>
          <p>Nous vous aidons à organiser le reste.</p>
        </div>
        <small>BELLEZA · BEAUTY BUSINESS MANAGEMENT</small>
      </aside>
      <main>
        <Link className="back" to="/">
          ← Retour à l’accueil
        </Link>
        <div className="auth-form">
          <span className="feature-icon">
            <Flower2 size={26} />
          </span>
          <div className="eyebrow">
            {register ? "UN NOUVEAU CHAPITRE" : "RAVIS DE VOUS RETROUVER"}
          </div>
          <h2>
            {register ? "Bienvenue chez vous." : "Votre institut vous attend."}
          </h2>
          <p>
            {register
              ? "Créez votre espace de gestion en quelques instants."
              : "Connectez-vous pour retrouver votre espace."}
          </p>
          <form
            onSubmit={handleSubmit(async (values) => {
              setBusy(true);
              setError("");
              try {
                if (
                  register &&
                  (!values.name.trim() || !values.instituteName.trim())
                )
                  throw new Error(
                    "Renseignez votre nom et celui de votre institut.",
                  );
                await api("/auth/" + (register ? "register" : "login"), {
                  method: "POST",
                  body: JSON.stringify(values),
                });
                await cache.invalidateQueries({ queryKey: ["me"] });
                navigate("/app");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            })}
          >
            {register && (
              <>
                <label>
                  Votre nom
                  <input
                    autoComplete="name"
                    {...field("name")}
                    required
                    placeholder="Aïcha Koné"
                  />
                </label>
                <label>
                  Nom de votre institut
                  <input
                    {...field("instituteName")}
                    required
                    placeholder="Maison Éclat"
                  />
                </label>
              </>
            )}
            <label>
              Adresse e-mail
              <input
                type="email"
                autoComplete="email"
                {...field("email")}
                placeholder="vous@institut.ci"
              />
              {errors.email && (
                <small className="error">{errors.email.message}</small>
              )}
            </label>
            <label>
              Mot de passe
              <input
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                {...field("password")}
                placeholder="Au moins 12 caractères"
              />
              {errors.password && (
                <small className="error">{errors.password.message}</small>
              )}
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button dark" disabled={busy}>
              {busy
                ? "Un instant…"
                : register
                  ? "Créer mon institut"
                  : "Se connecter"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {register
              ? "Vous avez déjà un compte ?"
              : "Vous découvrez Belleza ?"}{" "}
            <Link to={register ? "/connexion" : "/inscription"}>
              {register ? "Se connecter" : "Créer mon institut"}
            </Link>
          </p>
          <div className="auth-note">
            <ShieldCheck size={16} /> Votre espace est isolé de celui des autres
            instituts.
          </div>
        </div>
      </main>
    </div>
  );
}

const navigation = [
  { Icon: LayoutDashboard, label: "Vue d’ensemble", path: "/app" },
  { Icon: CalendarDays, label: "Agenda", path: "agenda" },
  { Icon: Scissors, label: "Prestations", path: "/app/prestations" },
  { Icon: Users, label: "Clients", path: "clients" },
  { Icon: UserRound, label: "Équipe", path: "equipe" },
  { Icon: Wallet, label: "Caisse & paiements", path: "caisse" },
  { Icon: Package, label: "Produits & stocks", path: "stocks" },
  { Icon: ChartNoAxesCombined, label: "Rapports", path: "rapports" },
];
const demoAppointments = [
  {
    time: "09:00",
    name: "Aminata Traoré",
    service: "Soin visage éclat",
    duration: 60,
    employee: "Fatou",
    status: "Confirmé",
  },
  {
    time: "10:00",
    name: "Sarah Kouamé",
    service: "Manucure semi-permanente",
    duration: 45,
    employee: "Marie",
    status: "En cours",
  },
  {
    time: "11:30",
    name: "Mariam Diabaté",
    service: "Massage relaxant",
    duration: 60,
    employee: "Fatou",
    status: "Confirmé",
  },
  {
    time: "14:00",
    name: "Grâce N’Guessan",
    service: "Brushing & soin",
    duration: 90,
    employee: "Aïcha",
    status: "En attente",
  },
];
function AppShell({ demo = false }: { demo?: boolean }) {
  const location = useLocation();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<Me>("/me"),
    enabled: !demo,
  });
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const cache = useQueryClient();
  if (!demo && me.isPending)
    return (
      <div className="loading">
        <Flower2 /> Ouverture de votre espace…
      </div>
    );
  if (!demo && me.isError)
    return (
      <div className="loading">
        <h2>Connectez-vous à votre institut.</h2>
        <p>{me.error.message}</p>
        <Link className="button dark" to="/connexion">
          Se connecter
        </Link>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Brand />
        <button
          className="institute-switch"
          onClick={() =>
            setNotice(
              "La gestion de plusieurs établissements sera disponible dans une prochaine phase.",
            )
          }
        >
          <span className="institute-icon">M</span>
          <span>
            <b>{demo ? "Maison Éclat" : me.data?.institute.name}</b>
            <small>
              {demo
                ? "Institut de beauté · Abidjan"
                : "Votre espace de gestion"}
            </small>
          </span>
          <ChevronDown size={15} />
        </button>
        <small className="nav-caption">VOTRE ESPACE</small>
        <nav>
          {navigation.map(({ Icon, label, path }) => {
            const available = path.startsWith("/");
            return available ? (
              <Link
                key={label}
                onClick={() => setMenu(false)}
                className={
                  location.pathname === path || (demo && path === "/app")
                    ? "active"
                    : ""
                }
                to={demo ? "/apercu" : path}
              >
                <Icon size={19} />
                {label}
                {label === "Agenda" && demo && (
                  <span className="nav-badge">8</span>
                )}
              </Link>
            ) : (
              <button
                key={label}
                onClick={() =>
                  setNotice(
                    `Le module « ${label} » est prévu dans les prochaines phases.`,
                  )
                }
              >
                <Icon size={19} />
                {label}
                <span className="soon-dot" />
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <Sparkles size={19} />
            <b>Un espace à votre image</b>
            <p>
              Votre passion. Vos ambitions.
              <br />
              Nous grandissons avec vous.
            </p>
            <Link to="/">
              Découvrir Belleza <ArrowUpRight size={14} />
            </Link>
          </div>
          <button
            className="settings-link"
            onClick={() =>
              setNotice(
                "La personnalisation de l’institut est prévue dans la prochaine phase.",
              )
            }
          >
            <Settings size={18} /> Paramètres
          </button>
          <div className="profile">
            <img src={beautyPortrait} alt="Portrait décoratif" />
            <div>
              <b>{demo ? "Aïcha Koné" : me.data?.user.name}</b>
              <small>Propriétaire</small>
            </div>
            <button
              aria-label={demo ? "Retour à l’accueil" : "Se déconnecter"}
              onClick={async () => {
                if (!demo) {
                  await api("/auth/logout", { method: "POST" });
                  cache.clear();
                }
                navigate("/");
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <button
            className="mobile-menu"
            aria-label="Ouvrir le menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            Mon institut <span>/</span>
            <b>
              {location.pathname.includes("prestations")
                ? "Prestations"
                : "Vue d’ensemble"}
            </b>
          </div>
          <div className="header-right">
            <span className="today">
              {new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "full",
                timeZone: "Africa/Abidjan",
              }).format(new Date())}
            </span>
            <button
              aria-label="Notifications"
              onClick={() =>
                setNotice(
                  demo
                    ? "Les notifications de cet aperçu sont illustratives."
                    : "Aucune notification disponible pour le moment.",
                )
              }
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="avatar">
              {(demo ? "AK" : me.data?.user.name.slice(0, 2))?.toUpperCase()}
            </span>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <Sparkles size={15} /> Maquette de conception · Données
            illustratives, aucun encaissement réel{" "}
            <Link to="/inscription">
              Créer mon espace <ArrowRight size={14} />
            </Link>
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button aria-label="Fermer" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <Routes>
          <Route
            index
            element={<Dashboard demo={demo} name={me.data?.user.name} />}
          />
          <Route path="prestations" element={<Services />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
        <div className="app-footer">
          BELLEZA <span>Un peu plus de sérénité, chaque jour.</span>
          <small>Fait pour votre métier, avec soin.</small>
        </div>
      </div>
    </div>
  );
}
function Dashboard({ demo, name }: { demo: boolean; name?: string }) {
  const data = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      api<{
        services: number;
        clients: number;
        appointments: {
          id: string;
          customerName: string;
          serviceName: string;
          startsAt: string;
          duration: number;
          status: string;
        }[];
      }>("/dashboard"),
    enabled: !demo,
  });
  const chart = [
    { day: "Lun", value: 65 },
    { day: "Mar", value: 89 },
    { day: "Mer", value: 72 },
    { day: "Jeu", value: 110 },
    { day: "Ven", value: 94 },
    { day: "Sam", value: 142 },
    { day: "Dim", value: 118 },
  ];
  return (
    <main className="dashboard">
      <div className="page-heading">
        <div className="eyebrow">VOTRE ACTIVITÉ EN UN REGARD</div>
        <div>
          <h1>
            Bonjour {demo ? "Aïcha" : name?.split(" ")[0]}{" "}
            <span className="greeting-flower">✳</span>
          </h1>
          <Link
            className="button dark"
            to={demo ? "/inscription" : "/app/prestations"}
          >
            <Plus size={17} />
            {demo ? "Créer mon institut" : "Ajouter une prestation"}
          </Link>
        </div>
        <p>Une belle journée commence par un esprit tranquille.</p>
      </div>
      {data.isError && (
        <p className="error" role="alert">
          {data.error.message}
        </p>
      )}
      {demo && (
        <section className="studio-banner">
          <div>
            <div className="eyebrow">LA BEAUTÉ EST VOTRE MÉTIER</div>
            <h2>
              Votre talent.
              <br />
              <em>De belles ambitions.</em>
            </h2>
            <p>Chaque soin compte. Chaque journée aussi.</p>
          </div>
          <StudioPhotoStrip photos={projectPhotos} />
        </section>
      )}
      <div className="kpi-grid">
        {[
          {
            label: demo ? "Chiffre d’affaires du jour" : "Prestations actives",
            value: demo ? "185 000" : String(data.data?.services ?? 0),
            unit: demo ? "FCFA" : "dans votre catalogue",
            Icon: demo ? Wallet : Scissors,
            detail: demo ? "+12,8 % vs hier" : "Un catalogue à votre image",
          },
          {
            label: demo ? "Rendez-vous aujourd’hui" : "Prochains rendez-vous",
            value: demo ? "8" : String(data.data?.appointments.length ?? 0),
            unit: demo ? "2 encore à venir" : "réservations à venir",
            Icon: CalendarDays,
            detail: demo
              ? "Une journée bien remplie"
              : "Agenda prévu en phase 3",
          },
          {
            label: "Votre clientèle",
            value: demo ? "248" : String(data.data?.clients ?? 0),
            unit: demo ? "clientes & clients" : "clients enregistrés",
            Icon: Users,
            detail: demo ? "+18 ce mois-ci" : "Module clientèle à venir",
          },
          {
            label: demo ? "Taux de satisfaction" : "Votre espace",
            value: demo ? "98" : "Actif",
            unit: demo ? "% de beaux moments" : "données séparées par institut",
            Icon: Heart,
            detail: demo ? "Merci à votre équipe !" : "Bienvenue chez Belleza",
          },
        ].map(({ label, value, unit, Icon, detail }, i) => (
          <article className={"kpi kpi-" + i} key={label}>
            <div>
              <span>{label}</span>
              <span className="kpi-icon">
                <Icon size={18} />
              </span>
            </div>
            <h2>
              {value} <small>{unit === "FCFA" ? unit : ""}</small>
            </h2>
            {unit !== "FCFA" && <small>{unit}</small>}
            <p>
              <span className={demo && i % 2 === 0 ? "positive" : ""}>
                {demo && i % 2 === 0 && <ArrowUpRight size={13} />} {detail}
              </span>
            </p>
          </article>
        ))}
      </div>
      <div className="dashboard-middle">
        <section className="panel revenue">
          <div className="panel-heading">
            <div>
              <h3>
                {demo
                  ? "Votre activité grandit"
                  : "Votre activité commence ici"}
              </h3>
              <p>
                {demo
                  ? "Évolution du chiffre d’affaires"
                  : "Des indicateurs alimentés par vos futures opérations."}
              </p>
            </div>
            <span className="period-label">
              {demo ? "Cette semaine" : "Vue d’ensemble"}
            </span>
          </div>
          {demo ? (
            <>
              <div className="chart-total">
                810 000 <span>FCFA</span>
                <small>↗ +18,6 %</small>
              </div>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chart}
                    margin={{ top: 10, right: 12, bottom: 0, left: 12 }}
                  >
                    <defs>
                      <linearGradient id="pink" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#E8B4B8"
                          stopOpacity={0.55}
                        />
                        <stop
                          offset="100%"
                          stopColor="#E8B4B8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#8b8287", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(v) => [
                        money(Number(v) * 1000),
                        "Revenu illustratif",
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #eee",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#c98690"
                      strokeWidth={2.5}
                      fill="url(#pink)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="real-empty">
              <ChartNoAxesCombined size={34} />
              <h3>Vos chiffres, au bon moment.</h3>
              <p>
                Aucun revenu enregistré. La caisse sera intégrée lors de la
                phase commerciale.
              </p>
              <Link to="/app/prestations">
                Commencer par mon catalogue <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>
        <section className="panel popular">
          <div className="panel-heading">
            <div>
              <h3>
                {demo ? "Les favoris de vos clientes" : "Vos premiers pas"}
              </h3>
              <p>
                {demo
                  ? "Prestations les plus réservées"
                  : "Construisons votre espace ensemble."}
              </p>
            </div>
            <Scissors size={19} />
          </div>
          {demo ? (
            <>
              {[
                ["Soin visage éclat", "Esthétique", "32 réservations", 87],
                ["Manucure semi-permanente", "Onglerie", "24 réservations", 64],
                ["Massage relaxant", "Bien-être", "18 réservations", 49],
              ].map(([n, c, total, width], i) => (
                <div className="popular-item" key={n}>
                  <span className="rank">0{i + 1}</span>
                  <div>
                    <b>{n}</b>
                    <small>
                      {c} <span>{total}</span>
                    </small>
                    <div className="progress">
                      <i style={{ width: width + "%" }} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="popular-note">
                <Heart size={15} /> De petits soins, de grandes fidélités.
              </div>
            </>
          ) : (
            <div className="onboarding-list">
              <Link to="/app/prestations">
                <span>01</span>
                <div>
                  <b>Créer votre catalogue</b>
                  <small>Vos soins, vos prix, vos durées.</small>
                </div>
                <ArrowUpRight size={18} />
              </Link>
              <div>
                <span>02</span>
                <div>
                  <b>Composer votre équipe</b>
                  <small>Disponible dans la prochaine phase.</small>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <b>Ouvrir votre agenda</b>
                  <small>Disponible dans la prochaine phase.</small>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      <section className="panel appointments">
        <div className="panel-heading">
          <div>
            <h3>
              {demo ? "Au programme aujourd’hui" : "Vos prochains rendez-vous"}
            </h3>
            <p>
              {demo
                ? "Chaque rendez-vous, une attention particulière."
                : "Les réservations apparaîtront ici."}
            </p>
          </div>
          {demo && <span className="pill">4 rendez-vous illustratifs</span>}
        </div>
        {demo ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>HORAIRE</th>
                  <th>CLIENTE</th>
                  <th>PRESTATION</th>
                  <th>COLLABORATRICE</th>
                  <th>STATUT</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {demoAppointments.map((a, i) => (
                  <tr key={a.name}>
                    <td>
                      <b>{a.time}</b>
                      <small>
                        <Clock size={11} />
                        {a.duration} min
                      </small>
                    </td>
                    <td>
                      <span className={"client-avatar avatar-" + i}>
                        {a.name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </span>
                      <b>{a.name}</b>
                    </td>
                    <td>{a.service}</td>
                    <td>
                      <span className="employee-dot" />
                      {a.employee}
                    </td>
                    <td>
                      <span className={"status status-" + i}>
                        <i />
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <MoreHorizontal size={19} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <CalendarDays size={27} />
            <h3>Votre agenda prend bientôt vie.</h3>
            <p>
              La création de rendez-vous et la réservation publique seront
              intégrées en phase 3 et 5.
            </p>
          </div>
        )}
      </section>
      {demo && <PhotoGallery compact />}
      <section className="bottom-note">
        <span>
          <Sparkles size={18} />
          <b>Votre temps est précieux.</b> Belleza vous aide à le consacrer à
          l’essentiel.
        </span>
        <Link to="/">
          L’univers Belleza <ArrowUpRight size={15} />
        </Link>
      </section>
    </main>
  );
}

const serviceSchema = z.object({
  name: z.string().min(2, "Au moins 2 caractères."),
  description: z.string().max(1000),
  category: z.string().min(2, "Choisissez une catégorie."),
  price: z.number().int().min(0, "Montant positif requis."),
  duration: z.number().int().min(5).max(480),
  active: z.boolean(),
});
type ServiceForm = z.infer<typeof serviceSchema>;
function Services() {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["services"],
    queryFn: () => api<Service[]>("/services"),
  });
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/me") });
  const canEdit = ["OWNER", "MANAGER"].includes(me.data?.role || "");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<Service | null>(null);
  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Esthétique",
      price: 0,
      duration: 60,
      active: true,
    },
  });
  const save = useMutation({
    mutationFn: (values: ServiceForm) =>
      api("/services" + (editing?.id ? "/" + editing.id : ""), {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      setEditing(undefined);
      setMessage("Votre prestation a été enregistrée.");
      void cache.invalidateQueries({ queryKey: ["services"] });
      void cache.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api("/services/" + id, { method: "DELETE" }),
    onSuccess: () => {
      setDeleting(null);
      setMessage("La prestation a été supprimée.");
      void cache.invalidateQueries({ queryKey: ["services"] });
      void cache.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  function open(s: Service | null) {
    form.reset(
      s || {
        name: "",
        description: "",
        category: "Esthétique",
        price: 0,
        duration: 60,
        active: true,
      },
    );
    save.reset();
    setEditing(s);
  }
  const services = query.data || [];
  const filtered = services.filter(
    (s) =>
      (category === "Toutes" || s.category === category) &&
      (s.name + " " + s.category)
        .toLocaleLowerCase("fr")
        .includes(search.toLocaleLowerCase("fr")),
  );
  return (
    <main className="dashboard">
      <div className="page-heading">
        <div className="eyebrow">VOTRE EXPERTISE, À L’HONNEUR</div>
        <div>
          <h1>
            Vos prestations<span className="greeting-flower">✳</span>
          </h1>
          {canEdit && (
            <button className="button dark" onClick={() => open(null)}>
              <Plus size={17} /> Nouvelle prestation
            </button>
          )}
        </div>
        <p>Un catalogue aussi unique que votre savoir-faire.</p>
      </div>
      {message && (
        <div className="success" role="status">
          {message}
        </div>
      )}
      <section className="panel catalog">
        <div className="catalog-tools">
          <label className="search-input">
            <Search size={18} />
            <input
              aria-label="Rechercher une prestation"
              placeholder="Rechercher une prestation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filtrer par catégorie"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["Toutes", ...new Set(services.map((s) => s.category))].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
          <span>
            {filtered.length} prestation{filtered.length > 1 ? "s" : ""}
          </span>
        </div>
        {query.isPending ? (
          <div className="empty">Chargement du catalogue…</div>
        ) : query.isError ? (
          <p className="error" role="alert">
            {query.error.message}
          </p>
        ) : filtered.length ? (
          <div className="service-grid">
            {filtered.map((s) => (
              <article key={s.id}>
                <div>
                  <span className="feature-icon">
                    <Scissors size={22} />
                  </span>
                  <span className="pill">
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <small>{s.category}</small>
                <h3>{s.name}</h3>
                <p>
                  {s.description ||
                    "Une prestation pensée pour vos clientes et clients."}
                </p>
                <div className="service-price">
                  <b>{money(s.price)}</b>
                  <span>
                    <Clock size={14} />
                    {s.duration} min
                  </span>
                </div>
                {canEdit && (
                  <div className="service-actions">
                    <button onClick={() => open(s)}>Modifier</button>
                    <button
                      onClick={() => {
                        remove.reset();
                        setDeleting(s);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Scissors size={32} />
            <h3>
              {search || category !== "Toutes"
                ? "Aucune prestation trouvée."
                : "Votre savoir-faire mérite sa vitrine."}
            </h3>
            <p>
              {search
                ? "Essayez un autre mot-clé."
                : "Ajoutez votre premier soin, son tarif et sa durée."}
            </p>
            {canEdit && (
              <button className="button dark" onClick={() => open(null)}>
                <Plus size={16} /> Créer une prestation
              </button>
            )}
          </div>
        )}
      </section>
      {editing !== undefined && (
        <Modal onClose={() => setEditing(undefined)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-title"
          >
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setEditing(undefined)}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">VOTRE CATALOGUE</div>
            <h2 id="service-title">
              {editing ? "Modifier la prestation" : "Un nouveau soin."}
            </h2>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))}>
              <label>
                Nom de la prestation
                <input autoFocus {...form.register("name")} required />
              </label>
              <label>
                Catégorie
                <input
                  {...form.register("category")}
                  required
                  list="categories"
                />
                <datalist id="categories">
                  {[
                    "Esthétique",
                    "Coiffure",
                    "Onglerie",
                    "Spa & bien-être",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </datalist>
              </label>
              <div className="form-row">
                <label>
                  Prix en FCFA
                  <input
                    type="number"
                    min="0"
                    {...form.register("price", { valueAsNumber: true })}
                  />
                </label>
                <label>
                  Durée en minutes
                  <input
                    type="number"
                    min="5"
                    max="480"
                    {...form.register("duration", { valueAsNumber: true })}
                  />
                </label>
              </div>
              <label>
                Description
                <textarea {...form.register("description")} rows={3} />
              </label>
              <label className="check-label">
                <input type="checkbox" {...form.register("active")} />{" "}
                Prestation active
              </label>
              {Object.values(form.formState.errors).map((e, i) => (
                <small className="error" key={i}>
                  {e.message}
                </small>
              ))}
              {save.isError && (
                <p className="error" role="alert">
                  {save.error.message}
                </p>
              )}
              <button className="button dark" disabled={save.isPending}>
                {save.isPending
                  ? "Enregistrement…"
                  : "Enregistrer la prestation"}
                <Check size={17} />
              </button>
            </form>
          </section>
        </Modal>
      )}
      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Supprimer cette prestation ?</h2>
            <p>« {deleting.name} » sera retirée de votre catalogue.</p>
            {remove.isError && <p className="error">{remove.error.message}</p>}
            <div className="hero-actions">
              <button
                className="button light"
                onClick={() => setDeleting(null)}
              >
                Conserver
              </button>
              <button
                className="button dark"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleting.id)}
              >
                Supprimer
              </button>
            </div>
          </section>
        </Modal>
      )}
    </main>
  );
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PageMotion />
        <Routes>
          <Route path="/" element={<Marketing />} />
          <Route path="/connexion" element={<Auth />} />
          <Route path="/inscription" element={<Auth register />} />
          <Route path="/apercu/*" element={<AppShell demo />} />
          <Route path="/app/*" element={<AppShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
