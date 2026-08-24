import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  Globe,
  Smartphone,
  Cpu,
  Phone,
  ArrowRight,
  MessagesSquare,
  PenTool,
  Rocket,
  LifeBuoy,
} from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { ContactForm } from "@/components/marketing/contact-form";
import { Reveal } from "@/components/marketing/reveal";

const SERVICES = [
  {
    icon: Globe,
    title: "Weby",
    description:
      "Firemné prezentácie, e-shopy a webové platformy postavené na modernom stacku — rýchle, prehľadné a pripravené rásť s vami.",
    span: "sm:col-span-2",
  },
  {
    icon: Smartphone,
    title: "Aplikácie",
    description: "Webové a mobilné aplikácie šité na mieru vášmu biznisu.",
    span: "",
  },
  {
    icon: Cpu,
    title: "Softvér na mieru",
    description: "Interné nástroje a automatizácie, ktoré zrýchlia vašu prevádzku.",
    span: "",
  },
];

const PROCESS = [
  { icon: MessagesSquare, title: "Konzultácia", description: "Spoznáme váš projekt a ciele." },
  { icon: PenTool, title: "Návrh", description: "Navrhneme riešenie a dizajn." },
  { icon: Rocket, title: "Vývoj a nasadenie", description: "Postavíme a spustíme produkt." },
  { icon: LifeBuoy, title: "Podpora", description: "Staráme sa o chod aj po štarte." },
];

const PHONE = "0940 328 457";
const PHONE_HREF = "tel:+421940328457";

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === "ADMIN" ? "/dashboard" : "/my-tasks");

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Croxan</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#sluzby" className="hidden text-sm text-slate-300 transition hover:text-white sm:block">
              Služby
            </a>
            <a href="#proces" className="hidden text-sm text-slate-300 transition hover:text-white sm:block">
              Ako pracujeme
            </a>
            <a href="#kontakt" className="hidden text-sm text-slate-300 transition hover:text-white sm:block">
              Kontakt
            </a>
            <Link
              href="/login"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Prihlásiť sa
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-28 text-center sm:px-6 sm:py-40">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
            <div className="animate-blob absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-indigo-600/30 blur-[100px]" />
            <div className="animate-blob-slow absolute top-10 right-1/4 h-80 w-80 rounded-full bg-purple-600/20 blur-[100px]" />
            <div
              className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px]"
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Digitálne štúdio · Slovensko
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Tvoríme weby, aplikácie a{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              softvér na mieru
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
            Od nápadu po nasadenie — navrhneme a postavíme digitálne riešenie, ktoré vášmu biznisu
            skutočne pomôže.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#kontakt"
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
            >
              Kontaktujte nás
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {PHONE}
            </a>
          </div>
        </section>

        <section id="sluzby" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-indigo-400 uppercase">Služby</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Čo pre vás vieme postaviť</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {SERVICES.map((service, i) => (
              <Reveal key={service.title} delay={i * 100} className={service.span}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur transition hover:border-indigo-400/40 hover:bg-white/[0.07]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 transition group-hover:bg-indigo-500/25">
                    <service.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{service.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{service.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="proces" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-indigo-400 uppercase">Proces</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Ako pracujeme</h2>
          </Reveal>
          <div className="relative mt-12 grid gap-8 sm:grid-cols-4">
            <div className="absolute top-6 right-0 left-0 hidden h-px bg-white/10 sm:block" aria-hidden />
            {PROCESS.map((step, i) => (
              <Reveal key={step.title} delay={i * 100} className="relative text-center">
                <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-slate-950 text-indigo-400">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-purple-600/10 px-8 py-14 text-center sm:px-16">
              <div
                className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-[100px]"
                aria-hidden
              />
              <h2 className="text-2xl font-semibold sm:text-3xl">Máte nápad na projekt?</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
                Napíšte nám alebo zavolajte — poradíme sa a pripravíme návrh riešenia na mieru.
              </p>
              <a
                href="#kontakt"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Poďme na to
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </section>

        <section id="kontakt" className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-indigo-400 uppercase">Kontakt</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Poďme spolu na projekte</h2>
            <p className="mt-3 text-sm text-slate-400">
              Napíšte nám pár slov o vašom nápade, alebo nás rovno zavolajte na{" "}
              <a href={PHONE_HREF} className="font-medium text-indigo-400 hover:text-indigo-300">
                {PHONE}
              </a>
              .
            </p>
          </Reveal>
          <Reveal delay={150} className="mt-10">
            <ContactForm />
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Croxan s.r.o.</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Croxan s.r.o. — {PHONE}
          </p>
        </div>
      </footer>
    </div>
  );
}
