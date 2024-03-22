import type { PathLike, Stats } from 'node:fs';
import { vi } from 'vitest';

export const mockWriteFile: ReturnType<typeof vi.fn> = vi.fn<
	[PathLike, unknown],
	Promise<undefined>
>(() => Promise.resolve(undefined));

const mockLstat: ReturnType<typeof vi.fn> = vi.fn(
	(path: PathLike): Promise<Stats | undefined> =>
		new Promise((resolve) => {
			if (
				path.toString().endsWith('.sh') ||
				path.toString().endsWith('.txt') ||
				path.toString().endsWith('.js') ||
				path.toString().endsWith('.ts')
			) {
				resolve({
					isFile: () => true,
					mode: path.toString().includes('executable') ? 0o111 : 0o444,
				} as Stats);
			} else if (path.toString().endsWith('directory')) {
				resolve({ isFile: () => false } as Stats);
			} else {
				throw new Error('non existent!');
			}
		}),
);

export const mockChmod: ReturnType<typeof vi.fn> = vi.fn(() => Promise.resolve(undefined));

export const mockReadFile: ReturnType<typeof vi.fn> = vi.fn<[PathLike, unknown], Promise<string>>();

export const readFile: ReturnType<typeof vi.fn> = mockReadFile;
export const writeFile: ReturnType<typeof vi.fn> = mockWriteFile;
export const lstat: ReturnType<typeof vi.fn> = mockLstat;
export const chmod: ReturnType<typeof vi.fn> = mockChmod;
