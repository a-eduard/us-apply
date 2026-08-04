import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendApplicationConfirmation, sendEmployerNotification } from "@/mail"; 

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const candidateEmail = session.user.email || "";
    
    const body = await req.json();
    const { campaign_id, application_data } = body;
    
    if (!campaign_id) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const { 
      firstName, 
      lastName, 
      city, 
      state, 
      linkedinUrl, 
      videoPitchUrl, 
      resumeUrl, 
      yearsOfExperience, 
      niches 
    } = application_data || {};

    const candidateFullName = `${firstName || ""} ${lastName || ""}`.trim() || session.user.name || "Candidate";

    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaign_id },
      include: { users: true }
    });

    const serializedNiches = Array.isArray(niches) ? JSON.stringify(niches) : niches;

    const appDataToSave = {
      status: "Applied",
      city: city || undefined,
      state: state || undefined,
      linkedin_url: linkedinUrl || undefined,
      video_pitch_url: videoPitchUrl || undefined,
      resume_url: resumeUrl || undefined,
      years_of_experience: yearsOfExperience || undefined,
      niche: serializedNiches || undefined,
    };

    // 1. СОХРАНЯЕМ ИЛИ ОБНОВЛЯЕМ ЗАЯВКУ
    const existingApp = await prisma.applications.findFirst({
      where: { user_id: authUserId, campaign_id: campaign_id }
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
          campaign_id: campaign_id,
          ...appDataToSave
        }
      });
    }

    // 2. ОБНОВЛЯЕМ ГЛОБАЛЬНЫЙ ПРОФИЛЬ КАНДИДАТА
    await prisma.users.update({
      where: { id: authUserId },
      data: {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        city: city || undefined,
        state: state || undefined,
        linkedin_url: linkedinUrl || undefined,
        video_pitch_url: videoPitchUrl || undefined,
        resume_url: resumeUrl || undefined,
        years_of_experience: yearsOfExperience || undefined,
        niches: serializedNiches || undefined,
      }
    });

    // 3. ОТПРАВЛЯЕМ УВЕДОМЛЕНИЯ
    if (campaign) {
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
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Application Submission Error EXACT:", error.message || error);
    return NextResponse.json({ error: "Failed to submit application", details: error.message }, { status: 500 });
  }
}