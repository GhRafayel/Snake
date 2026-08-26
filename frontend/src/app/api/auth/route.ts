import { NextResponse , NextRequest} from "next/server";
import { Lib } from "@/src/lib/lib"
import { AuthType } from "@/src/types/UserTypes/UserTypes";
import { getAccessTokenFromCookie } from "@/src/app/api/edit/route"

const serverUrl = process.env.INTERNAL_API_URL

export function setAuthCookies(accessToken: string, refreshToken: string, response: NextResponse = NextResponse.json({ success: true })) {
    response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 15,
        path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
    });

    return response;
}

export async function GET(req: NextRequest) {
    const accessToken = req.nextUrl.searchParams.get("accessToken");
    const refreshToken = req.nextUrl.searchParams.get("refreshToken");

    const baseUrl = process.env.FRONTEND_URL ?? req.url;

    if (!accessToken || !refreshToken)
        return NextResponse.redirect(new URL("/server/login", baseUrl));

    return setAuthCookies(accessToken, refreshToken, NextResponse.redirect(new URL("/", baseUrl)));
}

export async function POST ( req : NextRequest) {

    const path = req.nextUrl.searchParams.get("path") ?? "";
    const body =  await req.json();
    const res: AuthType = await Lib.postRequest(serverUrl + path , body)
    .then(res => res.json());

    if (res.accessToken === undefined || res.refreshToken === undefined)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return setAuthCookies(res.accessToken, res.refreshToken);
}

export async function DELETE (request: NextRequest) {

    const path = request.nextUrl.searchParams.get("path") ?? "";
    const {accessToken, cookieStore} = await getAccessTokenFromCookie();

    if (!accessToken)
        return  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(
            serverUrl + path, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
    if (res.ok) {
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");
    }
    return Response.json(res.ok);
}
