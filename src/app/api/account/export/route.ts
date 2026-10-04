import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/session";
import { exportUserData } from "@/lib/server/services/account";

export async function GET() {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const data = await exportUserData(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="findersarmy-gegevens.json"`, "cache-control": "no-store" },
  });
}
