import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to extract userId from transition JWT
function getUserIdFromToken(req: Request): number | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  
  try {
    const token = authHeader.split(" ")[1];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.userId || payload.id || null;
  } catch (e) {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.campaignId, 10);
    
    if (isNaN(campaignId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const application = await prisma.applications.findFirst({
      where: { user_id: userId, campaign_id: campaignId },
    });

    if (!application) {
      // The frontend expects 404 to know it's a new application
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("GET Draft Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const campaignId = parseInt(resolvedParams.campaignId, 10);
    
    if (isNaN(campaignId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await req.json();

    const existingApp = await prisma.applications.findFirst({
      where: { user_id: userId, campaign_id: campaignId },
    });

    if (existingApp) {
      await prisma.applications.update({
        where: { id: existingApp.id },
        data: { draft_data: body.draftData },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Draft Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}