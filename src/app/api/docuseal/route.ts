import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DOCUSEAL_API_URL = "https://sign.getbiz.me/api/submissions";
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_TEMPLATE_ID = process.env.DOCUSEAL_TEMPLATE_ID;
const DOCUSEAL_BASE_URL = "https://sign.getbiz.me";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { applicationId, email, firstName, lastName } = body;

    const candidateEmail = email;
    const candidateName = `${firstName || ""} ${lastName || ""}`.trim() || "Candidate";

    if (!candidateEmail) {
      return NextResponse.json({ error: "Email is required to generate agreement" }, { status: 400 });
    }

    if (!DOCUSEAL_API_KEY || !DOCUSEAL_TEMPLATE_ID) {
      console.error("DocuSeal API credentials are not set in .env");
      return NextResponse.json({ error: "Internal server configuration error" }, { status: 500 });
    }

    const docusealResponse = await fetch(DOCUSEAL_API_URL, {
      method: "POST",
      headers: {
        "X-Auth-Token": DOCUSEAL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: Number(DOCUSEAL_TEMPLATE_ID),
        send_email: false, 
        submitters: [
          {
            role: "Candidate", 
            email: candidateEmail,
            name: candidateName,
          },
        ],
      }),
    });

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      console.error("DocuSeal API Error:", errorData);
      return NextResponse.json({ error: "Failed to create DocuSeal submission" }, { status: docusealResponse.status });
    }

    const data = await docusealResponse.json();
    
    // SAFE PARSING: Extract the main object whether it's wrapped in an array or not
    const submission = Array.isArray(data) ? data[0] : data;
    
    // SMART URL RESOLVER
    let embedUrl = "";
    
    if (submission?.submitters && submission.submitters.length > 0) {
      embedUrl = submission.submitters[0].embed_url || submission.submitters[0].url;
    } else if (submission?.embed_url || submission?.url) {
      embedUrl = submission.embed_url || submission.url;
    } else if (submission?.slug) {
      embedUrl = `${DOCUSEAL_BASE_URL}/s/${submission.slug}`;
    }

    if (!embedUrl) {
      console.error("FULL DOCUSEAL RESPONSE:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Could not find embed_url in DocuSeal response" }, { status: 500 });
    }

    const submissionId = submission?.id ? submission.id.toString() : "unknown";

    // ONLY update DB if we actually have a valid applicationId passed to us
    if (applicationId && typeof applicationId === 'number') {
      try {
        await prisma.applications.update({
          where: { id: applicationId },
          data: {
            docusealSubmissionId: submissionId,
            contractStatus: "SENT",
          },
        });
      } catch (dbError) {
        console.warn("Could not attach Docuseal ID to existing application:", dbError);
      }
    }

    return NextResponse.json({
      docuseal_url: embedUrl,
      submission_id: submissionId,
    });
  } catch (error) {
    console.error("Error generating DocuSeal URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}