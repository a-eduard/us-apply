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
    
    // Extracting all fields including the new ones and logoUrl
    const { 
      title, 
      companyName, 
      description, 
      requirements, 
      niche, 
      salesType,
      baseSalary,
      ote,
      commission,
      logoUrl 
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const newCampaign = await prisma.campaigns.create({
      data: {
        title,
        company_name: companyName || "",
        description: description || "",
        requirements: requirements || "",
        niche: niche || "",
        sales_type: salesType || "",
        base_salary: baseSalary || "",
        ote: ote || "",
        commission: commission || "",
        logo_url: logoUrl || null,
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