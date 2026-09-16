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
  title: "Xray — Your Gateway to Tokenized Stocks on X Layer",
  description: "Explore tokenized stocks on X Layer with Xray, a personalized AI dashboard powered by frontier AI and real-time market data backed by leading data providers. Discover stocks that fit your goals.",
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
