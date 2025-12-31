// src/app/join/page.tsx
import type { Metadata } from "next";
import JoinClient from "./JoinClient";

export const metadata: Metadata = {
  title: "Join Waitlist | PeerPlates",
};

export default function JoinPage({
  searchParams,
}: {
  searchParams?: { ref?: string };
}) {
  const ref = typeof searchParams?.ref === "string" ? searchParams.ref : "";
  return <JoinClient referral={ref} />;
}
