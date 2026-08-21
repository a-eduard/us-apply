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
    const { campaign_id, partner_slug, application_data } = body;
    
    // REMOVED: Strict check for campaign_id or partner_slug. 
    // Now allows general onboarding submissions.

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

    let campaign = null;
    if (campaign_id) {
      campaign = await prisma.campaigns.findUnique({
        where: { id: campaign_id },
        include: { users: true }
      });
    }

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

    // 1. SAVE OR UPDATE APPLICATION
    const existingApp = await prisma.applications.findFirst({
      where: { user_id: authUserId, campaign_id: campaign_id || null }
    });

    let savedApplication;
    if (existingApp) {
      savedApplication = await prisma.applications.update({
        where: { id: existingApp.id },
        data: {
          ...appDataToSave,
          draft_data: null 
        }
      });
    } else {
      savedApplication = await prisma.applications.create({
        data: {
          user_id: authUserId,
          campaign_id: campaign_id || null,
          ...appDataToSave
        }
      });
    }

    // 2. UPDATE GLOBAL CANDIDATE PROFILE
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
        referred_by_partner_id: partner_slug || undefined, // Save partner tracking
      }
    });

    // 3. SEND NOTIFICATIONS (Only if associated with a specific campaign)
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

    // Return the application ID so the Wizard can use it to generate the DocuSeal link
    return NextResponse.json({ success: true, id: savedApplication.id });
  } catch (error: any) {
    console.error("Application Submission Error EXACT:", error.message || error);
    return NextResponse.json({ error: "Failed to submit application", details: error.message }, { status: 500 });
  }
}