import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Gamepad2,
  MapPin,
  Radio,
} from "lucide-react";

const communityLinks = [
  {
    label: "Coog Gaming Discord",
    href: "https://discord.gg/coog-gaming-154441500950921216",
  },
  {
    label: "Coog Esports Discord",
    href: "https://discord.gg/DxbquYhFCt",
  },
  { label: "Twitter", href: "https://x.com/coogesports" },
  { label: "Instagram", href: "https://instagram.com/coogesports" },
  { label: "Twitch", href: "https://twitch.tv/coogesports" },
  { label: "YouTube", href: "https://youtube.com/@coogesports" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-red-500/25 bg-black/95 text-zinc-300 shadow-[0_-14px_45px_rgba(0,0,0,0.5)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(239,68,68,0.16),transparent_30%),radial-gradient(circle_at_88%_90%,rgba(127,29,29,0.16),transparent_28%),linear-gradient(105deg,transparent_42%,rgba(127,29,29,0.07)_50%,transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/90 to-transparent shadow-[0_0_14px_rgba(239,68,68,0.9)]"
      />

      <div className="relative mx-auto max-w-[1600px] px-6 py-12 lg:px-8 lg:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:gap-14">
          <section aria-labelledby="footer-brand-heading">
            <div className="flex items-center gap-4">
              <div className="group relative flex h-16 w-16 shrink-0 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-1 rotate-45 border border-red-500/30 bg-red-950/30 transition duration-500 group-hover:rotate-[135deg] group-hover:border-red-400/70"
                />
                <Image
                  src="/coog-gaming-logo.png"
                  alt=""
                  width={500}
                  height={563}
                  className="relative z-10 h-16 w-auto object-contain drop-shadow-[0_0_12px_rgba(239,68,68,0.4)] transition duration-300 group-hover:scale-105"
                />
              </div>

              <div className="min-w-0">
                <h2
                  id="footer-brand-heading"
                  className="font-heading text-xl tracking-[0.16em] text-white sm:text-2xl"
                >
                  COOG GAMING
                </h2>
                <p className="mt-1.5 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.28em] text-red-400">
                  <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Cougar powered
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-md text-sm leading-6 text-zinc-400">
              The gaming and esports community at the University of Houston.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-950/20 px-3 py-2 text-[0.65rem] uppercase tracking-[0.22em] text-zinc-400 shadow-[inset_0_1px_0_rgba(248,113,113,0.08)]">
              <Radio
                className="h-3.5 w-3.5 animate-pulse text-red-400"
                aria-hidden="true"
              />
              Player hub // Houston, TX
            </div>
          </section>

          <section aria-labelledby="community-heading">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-7 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <h2
                id="community-heading"
                className="text-xs uppercase tracking-[0.24em] text-white"
              >
                Community
              </h2>
            </div>

            <nav aria-label="Community links" className="grid gap-1">
              {communityLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link relative flex items-center justify-between overflow-hidden rounded-md border border-transparent px-3 py-2 text-sm text-zinc-400 outline-none transition duration-300 hover:border-white/10 hover:bg-white/[0.045] hover:text-white focus-visible:border-red-500/50 focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-px origin-center scale-y-0 bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)] transition-transform duration-300 group-hover/link:scale-y-100"
                  />
                  <span>{link.label}</span>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-zinc-600 transition duration-300 group-hover/link:translate-x-0.5 group-hover/link:text-red-400"
                  />
                </a>
              ))}
            </nav>
          </section>

          <section
            aria-labelledby="arena-heading"
            className="md:col-span-2 lg:col-span-1"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-7 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <h2
                id="arena-heading"
                className="text-xs uppercase tracking-[0.24em] text-white"
              >
                Visit the arena
              </h2>
            </div>

            <Link
              href="https://www.uh.edu/studentcenters/games/esports/"
              className="group relative flex max-w-md items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-5 outline-none transition duration-300 hover:-translate-y-0.5 hover:border-red-500/40 hover:bg-red-950/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35),0_0_22px_rgba(220,38,38,0.1)] focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <span
                aria-hidden="true"
                className="absolute -left-px -top-px h-5 w-5 border-l border-t border-red-400/70"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-px -right-px h-5 w-5 border-b border-r border-red-400/70"
              />

              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-gradient-to-b from-red-900/60 to-red-950/35 text-red-300 shadow-[inset_0_1px_0_rgba(248,113,113,0.2),0_0_18px_rgba(220,38,38,0.14)]">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2 font-heading text-sm uppercase tracking-[0.1em] text-white">
                  Coog Gaming Arena
                  <ExternalLink
                    className="h-3.5 w-3.5 shrink-0 text-red-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-2 block text-xs leading-5 text-zinc-500 transition-colors group-hover:text-zinc-400">
                  Hours, location, and arena information
                </span>
              </span>
            </Link>
          </section>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.13em] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Coog Gaming. All rights reserved.</p>

          <a
            href="https://linktr.ee/coogesports"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-fit items-center gap-2 text-zinc-500 outline-none transition-colors hover:text-red-300 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-red-400"
          >
            All Coog Esports Links
            <ExternalLink
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
