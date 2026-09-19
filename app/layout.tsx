import type { Metadata } from "next";
import { Space_Grotesk, Inter, Zen_Tokyo_Zoo } from "next/font/google";
import ConfigureAmplify from "@/components/ConfigureAmplify";
import { WalletProvider } from "@/components/app/WalletContext";
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
  title: "Xray — One-Stop for Tokenized Stocks on X Layer",
  description: "Explore tokenized stocks and pre-IPO on X Layer with Xray, your one-stop AI platform powered by frontier AI and real-time market data. Discover opportunities that fit your goals.",
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
          <WalletProvider>
            <PriceProvider>{children}</PriceProvider>
          </WalletProvider>
        </ConfigureAmplify>
      </body>
    </html>
  );
}
