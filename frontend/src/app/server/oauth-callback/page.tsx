import { Suspense } from "react";
import OAuthCallbackClient from "@/src/components/Auth/OAuthCallbackClient";

export default function Page() {
	return (
		<Suspense fallback={null}>
			<OAuthCallbackClient />
		</Suspense>
	);
}
