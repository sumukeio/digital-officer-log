import { getCurrentUser } from "@/app/actions/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  
  if (user) {
    return NextResponse.json({ authenticated: true, user: { id: user.id, workId: user.workId } });
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

