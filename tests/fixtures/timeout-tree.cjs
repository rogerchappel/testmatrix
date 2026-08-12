const { spawn } = require('node:child_process');

const descendant = spawn(
  process.execPath,
  ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"],
  { stdio: 'inherit' }
);

console.log(`descendant:${descendant.pid}`);
process.on('SIGTERM', () => {});
setInterval(() => {}, 1000);
