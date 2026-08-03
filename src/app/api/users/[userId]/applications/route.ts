import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const targetUserId = parseInt(params.userId, 10);

    if (isNaN(targetUserId) || authUserId !== targetUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const applications = await prisma.applications.findMany({
      where: { user_id: targetUserId },
      orderBy: { created_at: "desc" },
    });

    const campaignIds = [...new Set(
      applications
        .map((app) => app.campaign_id)
        .filter((id): id is number => id !== null)
    )];

    const relatedCampaigns = await prisma.campaigns.findMany({
      where: { id: { in: campaignIds } },
    });

    const campaignsMap = relatedCampaigns.reduce((acc, campaign) => {
      acc[campaign.id] = campaign;
      return acc;
    }, {} as Record<number, any>);

    // Маппинг данных из snake_case (БД) в camelCase (Фронтенд)
    const enrichedApplications = applications.map((app) => ({
      id: app.id,
      campaignId: app.campaign_id,
      status: app.status,
      createdAt: app.created_at,
      city: app.city,
      state: app.state,
      linkedinUrl: app.linkedin_url,
      videoPitchUrl: app.video_pitch_url,
      resumeUrl: app.resume_url,
      yearsOfExperience: app.years_of_experience,
      niches: app.niche,
      campaign: app.campaign_id ? campaignsMap[app.campaign_id] || null : null,
    }));
    
    return NextResponse.json(enrichedApplications);
  } catch (error) {
    console.error("GET Applications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}