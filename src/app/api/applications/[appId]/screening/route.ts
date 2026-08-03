import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { appId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const applicationId = parseInt(params.appId, 10);
    
    if (isNaN(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    // Verify ownership and existence
    const application = await prisma.applications.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Candidate ownership check
    if (application.user_id !== authUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { screeningData } = body;

    if (!screeningData) {
      return NextResponse.json({ error: "Screening data is required" }, { status: 400 });
    }

    // Update the application with screening data
    await prisma.applications.update({
      where: { id: applicationId },
      data: { 
        screening_data: screeningData,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Screening Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}