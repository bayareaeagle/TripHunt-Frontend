import { FileText, PlayCircle, BookOpen, Scale } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";

const resources = [
  {
    title: "TripHunt Explainer Video",
    description: "A quick introduction to how TripHunt works and why it matters.",
    icon: PlayCircle,
    href: "https://youtube.com",
    type: "Video",
  },
  {
    title: "DAO Canvas",
    description: "Our strategic planning document outlining the DAO's goals, structure, and roadmap.",
    icon: BookOpen,
    href: "#",
    type: "PDF",
  },
  {
    title: "DAO Whitepaper",
    description: "Technical documentation covering the smart contracts, governance model, and treasury management.",
    icon: FileText,
    href: "#",
    type: "PDF",
  },
  {
    title: "DAO Constitution",
    description: "The governance rules and principles that guide community decision-making.",
    icon: Scale,
    href: "#",
    type: "PDF",
  },
];

export default function ResourcesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Resources"
            subtitle="Documentation, guides, and media to help you understand the TripHunt DAO."
          />
        </div>
      </section>

      {/* Resources Grid */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {resources.map((resource) => (
              <a
                key={resource.title}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <resource.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {resource.title}
                      </h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {resource.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
