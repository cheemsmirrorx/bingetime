import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getAdminOverviewStats,
  getAllUsersForAdmin,
  getCatalogContent,
  getCategories,
  getCommunityRequests,
} from "@/lib/db/repository";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { AdminLoginGate } from "@/components/admin/AdminLoginGate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | RONIN X STREAM",
  description: "Protected content, category, user, and media management console.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <AdminLoginGate />;
  }

  if (user.role !== "admin") {
    return <AdminLoginGate unauthorized />;
  }

  const [stats, catalogData, categories, users, requests] = await Promise.all([
    getAdminOverviewStats(),
    getCatalogContent({ limit: 100 }),
    getCategories(),
    getAllUsersForAdmin(),
    getCommunityRequests(user.id),
  ]);

  return (
    <AdminDashboardClient
      currentAdminId={user.id}
      initialStats={stats}
      initialContent={catalogData.items}
      initialCategories={categories}
      initialUsers={users}
      initialRequests={requests}
    />
  );
}

