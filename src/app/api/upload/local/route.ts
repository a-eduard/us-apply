import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a safe, unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // Ensure the target directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(uploadDir, { recursive: true });
    
    // Write file to the public directory
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return the relative URL so the browser can display it
    const publicUrl = `/uploads/logos/${filename}`;

    return NextResponse.json({ success: true, publicUrl });
  } catch (error) {
    console.error("Local Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}