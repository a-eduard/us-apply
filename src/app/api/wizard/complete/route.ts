import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      city,
      country,
      yearsOfExperience,
      niches,
      linkedinUrl,
      videoPitchUrl,
      resumeUrl,
      campaignId,
      docusealSubmissionId
    } = body;

    // 1. Validate basic required fields for a new user
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields for registration" },
        { status: 400 }
      );
    }

    // 2. Check if the user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists. Please log in first." },
        { status: 409 }
      );
    }

    // 3. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 4. Format arrays for the database
    const serializedNiches = Array.isArray(niches) ? JSON.stringify(niches) : niches;

    // 5. Execute DB Transaction: Create User AND Application together
    const result = await prisma.$transaction(async (tx) => {
      
      // Step A: Create the User
      const newUser = await tx.users.create({
        data: {
          first_name: firstName,
          last_name: lastName,
          email,
          password_hash: hashedPassword,
          role: "Candidate",
          city: city || undefined,
          state: country || undefined, // Using 'state' for country as per existing DB logic
          years_of_experience: yearsOfExperience || undefined,
          niches: serializedNiches || undefined,
          linkedin_url: linkedinUrl || undefined,
          video_pitch_url: videoPitchUrl || undefined,
          resume_url: resumeUrl || undefined,
        },
      });

      let newApplication = null;

      // Step B: Create the Application if campaignId is present
      if (campaignId) {
        newApplication = await tx.applications.create({
          data: {
            user_id: newUser.id,
            campaign_id: parseInt(campaignId, 10),
            status: "Applied",
            city: city || undefined,
            state: country || undefined,
            linkedin_url: linkedinUrl || undefined,
            video_pitch_url: videoPitchUrl || undefined,
            resume_url: resumeUrl || undefined,
            years_of_experience: yearsOfExperience || undefined,
            niche: serializedNiches || undefined,
            docusealSubmissionId: docusealSubmissionId || undefined,
            contractStatus: docusealSubmissionId ? "SENT" : undefined,
          },
        });
      }

      return { user: newUser, application: newApplication };
    });

    // 6. Return success
    return NextResponse.json(
      { 
        success: true, 
        message: "Registration and application completed", 
        userId: result.user.id,
        applicationId: result.application?.id
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Wizard Complete API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during final submission", details: error.message },
      { status: 500 }
    );
  }
}