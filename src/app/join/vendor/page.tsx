import { Suspense } from "react";
import JoinForm from "@/components/JoinForm";
import { vendorQuestions } from "@/config/questions.vendor";

export const metadata = {
  title: "Vendor Waitlist | PeerPlates",
};

export default async function VendorJoinPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const sp = (await searchParams) || {};
  const ref = String(sp.ref || "").trim();

  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <JoinForm
        key={`vendor-${ref}`}
        role="vendor"
        title="Join the Vendor waitlist"
        subtitle="Vendors are reviewed via questionnaire and compliance readiness."
        questions={vendorQuestions}
      />
    </Suspense>
  );
}
