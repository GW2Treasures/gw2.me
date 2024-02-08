import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const artifactsDir = path.resolve('artifacts');

fs.rmSync(artifactsDir, { recursive: true, force: true });
fs.mkdirSync(artifactsDir, { recursive: true });

function buildChromium() {
  const output = fs.createWriteStream(path.resolve(artifactsDir, 'extension-chromium.zip'));
  const archive = archiver('zip');
  archive.pipe(output);

  // add all files from dist except manifest
  archive.glob('**', { cwd: 'dist', ignore: ['manifest.json'],  });

  // remove browser_specific_settings from manifest
  const manifest = JSON.parse(fs.readFileSync('dist/manifest.json', 'utf-8'));
  delete manifest['browser_specific_settings'];

  // add custom manifest
  archive.append(
    JSON.stringify(manifest, null, '  '),
    { name: 'manifest.json' }
  );

  archive.finalize();
}

function buildOther() {
  const output = fs.createWriteStream(path.resolve(artifactsDir, 'extension-other.zip'));
  const archive = archiver('zip');
  archive.pipe(output);

  archive.directory('dist', false);

  archive.finalize();
}

function buildSource() {
  const output = fs.createWriteStream(path.resolve(artifactsDir, 'source.zip'));
  const archive = archiver('zip');
  archive.pipe(output);

  archive.glob('**', { ignore: ['artifacts/**', 'dist/**', 'node_modules/**'] });

  archive.finalize();
}

buildChromium();
buildOther();
buildSource();
