import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendApplicationConfirmation, sendEmployerNotification } from "@/mail"; 

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const candidateEmail = session.user.email || "";
    
    const body = await req.json();
    
    // СТРОГО ПРЕВРАЩАЕМ В ЧИСЛО, ИНАЧЕ PRISMA УПАДЕТ
    const campaignIdInt = parseInt(body.campaign_id, 10);
    
    if (isNaN(campaignIdInt)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: authUserId }
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const candidateFullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || session.user.name || "Candidate";

    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignIdInt },
      include: { users: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const appDataToSave = {
      status: "Applied",
      city: user.city || undefined,
      state: user.state || undefined,
      linkedin_url: user.linkedin_url || undefined,
      video_pitch_url: user.video_pitch_url || undefined,
      resume_url: user.resume_url || undefined,
      years_of_experience: user.years_of_experience || undefined,
      niche: user.niche || undefined, 
      niches: user.niches || undefined, 
    };

    const existingApp = await prisma.applications.findFirst({
      where: { user_id: authUserId, campaign_id: campaignIdInt }
    });

    if (existingApp) {
      await prisma.applications.update({
        where: { id: existingApp.id },
        data: {
          ...appDataToSave,
          draft_data: null 
        }
      });
    } else {
      await prisma.applications.create({
        data: {
          user_id: authUserId,
          campaign_id: campaignIdInt,
          ...appDataToSave
        }
      });
    }

    const campaignTitle = campaign.title || "Job Position";
    if (candidateEmail) {
      sendApplicationConfirmation(candidateEmail, candidateFullName, campaignTitle).catch(err => 
        console.error("Failed to send candidate confirmation:", err)
      );
    }

    const employerEmail = campaign.users?.email;
    const employerName = campaign.users?.first_name || "Employer";
    if (employerEmail) {
      sendEmployerNotification(employerEmail, employerName, campaignTitle, candidateFullName).catch(err => 
        console.error("Failed to send employer notification:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Quick Apply Submission Error:", error);
    return NextResponse.json({ error: "Failed to submit application", details: error.message }, { status: 500 });
  }
}