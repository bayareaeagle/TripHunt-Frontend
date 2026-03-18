"use client";

import { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  User,
  MapPin,
  ImageIcon,
  Send,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { NFTGate } from "@/components/wallet/NFTGate";
import {
  SUPPORTED_CURRENCIES,
  PLATFORM_FEE_PERCENT,
  PLATFORM_FEE_ADDRESS,
  NETWORK,
} from "@/lib/cardano/constants";
import type { PaymentCurrency } from "@/lib/cardano/constants";
import { useCreateProposal } from "@/hooks/useCreateProposal";
import { useWallet } from "@meshsdk/react";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { PhotoUploader } from "@/components/submit/PhotoUploader";
import { VideoUploader } from "@/components/submit/VideoUploader";
import { MediaReviewPanel } from "@/components/submit/MediaReviewPanel";

const steps = [
  { label: "Personal Info", icon: User },
  { label: "Trip Details", icon: MapPin },
  { label: "Media", icon: ImageIcon },
  { label: "Review", icon: Send },
];

const cardanoscanBase =
  NETWORK === "mainnet"
    ? "https://cardanoscan.io"
    : `https://${NETWORK}.cardanoscan.io`;

export default function SubmitPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [currency, setCurrency] = useState<PaymentCurrency>("ADA");
  const [amount, setAmount] = useState("");

  // Controlled form fields
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [description, setDescription] = useState("");

  const { address } = useWallet();

  // Temp proposal ID for media uploads (generated once per form session)
  const tempProposalId = useMemo(() => uuidv4(), []);

  // Media upload store
  const {
    setProposalId,
    setWalletAddr,
    hasUploadsInProgress,
    hasRejected,
    finalizeMedia,
    reset: resetMedia,
  } = useMediaUpload();

  // Reset media store on mount so stale uploads from previous sessions are cleared
  useEffect(() => {
    resetMedia();
    setProposalId(tempProposalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempProposalId]);

  useEffect(() => {
    if (address) setWalletAddr(address);
  }, [address, setWalletAddr]);

  // On-chain proposal submission
  const { status, txHash, error, submitProposal, reset } =
    useCreateProposal();

  const parsedAmount = parseFloat(amount) || 0;
  const feeAmount = parsedAmount * (PLATFORM_FEE_PERCENT / 100);
  const totalAmount = parsedAmount + feeAmount;

  const isSubmitting =
    status === "building" || status === "signing" || status === "submitting";

  async function handleSubmit() {
    await submitProposal({
      destination,
      departureDate,
      returnDate,
      description,
      amount: parsedAmount,
      currency,
    });
  }

  // Finalize media when on-chain tx succeeds
  useEffect(() => {
    if (status === "success" && txHash) {
      finalizeMedia(txHash).catch(console.error);
    }
  }, [status, txHash, finalizeMedia]);

  const mediaUploading = hasUploadsInProgress();
  const mediaRejected = hasRejected();

  return (
    <>
      {/* Header */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Submit a Travel Request"
            subtitle="Tell us about your dream trip and let the community vote to fund your adventure."
          />
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <NFTGate>

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      i <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground hidden sm:block">
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-8 sm:w-16 ${
                      i < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Steps */}
          <div className="mt-10">
            {currentStep === 0 && (
              <div className="space-y-5">
                <h3 className="text-xl font-semibold text-foreground">
                  Personal Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Country of Residence
                  </label>
                  <select className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Select your country</option>
                    <option value="jamaica">Jamaica</option>
                    <option value="usa">United States</option>
                    <option value="guyana">Guyana</option>
                    <option value="mexico">Mexico</option>
                    <option value="uk">United Kingdom</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <h3 className="text-xl font-semibold text-foreground">
                  Trip Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Desired Destination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bali, Indonesia"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Estimated Cost
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="number"
                      placeholder={currency === "ADA" ? "3000" : "500"}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as PaymentCurrency)}
                      className="w-28 rounded-xl border border-input bg-background px-3 py-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.symbol} value={c.symbol}>
                          {c.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {SUPPORTED_CURRENCIES.find((c) => c.symbol === currency)?.name}
                    {" · "}A {PLATFORM_FEE_PERCENT}% platform fee will be added
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Why should the community fund this trip?
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your trip and what you'll bring back to the community..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold text-foreground">
                  Photos & Video
                </h3>
                <PhotoUploader />
                <VideoUploader />
                {mediaRejected && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">
                      Some media was flagged by moderation. Please remove rejected items and re-upload before continuing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <h3 className="text-xl font-semibold text-foreground">
                  Review & Submit
                </h3>
                <p className="text-sm text-muted-foreground">
                  Review your travel request before submitting it to the community for
                  voting. Once submitted, your proposal will be created on-chain.
                </p>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-medium text-foreground">
                      {destination || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dates</span>
                    <span className="font-medium text-foreground">
                      {departureDate && returnDate
                        ? `${departureDate} — ${returnDate}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trip Cost</span>
                    <span className="font-medium text-foreground">
                      {parsedAmount > 0 ? `${parsedAmount} ${currency}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Platform Fee ({PLATFORM_FEE_PERCENT}%)
                    </span>
                    <span className="font-medium text-foreground">
                      {parsedAmount > 0
                        ? `${feeAmount.toFixed(2)} ${currency}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border/60 pt-3">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-semibold text-foreground">
                      {parsedAmount > 0
                        ? `${totalAmount.toFixed(2)} ${currency}`
                        : "—"}
                    </span>
                  </div>
                  <MediaReviewPanel />
                </div>

                {!PLATFORM_FEE_ADDRESS && NETWORK === "mainnet" && (
                  <p className="text-xs text-amber-600">
                    Platform fee address not configured. Contact the site owner.
                  </p>
                )}

                {/* Transaction status */}
                {status === "success" && txHash && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      {NETWORK === "mainnet"
                        ? "Proposal submitted on-chain!"
                        : "Proposal saved (off-chain — preprod mode)"}
                    </div>
                    {NETWORK === "mainnet" ? (
                      <a
                        href={`${cardanoscanBase}/transaction/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                      >
                        View on CardanoScan
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-green-600">
                        Proposal ID: {txHash}
                      </p>
                    )}
                  </div>
                )}

                {status === "error" && error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                      onClick={reset}
                      className="mt-2 text-xs text-red-600 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    status === "success" ||
                    parsedAmount <= 0 ||
                    (NETWORK === "mainnet" && !PLATFORM_FEE_ADDRESS)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {status === "building" && "Building transaction..."}
                      {status === "signing" && "Waiting for wallet signature..."}
                      {status === "submitting" && "Submitting to blockchain..."}
                    </>
                  ) : status === "success" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Proposal Submitted
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Travel Request
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0 || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {currentStep < 3 && (
              <Button
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                disabled={currentStep === 2 && (mediaUploading || mediaRejected)}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          </NFTGate>
        </div>
      </section>
    </>
  );
}
