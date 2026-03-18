import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { benefits } from "@/data/mock-benefits";

export default function BenefitsPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Travel Club Benefits"
            subtitle="As a TripHunt NFT holder, you get access to exclusive travel perks, governance rights, and a global community of explorers."
          />
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group rounded-2xl border border-border/60 bg-card p-8 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Savings highlight */}
          <div className="mt-16 rounded-2xl bg-primary/5 p-8 text-center sm:p-12">
            <p className="text-4xl font-bold text-primary">12%+</p>
            <p className="mt-2 text-lg font-medium text-foreground">
              Average savings on vacations through TripHunt
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              *Conditions apply. Savings vary by destination and season.
            </p>
            <Link href="/membership" className={buttonVariants({ className: "mt-6" })}>
              Become a Member
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
