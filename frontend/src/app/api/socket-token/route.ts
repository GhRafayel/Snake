import { NextResponse } from "next/server";
import { getAccessTokenFromCookie } from "@/src/app/api/edit/route";

export async function GET() {
    const { accessToken } = await getAccessTokenFromCookie();
    return NextResponse.json({ accessToken: accessToken ?? null });
}
