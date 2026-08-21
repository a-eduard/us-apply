import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const DOCUSEAL_API_URL = "https://sign.getbiz.me/api/submissions";
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_TEMPLATE_ID = process.env.DOCUSEAL_TEMPLATE_ID;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const body = await req.json();
    let { applicationId, email, firstName, lastName } = body;

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
    
    // SAFE PARSING: Handle both array and object responses from DocuSeal
    const submission = Array.isArray(data) ? data[0] : data;
    
    if (!submission || !submission.submitters || submission.submitters.length === 0) {
      console.error("Unexpected DocuSeal response format:", data);
      return NextResponse.json({ error: "Invalid response format from DocuSeal" }, { status: 500 });
    }

    const submitter = submission.submitters[0];

    await prisma.applications.update({
      where: { id: applicationId },
      data: {
        docusealSubmissionId: submission.id.toString(),
        contractStatus: "SENT",
      },
    });

    return NextResponse.json({
      docuseal_url: submitter.embed_url,
      submission_id: submission.id,
    });
  } catch (error) {
    console.error("Error generating DocuSeal URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}