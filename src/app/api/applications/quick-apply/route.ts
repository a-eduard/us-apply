import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const body = await req.json();
    const { campaignId, screeningAnswers } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    // Fetch user data to populate the new application
    const user = await prisma.users.findUnique({
      where: { id: authUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Checking for video pitch presence (handling both camelCase and snake_case just in case)
    const userVideoUrl = (user as any).videoPitchUrl || (user as any).video_pitch_url;

    if (!userVideoUrl) {
      return NextResponse.json(
        { error: "Video pitch is required to apply. Please complete your profile first." },
        { status: 400 }
      );
    }

    // Check if application already exists for this campaign
    const existingApp = await prisma.applications.findFirst({
      where: { user_id: authUserId, campaign_id: campaignId },
    });

    if (existingApp) {
      return NextResponse.json(
        { error: "You have already applied to this campaign." },
        { status: 409 }
      );
    }

    // Create the quick application using the data already stored in the user's profile
    await prisma.applications.create({
      data: {
        user_id: authUserId,
        campaign_id: campaignId,
        status: "Applied",
        city: user.city,
        state: user.state,
        linkedin_url: (user as any).linkedinUrl || (user as any).linkedin_url || null,
        video_pitch_url: userVideoUrl,
        resume_url: (user as any).resumeUrl || (user as any).resume_url || null,
        years_of_experience: (user as any).yearsOfExperience || (user as any).years_of_experience || null,
        niches: user.niches || null,
        screening_data: screeningAnswers && Object.keys(screeningAnswers).length > 0 ? screeningAnswers : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Quick Apply Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}