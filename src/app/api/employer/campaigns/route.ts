export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);

    const campaigns = await prisma.campaigns.findMany({
      where: { 
        user_id: authUserId 
      },
      orderBy: { 
        created_at: "desc" 
      },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
          }
        }
      }
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("GET Employer Campaigns Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const newCampaign = await prisma.campaigns.create({
      data: {
        title: body.title,
        company_name: body.companyName || "",
        description: body.description || "",
        // Читаем оба варианта на всякий случай, чтобы 100% сохранить
        short_description: body.shortDescription || body.short_description || "", 
        requirements: body.requirements || "",
        niche: body.niche || "",
        sales_type: body.salesType || "",
        logo_url: body.logoUrl || null,
        user_id: authUserId,
        status: "Active",
      }
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error("POST Employer Campaigns Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}