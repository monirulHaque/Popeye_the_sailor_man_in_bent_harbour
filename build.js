// Concatenates src/*.js into one self-contained page.
//   dist/index.html    — standalone file (open it, or wrap it with Electron/Tauri for desktop)
//   dist/artifact.html — the same page as a fragment for hosts that supply their own <html> shell
//   index.html, docs/index.html — copies of dist/index.html for GitHub Pages
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src'), out = path.join(__dirname, 'dist');
const js = fs.readdirSync(src).filter((f) => f.endsWith('.js')).sort().map((f) => `// ===== ${f}\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const page = fs.readFileSync(path.join(src, 'page.html'), 'utf8').replace('/*SCRIPT*/', () => `(function () {\n'use strict';\n${js}\n})();`);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'artifact.html'), page);
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<title>Bent Harbor</title>\n</head>\n<body>\n${page}\n</body>\n</html>\n`);
// GitHub Pages: the same standalone page at the repo root and in docs/, so either Pages source setting serves the game
const standalone = fs.readFileSync(path.join(out, 'index.html'));
fs.mkdirSync(path.join(__dirname, 'docs'), { recursive: true });
for (const f of ['index.html', 'docs/index.html']) fs.writeFileSync(path.join(__dirname, f), standalone);
for (const f of ['.nojekyll', 'docs/.nojekyll']) fs.writeFileSync(path.join(__dirname, f), '');
console.log('built', (page.length / 1024).toFixed(1) + ' KB');
