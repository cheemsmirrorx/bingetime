import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/http";
import { watchHistoryPostSchema } from "@/lib/api/validation";
import { getUserHistory, saveUserHistory } from "@/lib/db/repository";

export async function GET() {
  return withAuth(async (user) => {
    const items = await getUserHistory(user.id);
    return NextResponse.json({ items });
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    const body = await req.json();
    const parsed = watchHistoryPostSchema.parse(body);
    const entry = await saveUserHistory({
      userId: user.id,
      contentId: parsed.content_id,
      episodeId: parsed.episode_id ?? null,
      progress: parsed.progress,
      progressSeconds: parsed.progress_seconds,
      durationSeconds: parsed.duration_seconds,
    });
    return NextResponse.json({ item: entry });
  });
}

