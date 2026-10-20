// Copies icons (svg/png, including the light and dark variants) and codex files (*.node.json) from
// nodes/ and credentials/ to dist/, keeping the same folder structure. Plays the role of the
// "gulp build:icons" step of n8n-nodes-starter.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sources = ['nodes', 'credentials'];
const wanted = (file) => /\.(svg|png)$/i.test(file) || /\.node\.json$/i.test(file);

let copied = 0;

function walk(relDir) {
	const absDir = path.join(root, relDir);
	if (!fs.existsSync(absDir)) return;
	for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
		const rel = path.join(relDir, entry.name);
		if (entry.isDirectory()) {
			walk(rel);
		} else if (wanted(entry.name)) {
			const target = path.join(root, 'dist', rel);
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.copyFileSync(path.join(root, rel), target);
			copied++;
		}
	}
}

for (const dir of sources) walk(dir);
console.log(`copy-assets: copied ${copied} file(s) to dist/`);
