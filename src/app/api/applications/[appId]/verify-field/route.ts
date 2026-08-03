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

    // Verify application existence and campaign ownership by employer
    const application = await prisma.applications.findUnique({
      where: { id: applicationId },
      include: { campaign: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.campaign && application.campaign.user_id !== authUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { field, is_verified, english_level } = body;

    if (!field) {
      return NextResponse.json({ error: "Field name is required" }, { status: 400 });
    }

    // Build update payload based on verified field
    const updateData: Record<string, any> = {};

    if (field === "experience") {
      updateData.isExperienceVerified = is_verified;
    } else if (field === "linkedin") {
      updateData.isLinkedinVerified = is_verified;
    } else if (field === "resume") {
      updateData.isResumeVerified = is_verified;
    } else if (field === "video_pitch") {
      updateData.isVideoVerified = is_verified;
      if (english_level !== undefined) {
        updateData.englishLevel = english_level;
      }
    }

    const updatedApplication = await prisma.applications.update({
      where: { id: applicationId },
      data: updateData,
    });

    return NextResponse.json({ success: true, application: updatedApplication });
  } catch (error) {
    console.error("POST Verify Field Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}