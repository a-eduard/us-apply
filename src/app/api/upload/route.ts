import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const isVideo = formData.get("isVideo") === "true";
    let folder = formData.get("folder") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Determine target folder securely based on explicit parameter or fallback
    if (!folder) {
      folder = isVideo ? "videos" : "resumes";
    }
    
    // Prevent path traversal by strictly allowing only specific folders
    const allowedFolders = ["avatars", "resumes", "videos", "logos"];
    if (!allowedFolders.includes(folder)) {
      folder = "misc"; 
    }

    // Convert file to Buffer for AWS SDK
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop();
    const uniqueFileName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
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