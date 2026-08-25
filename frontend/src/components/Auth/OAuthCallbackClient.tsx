"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/components/Provider/UserProvider";
import { Lib } from "@/src/lib/lib";

export default function OAuthCallbackClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { ChangingCallback } = useAuth();
	const [error, setError] = useState(false);

	const accessToken = searchParams.get("accessToken");
	const refreshToken = searchParams.get("refreshToken");
	const missingTokens = !accessToken || !refreshToken;

	useEffect(() => {
		if (missingTokens) return;

		Lib.postRequest("/api/oauth-session", { accessToken, refreshToken })
			.then((res) => res.ok
				? (ChangingCallback(undefined, "me"), router.push("/"))
				: setError(true))
			.catch(() => setError(true));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accessToken, refreshToken, missingTokens]);

	return (
		<div className="w-full h-screen flex items-center justify-center">
			{(error || missingTokens)
				? (
					<div className="text-center">
						<p className="mb-4">Sign-in failed.</p>
						<button className="formBtnLog" type="button" onClick={() => router.push("/server/login")}>
							Back to login
						</button>
					</div>
				)
				: <p>Signing you in...</p>
			}
		</div>
	);
}
