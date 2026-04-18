import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const DIST_ASSETS_DIR = 'dist/assets';
const MAX_TOTAL_JS_BYTES = Number(process.env.BUNDLE_BUDGET_BYTES ?? '6000000');

const toKb = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

const main = async () => {
  const entries = await readdir(DIST_ASSETS_DIR);
  const jsFiles = entries.filter((name) => name.endsWith('.js'));

  let totalBytes = 0;
  const details = [];
  for (const file of jsFiles) {
    const filePath = join(DIST_ASSETS_DIR, file);
    const info = await stat(filePath);
    totalBytes += info.size;
    details.push({ file, size: info.size });
  }

  details.sort((a, b) => b.size - a.size);

  console.log(`Bundle budget: ${toKb(MAX_TOTAL_JS_BYTES)} (${MAX_TOTAL_JS_BYTES} bytes)`);
  console.log(`Current JS total: ${toKb(totalBytes)} (${totalBytes} bytes)`);
  for (const row of details) {
    console.log(` - ${row.file}: ${toKb(row.size)}`);
  }

  if (totalBytes > MAX_TOTAL_JS_BYTES) {
    throw new Error(
      `JS bundle budget exceeded by ${toKb(totalBytes - MAX_TOTAL_JS_BYTES)}. ` +
        `Increase BUNDLE_BUDGET_BYTES intentionally or reduce bundle size.`,
    );
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
