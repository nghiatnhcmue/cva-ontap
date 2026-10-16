import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (f === 'route.ts') {
      let content = fs.readFileSync(full, 'utf8');
      if (!content.includes("export const dynamic = 'force-dynamic';")) {
        content = "export const dynamic = 'force-dynamic';\n" + content;
        fs.writeFileSync(full, content, 'utf8');
        console.log('Added dynamic export to:', full);
      }
    }
  }
}

walk('src/app/api');
console.log('Done adding force-dynamic.');

