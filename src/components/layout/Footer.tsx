import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Platform: [
    { href: "/trips", label: "Explore Trips" },
    { href: "/vote", label: "Vote" },
    { href: "/submit", label: "Submit Request" },
    { href: "/benefits", label: "Benefits" },
  ],
  Resources: [
    { href: "/resources", label: "Whitepaper" },
    { href: "/resources", label: "Constitution" },
    { href: "/faq", label: "FAQ" },
    { href: "/membership", label: "Membership" },
  ],
  Community: [
    { href: "https://discord.gg/triphut", label: "Discord" },
    { href: "https://twitter.com/triphut", label: "Twitter" },
    { href: "https://jpg.store", label: "JPG.store" },
    { href: "mailto:triphut_by@yaadlabs.io", label: "Contact" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="TripHunt"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-foreground">TripHunt</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              A decentralized travel club sending members on community-funded
              adventures around the world.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground">{category}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border/60 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TripHunt DAO. Built on Cardano. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
