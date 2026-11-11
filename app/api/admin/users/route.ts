import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, withAdmin } from "@/lib/api/http";
import { getAllUsersForAdmin, updateUserProfile } from "@/lib/db/repository";

const roleUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]),
});

export async function GET() {
  return withAdmin(async () => {
    const users = await getAllUsersForAdmin();
    return NextResponse.json({ users });
  });
}

export async function PATCH(req: NextRequest) {
  return withAdmin(async (admin) => {
    const body = await req.json();
    const { userId, role } = roleUpdateSchema.parse(body);
    if (userId === admin.id && role !== "admin") {
      return apiError("You cannot demote your own active admin account", 400);
    }
    const updated = await updateUserProfile(userId, { role }, true);
    if (!updated) return apiError("User not found", 404);
    return NextResponse.json({ user: updated });
  });
}

