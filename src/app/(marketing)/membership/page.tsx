import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Wallet,
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { mockStats } from "@/data/mock-trips";

const membershipSteps = [
  {
    step: 1,
    title: "Purchase NFT",
    description:
      "Head to JPG.store and purchase a TripHunt membership NFT from the secondary market.",
    icon: ShieldCheck,
  },
  {
    step: 2,
    title: "Connect Your Wallet",
    description:
      "Install a Cardano wallet (Nami, Eternl, Flint, or Lace) and connect it to TripHunt.",
    icon: Wallet,
  },
  {
    step: 3,
    title: "Join the Community",
    description:
      "Connect your Discord account to join our community of travelers and start participating.",
    icon: Users,
  },
];

export default function MembershipPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Become a Member"
            subtitle="Your TripHunt NFT is your passport to community-funded travel adventures around the world."
          />
        </div>
      </section>

      {/* NFT Showcase */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* NFT Image */}
            <div className="relative mx-auto max-w-md">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=600&fit=crop"
                  alt="TripHunt Membership NFT"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {/* Member count badge */}
              <div className="absolute -bottom-4 -right-4 rounded-2xl border border-border/60 bg-white px-5 py-3 shadow-lg">
                <p className="text-2xl font-bold text-foreground">
                  {mockStats.communityMembers}
                </p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
            </div>

            {/* Info */}
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Your Membership Pass
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The TripHunt NFT is more than a collectible — it&apos;s your membership
                card to a global travel community. Hold it in your Cardano wallet to
                unlock voting rights, travel grant applications, discounted stays, and
                exclusive member benefits.
              </p>

              <div className="mt-8 space-y-6">
                {membershipSteps.map((step) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {step.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://jpg.store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "lg" })}
                >
                  Buy on JPG.store
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <Link href="/benefits" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  View Benefits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
