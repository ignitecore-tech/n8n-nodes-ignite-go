// Deletes the dist folder before the build so stale files are never published.
const fs = require('fs');
const path = require('path');

fs.rmSync(path.join(__dirname, '..', 'dist'), { recursive: true, force: true });
