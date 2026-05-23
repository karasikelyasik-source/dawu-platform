const fs = require('fs');
const path = require('path');

const root = process.cwd();
const target = path.join(root, 'electron-standalone');

fs.rmSync(target, { recursive: true, force: true });

fs.cpSync(path.join(root, '.next', 'standalone'), target, {
  recursive: true,
});

fs.cpSync(
  path.join(root, '.next', 'static'),
  path.join(target, '.next', 'static'),
  { recursive: true }
);

const publicPath = path.join(root, 'public');
if (fs.existsSync(publicPath)) {
  fs.cpSync(publicPath, path.join(target, 'public'), {
    recursive: true,
  });
}

const nextCheck = path.join(target, 'node_modules', 'next');

if (!fs.existsSync(nextCheck)) {
  console.error('ERROR: electron-standalone/node_modules/next was not created');
  process.exit(1);
}

console.log('Standalone prepared successfully');
console.log('Next exists:', nextCheck);