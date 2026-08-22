import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Coog Gaming */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Image
                src="/coog-gaming-logo.png"
                alt="Coog Gaming"
                width={500}
                height={563}
                className="h-10 w-auto object-contain"
              />
            </div>

            <p className="max-w-sm text-sm text-gray-400">
              The gaming and esports community at the University of Houston.
            </p>
          </div>

          {/* Community / Social Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Community</h3>

            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://discord.gg/coog-gaming-154441500950921216"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit transition-colors hover:text-white"
              >
                Coog Gaming Discord
              </a>

              <a
                href="https://discord.gg/DxbquYhFCt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit transition-colors hover:text-white"
              >
                Coog Esports Discord
              </a>

              <a
                href="https://x.com/coogesports"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit transition-colors hover:text-white"
              >
                Twitter
              </a>

              <a
                href="https://instagram.com/coogesports"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit transition-colors hover:text-white"
              >
                Instagram
              </a>

              <a
                href="https://twitch.tv/coogesports"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit transition-colors hover:text-white"
              >
                Twitch
              </a>

              <a
                href="https://youtube.com/@coogesports"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit transition-colors hover:text-white"
              >
                YouTube
              </a>
            </div>
          </div>

          {/* Arena */}
          <div>
            <h3 className="mb-4 font-semibold text-white">
              Visit The Esports Arena
            </h3>

            {/* 👇 THIS IS THE ARENA LINK */}
            <Link
              href="https://www.uh.edu/studentcenters/games/esports/"
              className="group flex max-w-xs items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 transition hover:border-gray-500 hover:bg-gray-700"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-700">
                <MapPin className="h-5 w-5 text-white" />
              </div>

              <div>
                <div className="flex items-center gap-1 font-medium text-white">
                  Coog Gaming Arena
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>

                <p className="mt-1 text-xs text-gray-400">
                  Hours, location, and arena information
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-gray-800 pt-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Coog Gaming. All rights reserved.</p>

          <a
            href="https://linktr.ee/coogesports"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit transition-colors hover:text-gray-300"
          >
            All Coog Esports Links ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
