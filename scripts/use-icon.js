// Switch the launcher icon:  node scripts/use-icon.js tortoise   |   node scripts/use-icon.js woven
const fs = require('fs'), path = require('path');
const which = process.argv[2];
const dir = path.join(__dirname, '..', 'assets', 'icon-options', which || '');
if (!which || !fs.existsSync(dir)) { console.log('Usage: node scripts/use-icon.js tortoise|woven'); process.exit(1); }
const map = { 'icon.png': 'icon.png', 'adaptive-icon.png': 'android-icon-foreground.png', 'monochrome-icon.png': 'android-icon-monochrome.png', 'splash-icon.png': 'splash-icon.png', 'favicon.png': 'favicon.png' };
for (const [from, to] of Object.entries(map)) fs.copyFileSync(path.join(dir, from), path.join(__dirname, '..', 'assets', to));
console.log(`Icon set to "${which}". Rebuild the app to see it on your phone.`);
