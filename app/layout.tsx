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
      <body>
        <Navbar />
        {children}
        <Footer />
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}