import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/http";
import { profileUpdateSchema } from "@/lib/api/validation";
import { updateUserProfile } from "@/lib/db/repository";

export async function GET() {
  return withAuth(async (user) => {
    return NextResponse.json({ profile: user });
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(async (user) => {
    const body = await req.json();
    const parsed = profileUpdateSchema.parse(body);
    const updated = await updateUserProfile(user.id, parsed, false);
    return NextResponse.json({ profile: updated });
  });
}

