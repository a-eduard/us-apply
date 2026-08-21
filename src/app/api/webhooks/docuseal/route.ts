import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // 1. Read the raw body as text for accurate signature verification
    const rawBody = await req.text();
    
    // 2. Get the signature from headers and the secret from environment variables
    const signatureHeader = req.headers.get("X-Docuseal-Signature");
    const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;

    // 3. Verify the signature if the secret is configured
    if (secret && signatureHeader) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signatureHeader) {
        console.error("Invalid DocuSeal Webhook Signature.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (!secret) {
      console.warn("DOCUSEAL_WEBHOOK_SECRET is not set. Skipping signature verification.");
    }

    // 4. Parse the body now that it is verified
    const payload = JSON.parse(rawBody);
    console.log("DocuSeal Webhook Payload:", JSON.stringify(payload, null, 2));

    const { event, data } = payload;

    // DocuSeal triggers 'submission.completed' when all signers have finished
    if (event === "submission.completed" && data && data.id) {
      const submissionId = data.id.toString();

      // Find and update the application with the matching submission ID
      const updatedApplications = await prisma.applications.updateMany({
        where: { 
          docusealSubmissionId: submissionId 
        },
        data: {
          contractStatus: "SIGNED",
          contractSignedAt: new Date(),
        },
      });

      if (updatedApplications.count > 0) {
        console.log(`Successfully updated contract status for submission ID: ${submissionId}`);
      } else {
        console.warn(`No application found for submission ID: ${submissionId}`);
      }

      return NextResponse.json({ success: true, message: "Contract marked as signed." }, { status: 200 });
    }

    // Acknowledge other events without action
    return NextResponse.json({ success: true, message: "Event ignored." }, { status: 200 });

  } catch (error) {
    console.error("DocuSeal Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}