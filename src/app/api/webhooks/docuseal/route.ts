import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Log the payload for debugging purposes (you can remove this later)
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

    // Acknowledge other events (like 'submission.created' or 'submission.declined') without action for now
    return NextResponse.json({ success: true, message: "Event ignored." }, { status: 200 });

  } catch (error) {
    console.error("DocuSeal Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}