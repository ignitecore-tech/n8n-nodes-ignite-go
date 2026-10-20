// Copia ícones (svg/png) e arquivos de codex (*.node.json) de nodes/ e credentials/ para dist/,
// mantendo a mesma estrutura de pastas. Faz o papel do "gulp build:icons" do n8n-nodes-starter.
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
console.log(`copy-assets: ${copied} arquivo(s) copiado(s) para dist/`);
