"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Send } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";

const navLinks = [
  { href: "/trips", label: "Explore Trips" },
  { href: "/vote", label: "Vote" },
  { href: "/benefits", label: "Benefits" },
  { href: "/membership", label: "Membership" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="TripHunt"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            TripHunt
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/submit"
            className={buttonVariants({ size: "sm", className: "gap-1.5" })}
          >
            <Send className="h-3.5 w-3.5" />
            Submit Request
          </Link>
          <WalletConnectButton />
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border/60 bg-white lg:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="space-y-2 pt-3">
              <Link
                href="/submit"
                onClick={() => setMobileOpen(false)}
                className={buttonVariants({ size: "sm", className: "w-full gap-1.5" })}
              >
                <Send className="h-3.5 w-3.5" />
                Submit Request
              </Link>
              <WalletConnectButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
