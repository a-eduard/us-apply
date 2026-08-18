import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_ENDPOINT || !process.env.AWS_S3_BUCKET) {
  throw new Error("AWS S3 environment variables are missing.");
}

// Ensure the endpoint has the correct structure for custom S3 (like MinIO)
const endpoint = process.env.AWS_S3_ENDPOINT;

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: endpoint,
  forcePathStyle: true, // This is crucial for custom endpoints (replaces the need for bucket subdomains)
});

/**
 * Helper function to physically delete a file from the S3 bucket using its public URL
 */
export async function deleteS3FileByUrl(fileUrl: string | null | undefined) {
  try {
    if (!fileUrl) return;

    const bucket = process.env.AWS_S3_BUCKET as string;
    
    // We need to extract the exact file key from the URL.
    // Example URL: https://s3.getbiz.me/usclosers/uploads/avatars/123.jpg
    // Extracted Key: uploads/avatars/123.jpg
    const urlParts = fileUrl.split(`${bucket}/`);
    
    if (urlParts.length < 2) {
      console.warn(`Could not extract S3 key from URL: ${fileUrl}`);
      return;
    }

    const fileKey = urlParts[1];

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
  }
}