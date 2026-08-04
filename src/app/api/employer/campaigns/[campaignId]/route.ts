export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.campaignId, 10);

    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
      include: {
        applications: {
          include: {
            users: true // <-- ИСПРАВЛЕНИЕ: Теперь забираем ВСЕ поля пользователя
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const formattedCampaign = {
      ...campaign,
      applications: campaign.applications
        .map((app: any) => {
          // ИСПРАВЛЕНИЕ: Красиво форматируем ниши, убирая скобки и кавычки массива
          let parsedNiche = app.users?.niches || app.niche || "";
          if (typeof parsedNiche === "string" && parsedNiche.startsWith("[")) {
            try {
              parsedNiche = JSON.parse(parsedNiche).join(", ");
            } catch (e) {}
          }

          return {
            ...app,
            firstName: app.users?.first_name || "Unknown",
            lastName: app.users?.last_name || "",
            email: app.users?.email || "",
            phone: app.users?.phone || "",
            // ИСПРАВЛЕНИЕ: Прокидываем все файлы и ссылки во фронтенд
            linkedinUrl: app.users?.linkedin_url || "",
            resumeUrl: app.users?.resume_url || "",
            videoPitchUrl: app.users?.video_pitch_url || "",
            yearsOfExperience: app.users?.years_of_experience || "",
            niche: parsedNiche,
            users: undefined 
          };
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        })
    };

    return NextResponse.json(formattedCampaign);
  } catch (error: any) {
    console.error("GET Campaign Details Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message || error.toString() }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.campaignId, 10);
    if (isNaN(campaignId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.applications.deleteMany({ where: { campaign_id: campaignId } });
    await prisma.campaigns.delete({ where: { id: campaignId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.campaignId, 10);
    if (isNaN(campaignId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await req.json();
    
    const updatedCampaign = await prisma.campaigns.update({
      where: { id: campaignId },
      data: {
        title: body.title,
        company_name: body.companyName,
        description: body.description,
        requirements: body.requirements,
        niche: body.niche,
        sales_type: body.salesType,
        base_salary: body.baseSalary,
        ote: body.ote,
        commission: body.commission,
        logo_url: body.logoUrl,
      }
    });

    return NextResponse.json(updatedCampaign);
  } catch (error: any) {
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}