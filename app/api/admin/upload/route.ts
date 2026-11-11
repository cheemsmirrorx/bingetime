import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, withAdmin } from "@/lib/api/http";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "text/vtt",
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  return withAdmin(async () => {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "artwork").replace(/[^a-z0-9_-]/gi, "");

    if (!(file instanceof File)) {
      return apiError("A file field is required", 400);
    }
    if (file.size > MAX_BYTES) {
      return apiError("File size exceeds 25 MB limit", 400);
    }
    if (!ALLOWED_TYPES.has(file.type) && !file.name.endsWith(".vtt")) {
      return apiError(`Unsupported file type: ${file.type || "unknown"}`, 400);
    }

    const ext = path.extname(file.name) || ".bin";
    const safeName = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isSupabaseAdminConfigured()) {
      const admin = createAdminSupabaseClient();
      if (!admin) return apiError("Supabase admin client unavailable", 500);
      const { error } = await admin.storage.from("ronin-media").upload(safeName, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) {
        return apiError(`Upload failed: ${error.message}`, 500);
      }
      const { data: pub } = admin.storage.from("ronin-media").getPublicUrl(safeName);
      return NextResponse.json({ url: pub.publicUrl, storage: "supabase" }, { status: 201 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = path.basename(safeName);
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    return NextResponse.json(
      { url: `/uploads/${folder}/${fileName}`, storage: "local" },
      { status: 201 }
    );
  });
}

