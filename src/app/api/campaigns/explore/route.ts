import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const campaigns = await prisma.campaigns.findMany({
      where: {
        status: "Active",
        is_public: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("GET Explore Campaigns Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}