import type { Metadata } from "next";
import { Space_Grotesk, Inter, Zen_Tokyo_Zoo } from "next/font/google";
import ConfigureAmplify from "@/components/ConfigureAmplify";
import { PriceProvider } from "./contexts/PriceContext";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const zenTokyoZen = Zen_Tokyo_Zoo({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "Zivic — Your Gateway to Tokenized Stocks",
  description: "Explore tokenized stocks with Zivic, a personalized AI dashboard powered by frontier AI and real-time market data backed by leading data providers. Discover stocks that fit your goals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${zenTokyoZen.variable}`}>
      <body className="font-sans">
        <ConfigureAmplify>
          <PriceProvider>{children}</PriceProvider>
        </ConfigureAmplify>
      </body>
    </html>
  );
}
