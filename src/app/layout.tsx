import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripHunt | Community-Funded Travel",
  description:
    "A decentralized travel club that sends you on free or discounted vacations using community resources. Join the DAO, vote on trips, and explore the world.",
  keywords: ["travel", "DAO", "Cardano", "NFT", "crowdfunding", "community travel"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <WalletProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
