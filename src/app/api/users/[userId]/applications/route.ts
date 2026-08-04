import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const authUserId = parseInt((session.user as any).id, 10);
    const targetUserId = parseInt(resolvedParams.userId, 10);

    if (isNaN(targetUserId) || authUserId !== targetUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Запрашиваем заявки (используем правильное имя связи: campaigns)
    const applications = await prisma.applications.findMany({
      where: { 
        user_id: targetUserId 
      },
      include: {
        campaigns: true, // ИСПРАВЛЕНО: Prisma требует именно такое название
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Адаптируем ответ для фронтенда (перекладываем campaigns в campaign)
    const formattedApplications = applications.map((app) => ({
      ...app,
      campaign: (app as any).campaigns 
    }));

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error("GET Applications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}