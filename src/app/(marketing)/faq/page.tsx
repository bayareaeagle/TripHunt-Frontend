"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqItems } from "@/data/mock-faq";

const categories = [
  { key: "all", label: "All" },
  { key: "general", label: "General" },
  { key: "membership", label: "Membership" },
  { key: "voting", label: "Voting" },
  { key: "treasury", label: "Treasury" },
] as const;

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredFaqs =
    activeCategory === "all"
      ? faqItems
      : faqItems.filter((faq) => faq.category === activeCategory);

  return (
    <>
      {/* Header */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about TripHunt, membership, voting, and the DAO."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <Accordion className="mt-10">
            {filteredFaqs.map((faq, i) => (
              <AccordionItem key={i}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
