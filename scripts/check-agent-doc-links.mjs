import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const agentDocsRoot = path.join(projectRoot, "docs", "agent");

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

function localDestination(destination) {
  const trimmed = destination.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return null;

  const token = trimmed.match(/^(<[^>]*>|\S+)/)?.[0];
  if (!token) return null;

  const target = token.startsWith("<") ? token.slice(1, -1) : token;
  const pathname = target.split(/[?#]/, 1)[0];
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

const sourceFiles = [path.join(projectRoot, "AGENTS.md"), ...markdownFiles(agentDocsRoot)];
const brokenLinks = [];

for (const sourceFile of sourceFiles) {
  const contents = fs.readFileSync(sourceFile, "utf8");
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(contents)) !== null) {
    const destination = localDestination(match[1]);
    if (destination === null) continue;

    const resolvedTarget = destination.startsWith("/")
      ? path.resolve(projectRoot, destination.slice(1))
      : path.resolve(path.dirname(sourceFile), destination);
    if (fs.existsSync(resolvedTarget)) continue;

    const line = contents.slice(0, match.index).split("\n").length;
    brokenLinks.push(`${path.relative(projectRoot, sourceFile)}:${line} -> ${match[1].trim()}`);
  }
}

if (brokenLinks.length > 0) {
  console.error("Links locais inválidos na documentação de agentes:");
  for (const brokenLink of brokenLinks) console.error(`- ${brokenLink}`);
  process.exitCode = 1;
} else {
  console.log(`Links locais válidos: ${sourceFiles.length} arquivos Markdown.`);
}
