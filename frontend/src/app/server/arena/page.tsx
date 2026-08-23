import Arena from "@/src/components/Arena/Arena";
import { ArenaModeType } from "@/src/components/Store/useArenaStore";

export default async function Page({ searchParams }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { r, mode } = await searchParams;
    const resolvedMode: ArenaModeType = mode === "online" ? "online" : "AI";
    return <Arena key={Array.isArray(r) ? r[0] : r ?? ""} initialMode={resolvedMode} />
}