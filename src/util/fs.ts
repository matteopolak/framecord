import fs from 'node:fs/promises';

export async function isDirectory(path: string) {
	return (await fs.stat(path)).isDirectory();
}

export async function* traverse(path: string) {
	const directories = [];
	const paths = await fs.readdir(path);

	for (const path of paths) {
		if (await isDirectory(path)) {
			directories.push(path);

			continue;
		}

		yield path;
	}

	return directories;
}
