import Reset from "@/src/components/Auth/Reset"
import { cookies } from "next/headers"
import { redirect } from "next/navigation";

export default async function page() {
	if ((await cookies()).get("accessToken")?.value) redirect("/");
	return <Reset />
}