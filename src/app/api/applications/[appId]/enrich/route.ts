import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);

    const resolvedParams = await params;
    const applicationId = parseInt(resolvedParams.appId, 10);
    
    if (isNaN(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

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

    const serializedNiches = niches && Array.isArray(niches) ? JSON.stringify(niches) : niches;

    // Обновляем ТОЛЬКО таблицу applications. 
    // Это полностью исключает конфликт блокировок таблицы users (Lock wait timeout).
    const updateDataApp: any = {};
    if (linkedinUrl !== undefined) updateDataApp.linkedin_url = linkedinUrl;
    if (resumeUrl !== undefined) updateDataApp.resume_url = resumeUrl;
    if (videoPitchUrl !== undefined) updateDataApp.video_pitch_url = videoPitchUrl;
    if (yearsOfExperience !== undefined) updateDataApp.years_of_experience = yearsOfExperience;
    if (niches !== undefined) updateDataApp.niche = serializedNiches; 

    await prisma.applications.update({
      where: { id: applicationId },
      data: updateDataApp,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Enrich Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}