import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const body = await req.json();
    const { campaign_id, first_name, last_name, city, state } = body;

    // 1. Update user profile with basic info
    await prisma.users.update({
      where: { id: authUserId },
      data: {
        first_name: first_name,
        last_name: last_name,
        city,
        state,
      },
    });

    // 2. Create or update the application draft
    if (campaign_id) {
      const existingApp = await prisma.applications.findFirst({
        where: {
          user_id: authUserId,
          campaign_id: parseInt(campaign_id, 10),
        },
      });

      if (existingApp) {
        // If it already exists, update the draft data as a JSON string
        await prisma.applications.update({
          where: { id: existingApp.id },
          data: {
            city,
            state,
            draft_data: JSON.stringify(body),
          },
        });
      } else {
        // If creating a new one, set status to Draft and save data as a JSON string
        await prisma.applications.create({
          data: {
            user_id: authUserId,
            campaign_id: parseInt(campaign_id, 10),
            status: "Draft",
            city,
            state,
            draft_data: JSON.stringify(body),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Draft Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Fetch saved draft
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = parseInt((session.user as any).id, 10);
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const draft = await prisma.applications.findFirst({
      where: {
        user_id: authUserId,
        campaign_id: parseInt(campaignId, 10),
      },
    });

    // Explicitly handle the null case to satisfy TypeScript
    if (!draft) {
      return NextResponse.json({});
    }

    // Parse the draft_data back into an object before sending to the client
    let parsedDraftData = null;
    if (draft.draft_data) {
      try {
        parsedDraftData = typeof draft.draft_data === 'string' 
          ? JSON.parse(draft.draft_data) 
          : draft.draft_data;
      } catch (e) {
        console.error("Failed to parse draft_data", e);
      }
    }

    return NextResponse.json({
      ...draft,
      draft_data: parsedDraftData
    });
  } catch (error) {
    console.error("GET Draft Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}