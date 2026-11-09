import { VotingBooth } from "@/components/voting/VotingBooth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Voting Booth | SAADA Students Union Election 2026",
  description: "Official student voting portal - Cast your 3 ballots for President, General Secretary, and Treasurer",
};

export default function VotePage() {
  return <VotingBooth />;
}

