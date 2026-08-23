import { NextResponse, NextRequest } from "next/server";
import { setAuthCookies } from "@/src/app/api/auth/route";

export async function POST(req: NextRequest) {
	const { accessToken, refreshToken } = await req.json();

	if (!accessToken || !refreshToken)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	return setAuthCookies(accessToken, refreshToken);
}
