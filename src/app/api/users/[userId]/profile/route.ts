export const dynamic = "force-dynamic"; // Отключаем кэш для этого роута

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

    const user = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        linkedin_url: true,
        city: true,
        state: true,
        resume_url: true,
        video_pitch_url: true,
        years_of_experience: true,
        niches: true,
        avatar_url: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
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
        first_name: firstName || undefined, 
        last_name: lastName || undefined,   
        phone: phone || undefined,
        linkedin_url: linkedinUrl || undefined,
        share_data_with_partner: shareDataWithPartner,
      },
    });

    const { password_hash, ...safeUser } = updatedUser;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("PUT Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();
    const {
      first_name,
      last_name,
      phone,
      city,
      state,
      linkedin_url,
      resume_url,
      video_pitch_url,
      years_of_experience,
      niches,
      avatar_url
    } = body;

    const serializedNiches = niches !== undefined 
      ? (Array.isArray(niches) ? JSON.stringify(niches) : niches) 
      : undefined;

    const updatedUser = await prisma.users.update({
      where: { id: targetUserId },
      data: {
        first_name: first_name !== undefined ? first_name : undefined,
        last_name: last_name !== undefined ? last_name : undefined,
        phone: phone !== undefined ? phone : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        linkedin_url: linkedin_url !== undefined ? linkedin_url : undefined,
        resume_url: resume_url !== undefined ? resume_url : undefined,
        video_pitch_url: video_pitch_url !== undefined ? video_pitch_url : undefined,
        years_of_experience: years_of_experience !== undefined ? years_of_experience : undefined,
        niches: serializedNiches !== undefined ? serializedNiches : undefined,
        avatar_url: avatar_url !== undefined ? avatar_url : undefined,
      },
    });

    const { password_hash, ...safeUser } = updatedUser;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("PATCH Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.applications.deleteMany({
      where: { user_id: targetUserId }
    });

    await prisma.users.delete({
      where: { id: targetUserId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}