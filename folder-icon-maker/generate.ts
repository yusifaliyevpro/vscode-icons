import fs from "fs";
import path from "path";

const _dirname = path.dirname(process.argv[1]);

// Base folder paths (24x24 viewBox)
const FOLDER_CLOSED_PATH = `<path d="m10 4h-6c-1.11 0-2 0.89-2 2v12c0 1.097 0.903 2 2 2h16c1.097 0 2-0.903 2-2v-10c0-1.11-0.9-2-2-2h-8l-2-2z" fill="#45403d" fill-rule="nonzero"/>`;
const FOLDER_OPEN_PATH = `<path d="m19 20h-15c-1.11 0-2-0.9-2-2v-12c0-1.11 0.89-2 2-2h6l2 2h7c1.097 0 2 0.903 2 2h-17v10l2.14-8h17.07l-2.28 8.5c-0.23 0.87-1.01 1.5-1.93 1.5z" fill="#45403d"/>`;

// Default target region for the logo on the 24x24 canvas
// Matches existing folder icons like folder_next.svg: matrix(.61203 0 0 .61203 10.266 7.3085)
const DEFAULT_TARGET = { x: 10.266, y: 7.3085, width: 14.689, height: 14.689 };

interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

interface Target {
  x: number;
  y: number;
  width: number;
  height: number;
}

function parseViewBox(svgContent: string): ViewBox {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch) {
    const [minX, minY, width, height] = viewBoxMatch[1]
      .split(/[\s,]+/)
      .map(Number);
    return { minX, minY, width, height };
  }

  // Fallback: try width/height attributes
  const wMatch = svgContent.match(/\bwidth=["']([.\d]+)["']/);
  const hMatch = svgContent.match(/\bheight=["']([.\d]+)["']/);
  if (wMatch && hMatch) {
    return {
      minX: 0,
      minY: 0,
      width: Number(wMatch[1]),
      height: Number(hMatch[1]),
    };
  }

  console.error(
    "Error: Could not determine viewBox or width/height from the SVG.",
  );
  process.exit(1);
}

function extractInnerContent(svgContent: string): string {
  // Remove XML declaration
  const content = svgContent.replace(/<\?xml[^?]*\?>\s*/g, "");
  // Extract everything between <svg ...> and </svg>
  const match = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!match) {
    console.error("Error: Could not parse SVG content.");
    process.exit(1);
  }
  return match[1].trim();
}

function buildTransform(viewBox: ViewBox, target: Target): string {
  const scaleX = target.width / viewBox.width;
  const scaleY = target.height / viewBox.height;
  const scale = Math.min(scaleX, scaleY);

  const scaledW = viewBox.width * scale;
  const scaledH = viewBox.height * scale;

  // Center in the target region
  const translateX =
    target.x + (target.width - scaledW) / 2 - viewBox.minX * scale;
  const translateY =
    target.y + (target.height - scaledH) / 2 - viewBox.minY * scale;

  // Round to 5 decimal places for clean output
  const r = (n: number) => Math.round(n * 100000) / 100000;
  return `matrix(${r(scale)} 0 0 ${r(scale)} ${r(translateX)} ${r(translateY)})`;
}

function generateFolderSvg(
  folderPath: string,
  logoContent: string,
  transform: string,
): string {
  return `<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.4142" version="1.1" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">${folderPath}<g transform="${transform}">${logoContent}</g></svg>\n`;
}

// --- Main ---

// Parse flags
function getFlag(name: string): number {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? parseFloat(process.argv[i + 1]) : 0;
}

const userScale = getFlag("scale") || 1;
const offsetX = getFlag("x");
const offsetY = getFlag("y");

const target: Target = {
  width: DEFAULT_TARGET.width * userScale,
  height: DEFAULT_TARGET.height * userScale,
  x: DEFAULT_TARGET.x + (DEFAULT_TARGET.width * (1 - userScale)) / 2 + offsetX,
  y: DEFAULT_TARGET.y + (DEFAULT_TARGET.height * (1 - userScale)) / 2 + offsetY,
};

const inputDir = _dirname;
const outputDir = path.join(_dirname, "output");

// Find logo SVG files (skip generate script itself)
const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".svg"));

if (files.length === 0) {
  console.log(
    "Usage: Place your logo SVG (e.g. vercel.svg) in this folder, then run:",
  );
  console.log("  node --experimental-strip-types folder-maker/generate.ts");
  console.log(
    "  node --experimental-strip-types folder-maker/generate.ts --scale 1.2    (20% bigger)",
  );
  console.log(
    "  node --experimental-strip-types folder-maker/generate.ts --scale 0.8    (20% smaller)",
  );
  console.log(
    "  node --experimental-strip-types folder-maker/generate.ts --x 0.5        (shift right by 0.5)",
  );
  console.log(
    "  node --experimental-strip-types folder-maker/generate.ts --y -1          (shift up by 1)",
  );
  console.log(
    "  node --experimental-strip-types folder-maker/generate.ts --scale 1.1 --x 0.5 --y -0.3",
  );
  console.log(
    "\nOutput: folder_vercel.svg and folder_vercel_open.svg in output/",
  );
  process.exit(0);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

for (const file of files) {
  const name = path.basename(file, ".svg");
  const svgContent = fs.readFileSync(path.join(inputDir, file), "utf-8");

  const viewBox = parseViewBox(svgContent);
  const innerContent = extractInnerContent(svgContent);
  const transform = buildTransform(viewBox, target);

  const closedSvg = generateFolderSvg(
    FOLDER_CLOSED_PATH,
    innerContent,
    transform,
  );
  const openSvg = generateFolderSvg(FOLDER_OPEN_PATH, innerContent, transform);

  const closedPath = path.join(outputDir, `folder_${name}.svg`);
  const openPath = path.join(outputDir, `folder_${name}_open.svg`);

  fs.writeFileSync(closedPath, closedSvg);
  fs.writeFileSync(openPath, openSvg);

  console.log(`Generated: folder_${name}.svg, folder_${name}_open.svg`);
}

console.log(`\nOutput saved to: ${outputDir}`);
