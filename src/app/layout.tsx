import type { Metadata } from "next";
import { Gluten, Nunito } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ListStateProvider } from "@/components/ListStateProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const gluten = Gluten({
  variable: "--font-gluten",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PlantLuva | Buy, bid, swap and rent plants in Trinidad & Tobago",
  description:
    "One marketplace for plant luvas across Trinidad & Tobago. Sell it, bid it, swap it, rent it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-TT" className={`${gluten.variable} ${nunito.variable}`}>
      <body style={{ fontFamily: "var(--font-nunito), sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <a href="#pl-main" className="pl-skip-link">
          Skip to plants
        </a>
        <ToastProvider>
          <AuthProvider>
            <ListStateProvider>
              <Header />
              <main style={{ flex: 1 }}>{children}</main>
              <Footer />
            </ListStateProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
