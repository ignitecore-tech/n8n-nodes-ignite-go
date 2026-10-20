// Apaga a pasta dist antes do build para não publicar arquivos antigos.
const fs = require('fs');
const path = require('path');

fs.rmSync(path.join(__dirname, '..', 'dist'), { recursive: true, force: true });
