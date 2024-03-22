import type { Options } from 'globby';
import { join } from 'node:path/posix';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { mockProjectRoot } from '../../__mocks__/fs.js';
import { PACKAGE_JSON_NAME, type PackageJson } from '../package-json/package-json.interface.js';
import { collectWorkspacePackages } from './collect-workspace-packages.function.js';
import type { WorkspacePackage } from './workspace-package.interface.js';

const mockPackageJsonValue: PackageJson = {
	name: 'name',
};

vi.mock('@alexaegis/fs', async () => {
	const mockReadJson = vi.fn<[string | undefined], Promise<PackageJson | undefined>>((path) =>
		Promise.resolve(path?.endsWith(PACKAGE_JSON_NAME) ? mockPackageJsonValue : undefined),
	);

	const mockReadYaml = vi.fn<[string | undefined], Promise<undefined>>((_path) =>
		Promise.resolve(undefined),
	);

	return {
		readJson: mockReadJson,
		readYaml: mockReadYaml,
		normalizeCwdOption: await vi
			.importActual<typeof import('@alexaegis/fs')>('@alexaegis/fs')
			.then((mod) => mod.normalizeCwdOption),
		normalizeDirectoryDepthOption: await vi
			.importActual<typeof import('@alexaegis/fs')>('@alexaegis/fs')
			.then((mod) => mod.normalizeDirectoryDepthOption),
	};
});

vi.mock('node:fs', () => {
	return {
		existsSync: vi.fn((path: string) => path === join(mockProjectRoot, PACKAGE_JSON_NAME)),
	};
});

vi.mock('globby', () => {
	return {
		globby: (_patterns: string[], options: Options): string[] => {
			expect(options.absolute).toBeTruthy();
			expect(options.onlyDirectories).toBeTruthy();
			expect(options.cwd).toBe('/foo/bar');
			return [];
		},
	};
});

describe('collectWorkspacePackages in a root-package only workspace', () => {
	const workspacePackageRoot: WorkspacePackage = {
		packageKind: 'root',
		packageJson: mockPackageJsonValue,
		packagePath: '/foo/bar',
		packageJsonPath: `/foo/bar/${PACKAGE_JSON_NAME}`,
		workspacePackagePatterns: [],
		packagePathFromRootPackage: '.',
	};
	afterAll(() => {
		vi.resetAllMocks();
	});

	it('should be able to collect all packages in a workspace from a sub directory', async () => {
		const foundPackageJsons = await collectWorkspacePackages({ cwd: '/foo/bar/zed' });
		expect(foundPackageJsons).toEqual<WorkspacePackage[]>([workspacePackageRoot]);
	});

	it('should be able to collect all packages in a workspace from the root', async () => {
		const foundPackageJsons = await collectWorkspacePackages({ cwd: '/foo/bar' });
		expect(foundPackageJsons).toEqual<WorkspacePackage[]>([workspacePackageRoot]);
	});

	it('should be able to collect nothing, outside the workspace', async () => {
		const foundPackageJsons = await collectWorkspacePackages({ cwd: '/foo' });
		expect(foundPackageJsons).toEqual<WorkspacePackage[]>([]);
	});

	it('should still be able to collect the single package even if skipWorkspaceRoot is enabled', async () => {
		const foundPackageJsons = await collectWorkspacePackages({
			cwd: '/foo/bar',
			skipWorkspaceRoot: true,
		});
		expect(foundPackageJsons).toEqual<WorkspacePackage[]>([workspacePackageRoot]);
	});
});
