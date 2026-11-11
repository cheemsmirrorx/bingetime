import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/http";
import { getAdminOverviewStats } from "@/lib/db/repository";

export async function GET() {
  return withAdmin(async () => {
    const stats = await getAdminOverviewStats();
    return NextResponse.json({ stats });
  });
}

