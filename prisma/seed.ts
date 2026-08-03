import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@apply.com";
  const password = "rTy-3Fd-Sa5-6Xp";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("Directly updating user in MySQL...");

  // Direct SQL query bypasses Prisma transaction locks
  const updatedCount = await prisma.$executeRaw`
    UPDATE users 
    SET role = 'Employer', password_hash = ${hashedPassword} 
    WHERE email = ${email}
  `;

  if (updatedCount > 0) {
    console.log("✅ Account admin@apply.com successfully upgraded to Employer!");
  } else {
    // If account didn't exist, insert directly
    await prisma.$executeRaw`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES (${email}, ${hashedPassword}, 'Admin', 'Employer', 'Employer')
    `;
    console.log("✅ Account admin@apply.com created as Employer!");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });