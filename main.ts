// Emberfall Duel — entry program (Node 22, standard library only).
// It hands the game in: copies this repository's game/ and screenshots/ into
// the output directory and writes dossier.json with the vendored make.fun
// library, exactly as the competition's gate expects. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

if (!existsSync(join(here, 'game', 'index.html'))) fail('game/index.html is missing');
const shots = join(here, 'screenshots');
if (!existsSync(shots)) fail('screenshots/ is missing');
const shotFiles = [];
// The gate allows at most 4 screenshots, each at most 256 KiB.
import { readdirSync } from 'node:fs';
for (const name of readdirSync(shots).sort()) {
  if (name.startsWith('.')) continue;
  const size = statSync(join(shots, name)).size;
  if (size > 262144) fail(`screenshot ${name} is ${size} bytes, over the 256 KiB cap`);
  shotFiles.push(name);
}
if (shotFiles.length < 3 || shotFiles.length > 4) fail(`expected 3 or 4 screenshots, found ${shotFiles.length}`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shots, join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log(`Emberfall Duel handed in: ${shotFiles.length} screenshots, dossier written to ${out}/dossier.json`);
