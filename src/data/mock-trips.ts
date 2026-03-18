export interface Trip {
  id: string;
  travelerName: string;
  travelerInitials: string;
  destination: string;
  country: string;
  departureDate: string;
  returnDate: string;
  totalCost: number;
  fundedAmount: number;
  votesFor: number;
  votesAgainst: number;
  status: "active" | "funded" | "completed" | "rejected";
  description: string;
  imageUrl: string;
  accommodationName: string;
  accommodationImage: string;
  accommodationRating: number;
  travelAgent: string;
}

export const mockTrips: Trip[] = [
  {
    id: "trip-001",
    travelerName: "Jessica James",
    travelerInitials: "JJ",
    destination: "Bali, Indonesia",
    country: "Indonesia",
    departureDate: "2026-04-15",
    returnDate: "2026-04-29",
    totalCost: 3500,
    fundedAmount: 2800,
    votesFor: 142,
    votesAgainst: 23,
    status: "active",
    description:
      "Exploring the cultural heart of Bali — visiting ancient temples, rice terraces, and local artisan workshops. This trip will document sustainable tourism practices for the community.",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop",
    accommodationName: "The Kayon Jungle Resort",
    accommodationImage: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop",
    accommodationRating: 4.8,
    travelAgent: "Island Wanderers Co.",
  },
  {
    id: "trip-002",
    travelerName: "Marcus Reid",
    travelerInitials: "MR",
    destination: "Santorini, Greece",
    country: "Greece",
    departureDate: "2026-05-10",
    returnDate: "2026-05-20",
    totalCost: 4200,
    fundedAmount: 4200,
    votesFor: 198,
    votesAgainst: 12,
    status: "funded",
    description:
      "A culinary and photography journey through the Cyclades. Documenting local winemaking traditions and capturing sunset vistas for the community gallery.",
    imageUrl: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop",
    accommodationName: "Canaves Oia Suites",
    accommodationImage: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&h=600&fit=crop",
    accommodationRating: 4.9,
    travelAgent: "Aegean Travels",
  },
  {
    id: "trip-003",
    travelerName: "Amara Johnson",
    travelerInitials: "AJ",
    destination: "Kyoto, Japan",
    country: "Japan",
    departureDate: "2026-03-25",
    returnDate: "2026-04-05",
    totalCost: 5100,
    fundedAmount: 3200,
    votesFor: 167,
    votesAgainst: 31,
    status: "active",
    description:
      "Cherry blossom season immersion — exploring Zen gardens, traditional tea ceremonies, and connecting with local artisans in the historic Higashiyama district.",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop",
    accommodationName: "Hoshinoya Kyoto",
    accommodationImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
    accommodationRating: 4.7,
    travelAgent: "Sakura Journeys",
  },
  {
    id: "trip-004",
    travelerName: "David Chen",
    travelerInitials: "DC",
    destination: "Marrakech, Morocco",
    country: "Morocco",
    departureDate: "2026-06-01",
    returnDate: "2026-06-12",
    totalCost: 2900,
    fundedAmount: 2900,
    votesFor: 211,
    votesAgainst: 8,
    status: "completed",
    description:
      "Navigating the vibrant souks, learning traditional Moroccan cooking, and exploring the Atlas Mountains. Sharing hidden gems with the TripHunt community.",
    imageUrl: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&h=600&fit=crop",
    accommodationName: "Riad Yasmine",
    accommodationImage: "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=800&h=600&fit=crop",
    accommodationRating: 4.6,
    travelAgent: "Desert Compass Tours",
  },
  {
    id: "trip-005",
    travelerName: "Sofia Martinez",
    travelerInitials: "SM",
    destination: "Amalfi Coast, Italy",
    country: "Italy",
    departureDate: "2026-07-10",
    returnDate: "2026-07-22",
    totalCost: 4800,
    fundedAmount: 1200,
    votesFor: 89,
    votesAgainst: 45,
    status: "active",
    description:
      "Coastal road trip along the Amalfi — from Positano to Ravello, documenting family-run trattorias, lemon groves, and hidden swimming coves for the community.",
    imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&h=600&fit=crop",
    accommodationName: "Hotel Santa Caterina",
    accommodationImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    accommodationRating: 4.9,
    travelAgent: "La Dolce Vita Travel",
  },
  {
    id: "trip-006",
    travelerName: "Kwame Asante",
    travelerInitials: "KA",
    destination: "Cape Town, South Africa",
    country: "South Africa",
    departureDate: "2026-08-05",
    returnDate: "2026-08-18",
    totalCost: 3800,
    fundedAmount: 3800,
    votesFor: 176,
    votesAgainst: 19,
    status: "funded",
    description:
      "From Table Mountain to the Cape Winelands — exploring the intersection of nature, culture, and adventure. Partnering with local guides to showcase responsible tourism.",
    imageUrl: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=600&fit=crop",
    accommodationName: "The Silo Hotel",
    accommodationImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop",
    accommodationRating: 4.8,
    travelAgent: "Ubuntu Adventures",
  },
];

export const mockStats = {
  totalFundedTrips: 24,
  activeProposals: 8,
  communityMembers: 312,
  totalDisbursed: 128500,
};

export const mockPartners = [
  { name: "JPG.store", logo: "/images/partners/jpg-store.svg" },
  { name: "Cardano Foundation", logo: "/images/partners/cardano.svg" },
  { name: "Island Wanderers", logo: "/images/partners/island-wanderers.svg" },
  { name: "Travel DAO Alliance", logo: "/images/partners/travel-dao.svg" },
];
