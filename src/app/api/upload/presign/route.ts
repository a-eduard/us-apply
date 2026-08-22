import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, fileType, isVideo } = body;
    let { folder } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine target folder
    if (!folder) {
      folder = isVideo ? "videos" : "resumes";
    }

    // Prevent path traversal
    const allowedFolders = ["avatars", "resumes", "videos"];
    if (!allowedFolders.includes(folder)) {
      folder = "misc"; 
    }

    // Generate a unique file name to prevent overriding
    const extension = fileName.split(".").pop();
    const uniqueFileName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
    const fileKey = `uploads/${folder}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET as string,
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate a presigned URL that expires in 1 hour (3600 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Construct the public URL correctly for the custom MinIO server
    // Using the same logic we used in the standard upload route
    const publicUrl = `https://s3.getbiz.me/${process.env.AWS_S3_BUCKET}/${fileKey}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      isMock: false
    });
  } catch (error) {
    console.error("Presign URL Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}