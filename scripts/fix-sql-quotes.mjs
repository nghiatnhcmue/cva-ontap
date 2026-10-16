import fs from 'fs';
import path from 'path';

function fixSqlQuotes(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      fixSqlQuotes(full);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.mjs')) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;

      // Sửa WHERE role = "ADMIN" -> WHERE role = 'ADMIN'
      // WHERE role = "TEACHER" -> WHERE role = 'TEACHER'
      // WHERE role = "STUDENT" -> WHERE role = 'STUDENT'
      // WHERE grade_id = "10" -> WHERE grade_id = '10'
      // WHERE grade_id = "11" -> WHERE grade_id = '11'
      const replacements = [
        ['WHERE role = "ADMIN"', "WHERE role = 'ADMIN'"],
        ['WHERE role = "TEACHER"', "WHERE role = 'TEACHER'"],
        ['WHERE role = "STUDENT"', "WHERE role = 'STUDENT'"],
        ['role = "ADMIN"', "role = 'ADMIN'"],
        ['role = "TEACHER"', "role = 'TEACHER'"],
        ['role = "STUDENT"', "role = 'STUDENT'"],
        ['WHERE u.role = "STUDENT"', "WHERE u.role = 'STUDENT'"],
        ['u.role = "STUDENT"', "u.role = 'STUDENT'"],
        ['grade_id = "10"', "grade_id = '10'"],
        ['grade_id = "11"', "grade_id = '11'"],
      ];

      for (const [target, replacement] of replacements) {
        if (content.includes(target)) {
          content = content.replaceAll(target, replacement);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Fixed SQL quotes in:', full);
      }
    }
  }
}

fixSqlQuotes('src');
console.log('Done fixing SQL string literal quotes.');

