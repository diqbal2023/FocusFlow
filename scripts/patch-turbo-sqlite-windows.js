/**
 * react-native-turbo-sqlite ships Windows projects with PlatformToolset v143
 * (VS 2022). FocusFlow builds with v145. Retarget after each install.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-turbo-sqlite',
  'windows',
  'ReactNativeTurboSqlite',
  'ReactNativeTurboSqlite.vcxproj',
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const original = fs.readFileSync(target, 'utf8');
const updated = original.replace(
  /<PlatformToolset>v143<\/PlatformToolset>/g,
  '<PlatformToolset>v145</PlatformToolset>',
);

if (updated !== original) {
  fs.writeFileSync(target, updated);
  console.log('Patched react-native-turbo-sqlite PlatformToolset to v145');
}
