import type { Metadata } from "next";
import ConfigureAmplify from "@/components/ConfigureAmplify";
import { WalletProvider } from "@/components/app/WalletContext";
import { PriceProvider } from "./contexts/PriceContext";
import { BaseTokenPriceProvider } from "./contexts/BaseTokenPriceProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xray — One-Stop for Tokenized Equities on X Layer",
  description: "Explore tokenized equities and pre-IPO on X Layer with Xray, your one-stop AI platform powered by frontier AI and real-time market data. Discover opportunities that fit your goals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=Zen+Tokyo+Zoo&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">
        <ConfigureAmplify>
          <WalletProvider>
            <PriceProvider>
              <BaseTokenPriceProvider>{children}</BaseTokenPriceProvider>
            </PriceProvider>
          </WalletProvider>
        </ConfigureAmplify>
      </body>
    </html>
  );
}
