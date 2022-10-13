import fs from 'node:fs/promises';
import { join } from 'node:path';

async function isDirectory(path: string) {
	return (await fs.stat(path)).isDirectory();
}

/// Recursively traverses a directory
export async function* traverse(path: string) {
	const directories = [];
	const paths = await fs.readdir(path);

	for (const local of paths) {
		const localPath = join(path, local);

		if (await isDirectory(localPath)) {
			directories.push(local);

			continue;
		}

		yield local;
	}

	return directories;
}
