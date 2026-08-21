import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Fixed import here

const DOCUSEAL_API_URL = "https://api.docuseal.co/submissions";
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_TEMPLATE_ID = process.env.DOCUSEAL_TEMPLATE_ID;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, email, firstName, lastName } = body;

    if (!applicationId || !email) {
      return NextResponse.json(
        { error: "Application ID and Email are required" },
        { status: 400 }
      );
    }

    if (!DOCUSEAL_API_KEY || !DOCUSEAL_TEMPLATE_ID) {
      console.error("DocuSeal API credentials are not set in .env");
      return NextResponse.json(
        { error: "Internal server configuration error" },
        { status: 500 }
      );
    }

    // Call DocuSeal API to create a submission
    const docusealResponse = await fetch(DOCUSEAL_API_URL, {
      method: "POST",
      headers: {
        "X-Auth-Token": DOCUSEAL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: Number(DOCUSEAL_TEMPLATE_ID),
        send_email: false, // We will show it inline in the Wizard
        submitters: [
          {
            role: "Candidate", // Update this if your template uses a different role name
            email: email,
            name: `${firstName || ""} ${lastName || ""}`.trim(),
          },
        ],
      }),
    });

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      console.error("DocuSeal API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to create DocuSeal submission" },
        { status: docusealResponse.status }
      );
    }

    const data = await docusealResponse.json();
    const submitter = data[0].submitters[0];

    // Save the submission ID to our database
    await prisma.applications.update({
      where: { id: applicationId },
      data: {
        docusealSubmissionId: data[0].id.toString(),
        contractStatus: "SENT",
      },
    });

    return NextResponse.json({
      docuseal_url: submitter.embed_url,
      submission_id: data[0].id,
    });
  } catch (error) {
    console.error("Error generating DocuSeal URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}