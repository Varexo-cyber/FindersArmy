import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
console.log(await db.campaign.updateMany({ where: { business: { name: { contains: "e2e-" } }, status: "LIVE" }, data: { status: "PAUSED" } }));
await db.$disconnect();
