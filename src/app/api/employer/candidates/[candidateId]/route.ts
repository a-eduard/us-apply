export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteS3FileByUrl } from "@/lib/s3";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Проверяем авторизацию
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const candidateId = parseInt(resolvedParams.candidateId, 10);

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 });
    }

    // 1. Находим кандидата в базе, чтобы получить ссылки на его файлы
    const user = await prisma.users.findUnique({
      where: { id: candidateId },
      select: {
        avatar_url: true,
        resume_url: true,
        video_pitch_url: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // 2. Очищаем физические файлы из AWS S3 (MinIO)
    const deletePromises = [];
    if (user.avatar_url) deletePromises.push(deleteS3FileByUrl(user.avatar_url));
    if (user.resume_url) deletePromises.push(deleteS3FileByUrl(user.resume_url));
    if (user.video_pitch_url) deletePromises.push(deleteS3FileByUrl(user.video_pitch_url));
    
    await Promise.allSettled(deletePromises);

    // 3. Находим все заявки кандидата для каскадного удаления связанных таблиц
    const apps = await prisma.applications.findMany({ 
      where: { user_id: candidateId }, 
      select: { id: true } 
    });
    
    const appIds = apps.map(a => a.id);

    // 4. Удаляем все связанные данные (если у него были отклики на вакансии)
    if (appIds.length > 0) {
      await prisma.candidate_answers.deleteMany({ where: { application_id: { in: appIds } } });
      await prisma.application_stages_history.deleteMany({ where: { application_id: { in: appIds } } });
      await prisma.screening_requests.deleteMany({ where: { application_id: { in: appIds } } });
      await prisma.applications.deleteMany({ where: { user_id: candidateId } });
    }

    // 5. Удаляем самого кандидата
    await prisma.users.delete({ 
      where: { id: candidateId } 
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Candidate Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}