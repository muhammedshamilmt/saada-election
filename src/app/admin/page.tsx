import { AdminLayout } from "@/components/admin/AdminLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel | SAADA Students Union Election 2026",
  description: "Official Admin Dashboard, Candidate Management & Voter Registry Portal",
};

export default function AdminPage() {
  return <AdminLayout />;
}

