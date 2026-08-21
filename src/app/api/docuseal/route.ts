import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const DOCUSEAL_API_URL = "https://sign.getbiz.me/api/submissions";
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_TEMPLATE_ID = process.env.DOCUSEAL_TEMPLATE_ID;
const DOCUSEAL_BASE_URL = "https://sign.getbiz.me";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const body = await req.json();
    let { applicationId, email, firstName, lastName } = body;

    // SMART RECOVERY: Find the latest application for this user if ID is missing
    if (!applicationId) {
      const latestApp = await prisma.applications.findFirst({
        where: { user_id: authUserId },
        orderBy: { created_at: 'desc' }
      });
      
      if (!latestApp) {
        return NextResponse.json({ error: "Application not found in database" }, { status: 404 });
      }
      applicationId = latestApp.id;
    }

    const candidateEmail = email || session.user.email;
    const candidateName = `${firstName || ""} ${lastName || ""}`.trim() || session.user.name || "Candidate";

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
    
    // SMART URL RESOLVER: Try to find the URL in multiple possible locations
    let embedUrl = "";
    
    if (submission?.submitters && submission.submitters.length > 0) {
      embedUrl = submission.submitters[0].embed_url || submission.submitters[0].url;
    } else if (submission?.embed_url || submission?.url) {
      embedUrl = submission.embed_url || submission.url;
    } else if (submission?.slug) {
      // Fallback for self-hosted versions: construct the signing link manually
      embedUrl = `${DOCUSEAL_BASE_URL}/s/${submission.slug}`;
    }

    // If all checks fail, log the FULL response to Vercel so we can inspect it
    if (!embedUrl) {
      console.error("FULL DOCUSEAL RESPONSE:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Could not find embed_url in DocuSeal response" }, { status: 500 });
    }

    const submissionId = submission?.id ? submission.id.toString() : "unknown";

    // Save the submission ID to our database
    await prisma.applications.update({
      where: { id: applicationId },
      data: {
        docusealSubmissionId: submissionId,
        contractStatus: "SENT",
      },
    });

    return NextResponse.json({
      docuseal_url: embedUrl,
      submission_id: submissionId,
    });
  } catch (error) {
    console.error("Error generating DocuSeal URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}