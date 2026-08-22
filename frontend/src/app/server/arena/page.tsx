import Arena from "@/src/components/Arena/Arena";
import { ArenaMode } from "@/src/components/Store/ArenaStore";

export default async function Page({ searchParams }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { r, mode } = await searchParams;
    const resolvedMode: ArenaMode = mode === "online" ? "online" : "AI";
    return <Arena key={Array.isArray(r) ? r[0] : r ?? ""} initialMode={resolvedMode} />
}