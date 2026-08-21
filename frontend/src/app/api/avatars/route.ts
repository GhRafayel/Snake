import { readdir } from 'node:fs/promises';
import path from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

export async function GET() {
    const avatarDir = path.join(process.cwd(), 'public', 'avatar');

    let files: string[] = [];
    try {
        files = await readdir(avatarDir);
    } catch {
        files = [];
    }

    const avatars = files
        .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
        .sort();

    return Response.json(avatars);
}
