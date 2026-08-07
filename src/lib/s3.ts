import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_ENDPOINT) {
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