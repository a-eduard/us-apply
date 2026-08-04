import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    
    // Await params for Next.js 15 compatibility
    const resolvedParams = await params;
    const applicationId = parseInt(resolvedParams.appId, 10);
    
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

    if (application.user_id !== authUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent withdrawing if already hired, rejected, or withdrawn
    if (["Hired", "Rejected", "Withdrawn"].includes(application.status || "")) {
      return NextResponse.json(
        { error: "Cannot withdraw an application in its current state." },
        { status: 409 }
      );
    }

    // Update status to Withdrawn
    await prisma.applications.update({
      where: { id: applicationId },
      data: { status: "Withdrawn" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Withdraw Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}