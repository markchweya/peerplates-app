import JoinForm from "@/components/JoinForm";
import { consumerQuestions } from "@/config/questions.consumer";

export default function ConsumerJoinPage() {
  return (
    <JoinForm
      role="consumer"
      title="Join the Consumer waitlist"
      subtitle="Move up the queue by referring friends. Get early access first."
      questions={consumerQuestions}
    />
  );
}
