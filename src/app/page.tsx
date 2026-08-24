import { redirect } from "next/navigation";
import Link from "next/link";
import { Code2, Globe, Smartphone, Cpu, Phone, ArrowRight } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { ContactForm } from "@/components/marketing/contact-form";

const SERVICES = [
  {
    icon: Globe,
    title: "Weby",
    description: "Firemné prezentácie, e-shopy a webové platformy postavené na modernom stacku.",
  },
  {
    icon: Smartphone,
    title: "Aplikácie",
    description: "Webové a mobilné aplikácie šité na mieru vášmu biznisu.",
  },
  {
    icon: Cpu,
    title: "Softvér na mieru",
    description: "Interné nástroje a automatizácie, ktoré zrýchlia vašu prevádzku.",
  },
];

const PHONE = "0940 328 457";
const PHONE_HREF = "tel:+421940328457";

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === "ADMIN" ? "/dashboard" : "/my-tasks");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
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
      </header>

      <main>
        <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/25 via-slate-950 to-slate-950"
            aria-hidden
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-indigo-400 uppercase">Croxan s.r.o.</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Tvoríme weby, aplikácie a softvér na mieru
          </h1>
          <p className="mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
            Od nápadu po nasadenie — navrhneme a postavíme digitálne riešenie, ktoré vášmu biznisu
            skutočne pomôže.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Kontaktujte nás
              <ArrowRight className="h-4 w-4" />
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
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">Čo pre vás vieme postaviť</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur transition hover:border-indigo-400/40 hover:bg-white/[0.07]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="kontakt" className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Poďme spolu na projekte</h2>
            <p className="mt-3 text-sm text-slate-400">
              Napíšte nám pár slov o vašom nápade, alebo nás rovno zavolajte na{" "}
              <a href={PHONE_HREF} className="font-medium text-indigo-400 hover:text-indigo-300">
                {PHONE}
              </a>
              .
            </p>
          </div>
          <div className="mt-10">
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Croxan s.r.o. — {PHONE}
      </footer>
    </div>
  );
}
