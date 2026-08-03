import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendInterviewInvite } from "@/mail"; 

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

    // 1. Проверяем существование заявки и права работодателя
    const application = await prisma.applications.findUnique({
      where: { id: applicationId },
      include: {
        campaigns: true, // <-- Исправлено на множественное число
        users: true 
      },
    });

    if (!application || !application.campaigns) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.campaigns.user_id !== authUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { approved, calendlyUrl } = body;

    if (approved && !calendlyUrl) {
      return NextResponse.json({ error: "Calendly URL is required to approve" }, { status: 400 });
    }

    const newStatus = approved ? "Interview" : "Rejected";

    // 2. Обновляем статус заявки и сохраняем ссылку на интервью
    const updatedApplication = await prisma.applications.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        interviewUrl: calendlyUrl || undefined, 
      },
    });

    // 3. Отправляем email-уведомление кандидату, если он одобрен
    if (approved && application.users?.email) {
      const candidateEmail = application.users.email;
      const candidateName = application.users.first_name || "Candidate";
      const campaignTitle = application.campaigns.title || "Job Position"; // <-- Исправлено на множественное число

      // Отправляем в фоновом режиме, не блокируя ответ клиенту
      sendInterviewInvite(candidateEmail, candidateName, campaignTitle, calendlyUrl).catch(err =>
        console.error("Failed to send interview invite:", err)
      );
    }

    return NextResponse.json({ success: true, application: updatedApplication });
  } catch (error) {
    console.error("POST Screening Verify Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}