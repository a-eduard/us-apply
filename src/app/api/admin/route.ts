import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.users.update({
      where: { email: "admin@apply.com" },
      data: { role: "Employer" },
    });

    return NextResponse.json({
      message: "SUCCESS! You are now an Employer.",
      email: user.email,
      role: user.role
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}