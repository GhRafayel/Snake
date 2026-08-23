import { Suspense } from "react";
import OAuthCallbackClient from "./OAuthCallbackClient";

export default function Page() {
	return (
		<Suspense fallback={null}>
			<OAuthCallbackClient />
		</Suspense>
	);
}
