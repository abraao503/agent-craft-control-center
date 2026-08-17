import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/i18n/resources.ts", import.meta.url), "utf8");

function blockBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Catálogo não encontrado: ${startMarker}`);
  return source.slice(start, end);
}

function collectKeys(block) {
  const keys = new Map();
  const lines = block.split("\n");
  const stack = [];
  for (const line of lines) {
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    while (stack.length && indent <= stack.at(-1).indent) stack.pop();
    const match = line.match(/^\s*(?:"([^"]+)"|([A-Za-z][\w]*))\s*:/);
    if (!match) continue;
    const key = match[1] ?? match[2];
    const path = [...stack.map((item) => item.key), key].join(".");
    keys.set(path, line);
    if (/\{\s*$/.test(line)) stack.push({ indent, key });
  }
  return keys;
}

const portuguese = collectKeys(blockBetween("export const ptBR", "export const esES"));
const spanish = collectKeys(blockBetween("export const esES", "export const enUS"));
const english = collectKeys(blockBetween("export const enUS", "export const resources"));
const missingInSpanish = [...portuguese.keys()].filter((key) => !spanish.has(key));
const missingInPortuguese = [...spanish.keys()].filter((key) => !portuguese.has(key));
const missingInEnglish = [...portuguese.keys()].filter((key) => !english.has(key));
const extraInEnglish = [...english.keys()].filter((key) => !portuguese.has(key));
const nonLegacyEnglishExtras = extraInEnglish.filter((key) => !key.startsWith("legacy."));

if (
  missingInSpanish.length ||
  missingInPortuguese.length ||
  missingInEnglish.length ||
  nonLegacyEnglishExtras.length
) {
  console.error("Catálogos de idioma fora de sincronia.");
  if (missingInSpanish.length) console.error("Ausentes em es-ES:", missingInSpanish.join(", "));
  if (missingInPortuguese.length) console.error("Ausentes em pt-BR:", missingInPortuguese.join(", "));
  if (missingInEnglish.length) console.error("Ausentes em en-US:", missingInEnglish.join(", "));
  if (nonLegacyEnglishExtras.length) {
    console.error("Extras não-legados em en-US:", nonLegacyEnglishExtras.join(", "));
  }
  process.exit(1);
}

console.log(
  `Catálogos alinhados: ${portuguese.size} chaves em pt-BR, es-ES e en-US.`,
);
if (extraInEnglish.length) {
  console.log(`Compatibilidade legacy adicional em en-US: ${extraInEnglish.length} chaves.`);
}
