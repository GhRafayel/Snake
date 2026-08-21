import { cookies } from "next/headers";
import { NextRequest, NextResponse } from 'next/server';

const serverUrl = process.env.INTERNAL_API_URL;
export async function getAccessTokenFromCookie() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    
    return {accessToken,  cookieStore};
}         

export async function POST(request: NextRequest) {

    const path = request.nextUrl.searchParams.get("path") ?? "";
    const body = await request.json();
    const {accessToken} = await getAccessTokenFromCookie();
    
    if (!accessToken && path != "/auth/reset" && path != "/auth/resetCode" ) {
        return  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch( 
            serverUrl  + path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
        }
    );
    const result = await res.json();

    return Response.json(result, { status: res.status });
}

export async function DELETE (request: NextRequest) {

    const path = request.nextUrl.searchParams.get("path") ?? "";
    const {accessToken} = await getAccessTokenFromCookie();

    if (!accessToken)
        return  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bodyText = await request.text();

    const res = await fetch(
            serverUrl  + path, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                ...(bodyText ? { "Content-Type": "application/json" } : {}),
            },
            ...(bodyText ? { body: bodyText } : {}),
        }
    );
    return Response.json(res.ok);
}

export async function PUT (request: NextRequest) {

    const body = await request.json();
    const path = request.nextUrl.searchParams.get("path") ?? "";
    const { accessToken } = await getAccessTokenFromCookie();

    if (!accessToken)
        return  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(serverUrl  + path, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });
    const result = await res.json();
    return Response.json(result, { status: res.status });
}

export async function PATCH (request: NextRequest) {

    const body = await request.json();
    const path = request.nextUrl.searchParams.get("path") ?? "";
    const { accessToken } = await getAccessTokenFromCookie();

   if(!accessToken)
        return  NextResponse.json({ error: "Unauthorized" }, { status: 401 });


    const res = await fetch( serverUrl  + path, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });
    const result = await res.json();
    return Response.json(result, { status: res.status });
}

export async function GET( request: NextRequest) {
    
    const path = request.nextUrl.searchParams.get("path") ?? "";
    const {accessToken} = await getAccessTokenFromCookie();

    if (!accessToken) return Response.json(null, { status: 401 });

    const res = await fetch( serverUrl + path, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });
    const result = await res.json();
    return Response.json(result, { status: res.status });

}