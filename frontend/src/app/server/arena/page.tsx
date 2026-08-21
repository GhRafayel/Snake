import Arena from "@/src/components/Arena/Arena";

export default async function Page({ searchParams }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { r } = await searchParams;
    return <Arena key={Array.isArray(r) ? r[0] : r ?? ""} />
}