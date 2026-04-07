import fs from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const cwd = process.cwd();
const entries = await fs.readdir(cwd, { withFileTypes: true });
const pdfFiles = entries
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

const results = [];

for (const fileName of pdfFiles) {
  const filePath = path.join(cwd, fileName);
  const data = new Uint8Array(await fs.readFile(filePath));
  const loadingTask = getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNumber,
      text,
    });
  }

  results.push({
    sourceFile: fileName,
    pages,
  });
}

const outputPath = path.join(cwd, "data", "pdf-text-extract.json");
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), items: results }, null, 2));

console.log(outputPath);
