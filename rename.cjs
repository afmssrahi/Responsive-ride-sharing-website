const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('build')) {
      results = results.concat(walk(file));
    } else if (stat && stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.html') || file.endsWith('.env'))) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(process.cwd());

let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Case-sensitive replacements
  content = content.replace(/SwiftRide/g, 'UniRide');
  content = content.replace(/swiftride/g, 'uniride');
  content = content.replace(/SWIFTRIDE/g, 'UNIRIDE');
  content = content.replace(/swift<span className="text-green-600">ride<\/span>/g, 'uni<span className="text-green-600">ride</span>');
  content = content.replace(/swift<span className="text-green-400">ride<\/span>/g, 'uni<span className="text-green-400">ride</span>');
  content = content.replace(/09678-SWIFT/g, '09678-UNIRIDE');
  content = content.replace(/SwiftLux/g, 'UniLux');
  content = content.replace(/SwiftPool/g, 'UniPool');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
});

console.log(`Updated ${changed} files.`);
