#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const modulesDir = path.join(projectRoot, 'public', 'bibles', 'modules');
const manifestFilename = 'manifest.json';

// Minimal TypeScript loader so we can reuse the existing module download code.
function registerTypeScript() {
  const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
    esModuleInterop: true,
    resolveJsonModule: true
  };

  const loadTS = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions, fileName: filename });
    return module._compile(outputText, filename);
  };

  require.extensions['.ts'] = loadTS;
  require.extensions['.tsx'] = loadTS;
}

registerTypeScript();

const { ModuleManager } = require('../lib/modules/ModuleManager.ts');
const getModuleRegistry = require('../lib/modules/ModuleRegistry.ts').default;

function createFilesystemStorage(baseDir) {
  const manifestPath = path.join(baseDir, manifestFilename);

  const resolvePath = (moduleId) => {
    if (moduleId === 'bible-module-manifest') {
      return manifestPath;
    }
    return path.join(baseDir, `${moduleId}.json`);
  };

  return {
    async saveModuleData(moduleId, data) {
      await fsp.mkdir(baseDir, { recursive: true });
      const target = resolvePath(moduleId);
      await fsp.writeFile(target, JSON.stringify(data, null, 2), 'utf8');
    },
    async loadModuleData(moduleId) {
      const target = resolvePath(moduleId);
      const raw = await fsp.readFile(target, 'utf8');
      return JSON.parse(raw);
    },
    async deleteModuleData(moduleId) {
      const target = resolvePath(moduleId);
      await fsp.rm(target, { force: true });
    },
    async listInstalledModules() {
      try {
        const entries = await fsp.readdir(baseDir);
        return entries
          .filter((file) => file.endsWith('.json') && file !== manifestFilename)
          .map((file) => file.replace(/\.json$/, ''));
      } catch (error) {
        if (error.code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    },
    async getModulesDirectory() {
      return baseDir;
    },
    isAvailable() {
      return true;
    }
  };
}

async function main() {
  await fsp.mkdir(modulesDir, { recursive: true });

  const storageAdapter = createFilesystemStorage(modulesDir);
  const manager = new ModuleManager({ enablePersistence: false });
  const registry = getModuleRegistry();

  // Monkey patch the storage layer so downloads land in public/bibles/modules
  manager.hybridStorage = storageAdapter;
  registry.hybridStorage = storageAdapter;

  const available = await registry.getAvailableModules();
  const modules = Object.values(available);

  const modulesToDownload = modules.filter((mod) => mod.source?.type === 'github');

  console.log(`Preparing to download ${modulesToDownload.length} modules to ${modulesDir}`);

  for (const mod of modulesToDownload) {
    const outputPath = path.join(modulesDir, `${mod.id}.json`);
    if (fs.existsSync(outputPath)) {
      console.log(`• ${mod.id}: already present, skipping`);
      continue;
    }

    console.log(`• ${mod.id}: starting download (${mod.name})`);
    try {
      await manager.downloadModule(mod.id, (progress) => {
        if (progress && progress.progress !== undefined) {
          const pct = String(progress.progress).padStart(3, ' ');
          process.stdout.write(`    progress: ${pct}%\r`);
        }
      });
      process.stdout.write('');
      console.log(`    ✔ saved to ${outputPath}`);
    } catch (error) {
      process.stdout.write('');
      console.error(`    ✖ failed: ${error.message}`);
    }
  }

  console.log('\nAll downloads complete.');
}

main().catch((error) => {
  console.error('Download script failed:', error);
  process.exit(1);
});
