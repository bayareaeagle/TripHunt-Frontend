export interface FaqItem {
  question: string;
  answer: string;
  category: "general" | "membership" | "voting" | "treasury";
}

export const faqItems: FaqItem[] = [
  {
    question: "What is TripHunt?",
    answer:
      "TripHunt is a decentralized travel club that sends members on free or discounted vacations using community resources. It operates as a DAO (Decentralized Autonomous Organization) on the Cardano blockchain, where members collectively decide how travel funds are allocated.",
    category: "general",
  },
  {
    question: "How does the travel club work?",
    answer:
      "Members submit travel requests describing where they want to go and why the community should fund their trip. Other members vote on these proposals. If a proposal passes with majority support, funds are released from the community treasury to cover the trip.",
    category: "general",
  },
  {
    question: "How do I join TripHunt?",
    answer:
      "To join, you need to purchase a TripHunt membership NFT from JPG.store (Cardano's NFT marketplace). Once you hold the NFT in your Cardano wallet, connect your wallet and Discord to the platform to access all member benefits.",
    category: "membership",
  },
  {
    question: "What is an NFT?",
    answer:
      "An NFT (Non-Fungible Token) is a unique digital asset on the blockchain. Your TripHunt NFT serves as your membership pass — it proves you're a member and grants you access to voting, travel requests, and all club benefits.",
    category: "membership",
  },
  {
    question: "What wallet do I need?",
    answer:
      "You need a Cardano-compatible wallet such as Nami, Eternl, Flint, or Lace. These are browser extensions that let you store your ADA and NFTs, and interact with the TripHunt platform.",
    category: "membership",
  },
  {
    question: "How do I submit a travel request?",
    answer:
      "Connect your wallet, navigate to the Submit page, and fill out the travel request form. You'll need to provide your destination, travel dates, estimated costs, and a 15-second video explaining why the community should fund your trip.",
    category: "voting",
  },
  {
    question: "How does voting work?",
    answer:
      "Each NFT holder gets one vote per proposal. You can vote For or Against any active travel request. Voting uses a contention-free two-phase system on the blockchain, ensuring fair and transparent results. Proposals need a majority to pass.",
    category: "voting",
  },
  {
    question: "Do I earn anything for voting?",
    answer:
      "Yes! Active participation in governance earns you reward points. The more you vote and engage with the community, the more points you accumulate, which can be redeemed for travel perks and benefits.",
    category: "voting",
  },
  {
    question: "Where does the travel funding come from?",
    answer:
      "Funds come from the community treasury, which is built through membership contributions, partnerships, and community-owned properties. The treasury is managed on-chain with full transparency.",
    category: "treasury",
  },
  {
    question: "How much can a trip be funded for?",
    answer:
      "Each trip proposal has a maximum disbursement limit set by the DAO configuration. This ensures the treasury remains sustainable while supporting multiple travelers. The current limits are visible in the DAO configuration.",
    category: "treasury",
  },
  {
    question: "What is a DAO?",
    answer:
      "A DAO (Decentralized Autonomous Organization) is a community-led organization governed by smart contracts on the blockchain. There's no central authority — members collectively make decisions through transparent voting.",
    category: "general",
  },
  {
    question: "Why do I need to connect Discord?",
    answer:
      "Discord is our primary community hub where members discuss proposals, share travel stories, coordinate trips, and stay updated on club news. Connecting your Discord links your membership to the community.",
    category: "membership",
  },
];
