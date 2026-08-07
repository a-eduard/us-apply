import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const isVideo = formData.get("isVideo") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to Buffer for AWS SDK
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop();
    const uniqueFileName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
    const folder = isVideo ? "videos" : "resumes";
    const fileKey = `uploads/${folder}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET as string,
      Key: fileKey,
      ContentType: file.type,
      ContentLength: buffer.length, // CRITICAL FIX: Explicitly stating the size prevents ECONNRESET
      Body: buffer,
    });

    await s3Client.send(command);

    // Build the secure public URL using the domain provided by DevOps
    const publicUrl = `https://s3.getbiz.me/${process.env.AWS_S3_BUCKET}/${fileKey}`;

    return NextResponse.json({ success: true, publicUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}