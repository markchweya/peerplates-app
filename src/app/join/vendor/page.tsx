import { Suspense } from "react";
import JoinForm from "@/components/JoinForm";
import { vendorQuestions } from "@/config/questions.vendor";

export const metadata = {
  title: "Vendor Waitlist | PeerPlates",
};

export default function VendorJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <JoinForm
        role="vendor"
        title="Join the Vendor waitlist"
        subtitle="We review vendor onboarding using your questionnaire responses."
        questions={vendorQuestions}
      />
    </Suspense>
  );
}
