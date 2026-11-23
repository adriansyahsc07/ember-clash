// Ember Clash — the hand-in program (Node 22, standard library only).
// It gathers this repository's game/ and screenshots/ into the output
// directory the grader reads, and writes dossier.json there with the
// vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program writes the same bytes on every run: plain copies plus a
// deterministic dossier, so the grader's two runs always agree.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  cpSync(source, target, { recursive: true });
}

function handIn() {
  // Start from a clean output directory so stale files can never leak in.
  // The grader mounts the output directory itself, so the directory must
  // stay in place: clear its contents, never remove the directory itself
  // (removing it fails with EACCES on the grader's read-only mount).
  mkdirSync(outputDir, { recursive: true });
  for (const name of readdirSync(outputDir)) {
    rmSync(join(outputDir, name), { recursive: true, force: true });
  }

  copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  const shotDir = join(repoRoot, 'screenshots');
  if (existsSync(shotDir)) copyTree(shotDir, join(outputDir, 'screenshots'));

  // The scorer's own caps, as the kit documents them: the text cap shapes
  // the dossier's bytes; the rest refuse an entry the scorer would refuse
  // (more than 4 screenshots, or one over 256 KiB; game/ over 993 files
  // or 48 MiB in all, or a path under game/ over 1000 bytes).
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
