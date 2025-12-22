import JoinForm from "@/components/JoinForm";
import { vendorQuestions } from "@/config/questions.vendor";

export default function VendorJoinPage() {
  return (
    <JoinForm
      role="vendor"
      title="Join the Vendor waitlist"
      subtitle="We review vendor onboarding using your questionnaire responses."
      questions={vendorQuestions}
    />
  );
}
