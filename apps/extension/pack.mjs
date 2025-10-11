import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';

const artifactsDir = path.resolve('artifacts');

fs.rmSync(artifactsDir, { recursive: true, force: true });
fs.mkdirSync(artifactsDir, { recursive: true });

function buildChromium() {
  const output = fs.createWriteStream(path.resolve(artifactsDir, 'extension-chromium.zip'));
  const archive = archiver('zip');
  archive.pipe(output);

  archive.directory('dist/chromium', false);

  archive.finalize();
}

function buildOther() {
  const output = fs.createWriteStream(path.resolve(artifactsDir, 'extension-firefox.zip'));
  const archive = archiver('zip');
  archive.pipe(output);

  archive.directory('dist/firefox', false);

  archive.finalize();
}

function buildSource() {
  const output = fs.createWriteStream(path.resolve(artifactsDir, 'source.zip'));
  const archive = archiver('zip');
  archive.pipe(output);

  archive.glob('**', { ignore: ['artifacts/**', 'dist/**', 'node_modules/**', '.turbo/**'] });

  archive.finalize();
}

buildChromium();
buildOther();
buildSource();
