import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
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

    const formData = await req.formData();
    
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const linkedinUrl = formData.get("linkedinUrl") as string;
    const shareDataWithPartnerStr = formData.get("shareDataWithPartner");
    const shareDataWithPartner = shareDataWithPartnerStr === "true";

    const updatedUser = await prisma.users.update({
      where: { id: targetUserId },
      data: {
        first_name: firstName || undefined, // Используем snake_case для БД
        last_name: lastName || undefined,   // Используем snake_case для БД
        phone: phone || undefined,
        linkedinUrl: linkedinUrl || undefined,
        shareDataWithPartner: shareDataWithPartner,
      },
    });

    // Убираем чувствительные данные перед отправкой клиенту
    const { password_hash, ...safeUser } = updatedUser;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("PUT Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}