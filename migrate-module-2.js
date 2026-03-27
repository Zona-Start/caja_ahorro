const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\Sergio\\Documents\\PROYECTOS\\caja_ahorro\\apps\\web\\feactures\\savings-banks\\loans\\loans-disbursement-batch';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replacements
  // Strings
  content = content.replace(/loan-disbursement\/batch-/g, 'loan-disbursement-batch-');
  content = content.replace(/loan-disbursement\/batch\./g, 'loan-disbursement-batch.');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated content: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
        replaceInFile(fullPath);
      }
    }
  }
}

processDirectory(targetDir);
console.log('Migration Phase 2 complete');
