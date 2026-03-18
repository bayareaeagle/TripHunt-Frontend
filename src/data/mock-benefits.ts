import {
  Plane,
  Building2,
  Sparkles,
  Gift,
  Lock,
  Vote,
} from "lucide-react";

export interface Benefit {
  title: string;
  description: string;
  icon: typeof Plane;
}

export const benefits: Benefit[] = [
  {
    title: "Travel Grants",
    description:
      "Apply for community-funded travel grants. Submit your trip proposal, get voted in, and receive funding directly from the DAO treasury.",
    icon: Plane,
  },
  {
    title: "Accommodation",
    description:
      "Access free or heavily discounted stays at community-owned and partner properties around the world.",
    icon: Building2,
  },
  {
    title: "Experiences",
    description:
      "Enjoy discounted tours, activities, and cultural experiences through our network of vetted local partners.",
    icon: Sparkles,
  },
  {
    title: "Rewards Program",
    description:
      "Earn points by voting, participating in governance, and contributing to the community. Redeem for travel perks.",
    icon: Gift,
  },
  {
    title: "Exclusive Access",
    description:
      "Get early access to new destinations, member-only content, travel guides, and community events.",
    icon: Lock,
  },
  {
    title: "Governance Rights",
    description:
      "Shape the future of TripHunt. Vote on proposals, destinations, partnerships, and how community funds are allocated.",
    icon: Vote,
  },
];
