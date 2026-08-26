import { NextRequest, NextResponse } from "next/server";
import { Lib } from "@/src/lib/lib"
import { AuthType } from "@/src/types/UserTypes/UserTypes";

export async function proxy(request: NextRequest) {

    const pathname = request.nextUrl.pathname;
    console.log("Proxy middleware called for URL:", pathname);
   
    if (pathname === "/server/login" || pathname === "/server/register" || pathname === "/server/reset"
        || pathname === "/server/privacy" || pathname === "/server/terms")
       return NextResponse.next();

    const accessToken = request.cookies.get("accessToken");
    if (accessToken) return NextResponse.next();
    

    console.log("Access token not found, attempting to refresh...");
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (!refreshToken)
    {
        if (pathname === "/")
            return NextResponse.next();
        return NextResponse.redirect(new URL("/server/login", request.url));
    }
    console.log("Refresh token found, attempting to refresh access token...");
    try {
        const refreshRes: AuthType = await Lib.postRequest(process.env.INTERNAL_API_URL + "/auth/refresh", { refreshToken })
        .then((res) => res.json());
        if (!refreshRes.accessToken || !refreshRes.refreshToken)
        {
            const response = NextResponse.next();
            response.cookies.delete(refreshToken)
            return NextResponse.redirect(new URL("/server/login", request.url));
        }
        console.log("Access token refreshed successfully, setting cookies...");
        const response = NextResponse.next();
        response.cookies.set("accessToken", refreshRes.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 15,
            path: "/",
        });

        response.cookies.set("refreshToken", refreshRes.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });
        return response;
    }
    catch {
        return NextResponse.redirect(new URL("/server/login", request.url));
    }
}

export const config = { matcher: [ "/", "/server/:path*" ] };

