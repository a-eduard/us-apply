export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Получаем ID текущего процесса, чтобы не убить самих себя
    const currentConnectionRes: any[] = await prisma.$queryRaw`SELECT CONNECTION_ID() as id`;
    const currentId = Number(currentConnectionRes[0].id);

    // Получаем абсолютно все процессы
    const processes: any[] = await prisma.$queryRaw`SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST WHERE COMMAND != 'Daemon'`;
    
    let killedCount = 0;

    // Убиваем ВСЕ процессы, кроме нашего
    for (const process of processes) {
      const processId = Number(process.ID);
      
      if (processId !== currentId) {
        try {
          await prisma.$executeRawUnsafe(`KILL ${processId}`);
          killedCount++;
        } catch (killError) {
          console.error(`Failed to kill process ${processId}:`, killError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `NUCLEAR OPTION: Killed ${killedCount} connections. Your database is now completely reset.`,
    });
  } catch (error: any) {
    console.error("Kill Locks Error:", error);
    return NextResponse.json(
      { error: "Failed to clear locks", details: error.message },
      { status: 500 }
    );
  }
}