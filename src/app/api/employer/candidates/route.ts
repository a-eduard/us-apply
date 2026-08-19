export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Проверяем, что запрашивает авторизованный пользователь
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Достаем из базы всех пользователей с ролью Candidate
    // Сортируем по дате создания (новые сверху)
    const candidates = await prisma.users.findMany({
      where: {
        role: "Candidate",
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        years_of_experience: true,
        niches: true,
        linkedin_url: true,
        resume_url: true,
        video_pitch_url: true,
        avatar_url: true,
        created_at: true,
      }
    });

    return NextResponse.json(candidates);
  } catch (error: any) {
    console.error("GET Candidates Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}