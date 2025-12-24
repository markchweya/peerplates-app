import { Suspense } from "react";
import JoinForm from "@/components/JoinForm";
import { consumerQuestions } from "@/config/questions.consumer";

export const metadata = {
  title: "Consumer Waitlist | PeerPlates",
};

export default function ConsumerJoinPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <JoinForm
        role="consumer"
        title="Join the Consumer waitlist"
        subtitle="Move up the queue by referring friends. Get early access first."
        questions={consumerQuestions}
      />
    </Suspense>
  );
}
