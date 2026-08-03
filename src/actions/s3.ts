"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

export async function generatePresignedUrl(fileName: string, fileType: string) {
  try {
    // Generate a unique file name to prevent overwriting
    const extension = fileName.split(".").pop();
    const uniqueFileName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
    const fileKey = `uploads/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET as string,
      Key: fileKey,
      ContentType: fileType,
    });

    // URL expires in 1 hour (3600 seconds)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      success: true,
      url: presignedUrl,
      fileKey: fileKey,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return { 
      success: false, 
      error: "Failed to generate presigned URL" 
    };
  }
}