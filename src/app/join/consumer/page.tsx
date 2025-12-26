import { Suspense } from "react";
import JoinForm from "@/components/JoinForm";
import { consumerQuestions } from "@/config/questions.consumer";

export const metadata = {
  title: "Consumer Waitlist | PeerPlates",
};

export default async function ConsumerJoinPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const sp = (await searchParams) || {};
  const ref = String(sp.ref || "").trim();

  // ✅ Key trick: use a key so if ref changes, JoinForm remounts cleanly
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <JoinForm
        key={`consumer-${ref}`}
        role="consumer"
        title="Join the Consumer waitlist"
        subtitle="Move up the queue by referring friends. Get early access first."
        questions={consumerQuestions}
      />
    </Suspense>
  );
}
