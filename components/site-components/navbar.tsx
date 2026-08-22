import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-white">
          <Image
            src="/coog-gaming-logo.png"
            alt="Coog Gaming"
            width={500}
            height={563}
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
