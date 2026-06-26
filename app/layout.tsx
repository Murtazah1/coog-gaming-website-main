import "./globals.css";

import Navbar from "@/components/site-components/navbar";
import Footer from "@/components/site-components/footer";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}