import "./globals.css";

import Navbar from "@/components/site-components/navbar";
import Footer from "@/components/site-components/footer";
import { Geo, Zen_Dots } from "next/font/google";
import { Toaster } from "sonner";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-geo",
  display: "swap",
});

const zenDots = Zen_Dots({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-zen-dots",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geo.variable} ${zenDots.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
