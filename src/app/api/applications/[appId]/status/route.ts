import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const appId = parseInt(resolvedParams.appId, 10);

    if (isNaN(appId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status, notes } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.employer_notes = notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const updatedApplication = await prisma.applications.update({
      where: { id: appId },
      data: updateData,
    });

    return NextResponse.json({ success: true, application: updatedApplication });
  } catch (error: any) {
    console.error("Update Application Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}