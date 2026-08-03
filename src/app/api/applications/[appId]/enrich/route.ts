import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { appId: string } }
) {
  try {
    // Basic auth check for transition period
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let authUserId: number;

    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      authUserId = payload.userId || payload.id;
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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

    if (application.user_id !== authUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { linkedinUrl, resumeUrl, videoPitchUrl, yearsOfExperience, niches } = body;

    // Construct update data dynamically based on what's provided
    const updateData: any = {};
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (resumeUrl !== undefined) updateData.resumeUrl = resumeUrl;
    if (videoPitchUrl !== undefined) updateData.videoPitchUrl = videoPitchUrl;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;
    if (niches !== undefined) updateData.niches = niches;

    // Update the application
    await prisma.applications.update({
      where: { id: applicationId },
      data: updateData,
    });

    // Sync the same data to the user's main profile
    await prisma.users.update({
      where: { id: authUserId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Enrich Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}