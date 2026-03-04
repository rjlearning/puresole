import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== "node_modules" && file !== "dist") {
                getFiles(filePath, fileList);
            }
        } else if (filePath.endsWith(".ts") && filePath !== __filename) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const filesToProcess = getFiles(__dirname);
let totalReplacements = 0;

console.log(`Analyzing ${filesToProcess.length} .ts files in server/ for Replit references...`);

const patterns = [
    // Pattern 1: (req.user as any).claims?.sub || (req.user as any).id
    {
        regex: /\(req\.user as any\)\.claims\?\.sub\s*\|\|\s*\(req\.user as any\)\.id/g,
        replacement: "(req.user as any).id",
    },
    // Pattern 2: (req.user as any).id || (req.user as any).claims?.sub
    {
        regex: /\(req\.user as any\)\.id\s*\|\|\s*\(req\.user as any\)\.claims\?\.sub/g,
        replacement: "(req.user as any).id",
    },
    // Pattern 3: req.user?.id || req.user?.claims?.sub
    {
        regex: /req\.user\?\.id\s*\|\|\s*req\.user\?\.claims\?\.sub/g,
        replacement: "(req.user as any)?.id",
    },
    // Pattern 4: req.user.claims.sub
    {
        regex: /req\.user\.claims\.sub/g,
        replacement: "(req.user as any).id",
    },
    // Pattern 5: (req.user as any).claims?.sub
    {
        regex: /\(req\.user as any\)\.claims\?\.sub/g,
        replacement: "(req.user as any).id",
    },
    // Pattern 6: user.claims?.sub || user.id
    {
        regex: /user\.claims\?\.sub\s*\|\|\s*user\.id/g,
        replacement: "user.id",
    },
];

for (const filePath of filesToProcess) {
    let content = fs.readFileSync(filePath, "utf-8");
    let modified = false;
    let fileReplacements = 0;

    for (const { regex, replacement } of patterns) {
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
            content = content.replace(regex, replacement);
            modified = true;
            fileReplacements += matches.length;
        }
    }

    // Cleanup potential artifact from pattern 4 replacement in `standardAuth.ts`
    // since `req.user.claims = { sub: req.user.id }` would become `(req.user as any).id = { sub: req.user.id }`
    // We will handle standardAuth.ts separately, so let's skip it in this automated sweep if it matches.
    if (filePath.endsWith("standardAuth.ts") || filePath.endsWith("multiAuth.ts")) {
        continue;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, "utf-8");
        console.log(`✅ Updated ${fileReplacements} matches in: ${path.basename(filePath)}`);
        totalReplacements += fileReplacements;
    }
}

console.log(`\\n🎉 Finished! Made ${totalReplacements} total replacements across the codebase.`);
