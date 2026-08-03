import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type Context = {
  params: Promise<{ campaignId: string }>;
};

// GET - Fetch campaign details
export async function GET(req: Request, context: Context) {
  try {
    const { campaignId: paramId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const campaignId = parseInt(paramId, 10);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
      include: {
        applications: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
              }
            }
          },
          orderBy: { created_at: "desc" }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.user_id !== authUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formattedCampaign = {
      ...campaign,
      applications: campaign.applications.map((app: any) => ({
        ...app,
        firstName: app.users?.first_name || "Unknown",
        lastName: app.users?.last_name || "",
        email: app.users?.email || "",
        phone: app.users?.phone || "",
        users: undefined 
      }))
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error("GET Campaign Details Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE - Remove a campaign
export async function DELETE(req: Request, context: Context) {
  try {
    const { campaignId: paramId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const campaignId = parseInt(paramId, 10);

    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.user_id !== authUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete associated applications first to satisfy foreign key constraints
    await prisma.applications.deleteMany({
      where: { campaign_id: campaignId }
    });

    // Delete the campaign
    await prisma.campaigns.delete({
      where: { id: campaignId }
    });

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("DELETE Campaign Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH - Update a campaign
export async function PATCH(req: Request, context: Context) {
  try {
    const { campaignId: paramId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const campaignId = parseInt(paramId, 10);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.user_id !== authUserId) {
      return NextResponse.json({ error: "Campaign not found or forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      title, companyName, description, requirements, niche, salesType, 
      baseSalary, ote, commission, logoUrl 
    } = body;

    const updatedCampaign = await prisma.campaigns.update({
      where: { id: campaignId },
      data: {
        title: title !== undefined ? title : campaign.title,
        company_name: companyName !== undefined ? companyName : campaign.company_name,
        description: description !== undefined ? description : campaign.description,
        requirements: requirements !== undefined ? requirements : campaign.requirements,
        niche: niche !== undefined ? niche : campaign.niche,
        sales_type: salesType !== undefined ? salesType : campaign.sales_type,
        base_salary: baseSalary !== undefined ? baseSalary : campaign.base_salary,
        ote: ote !== undefined ? ote : campaign.ote,
        commission: commission !== undefined ? commission : campaign.commission,
        logo_url: logoUrl !== undefined ? logoUrl : campaign.logo_url,
      }
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("PATCH Campaign Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}