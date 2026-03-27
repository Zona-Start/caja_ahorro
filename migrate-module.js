const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\Sergio\\Documents\\PROYECTOS\\caja_ahorro\\apps\\web\\feactures\\savings-banks\\loans\\loans-disbursement-batch';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replacements
  // Strings
  content = content.replace(/\/payment-batch/g, '/loan-disbursement/batch');
  content = content.replace(/paymentBatch/g, 'loanDisbursementBatch');
  content = content.replace(/PaymentBatch/g, 'LoanDisbursementBatch');
  content = content.replace(/payment-batches/g, 'loan-disbursement-batches');
  content = content.replace(/payment-batch/g, 'loan-disbursement-batch');
  content = content.replace(/PAYMENT_BATCH/g, 'LOAN_DISBURSEMENT_BATCH');
  content = content.replace(/payment_batch/g, 'loan_disbursement_batch');

  // Fixes
  content = content.replace(/loanDisbursementBatchId/g, 'loanId');

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
      // Rename directory if needed
      if (file.includes('payment-batch') || file.includes('paymentBatch')) {
        let newName = file.replace(/payment-batch/g, 'loan-disbursement-batch').replace(/paymentBatch/g, 'loanDisbursementBatch');
        const newPath = path.join(dir, newName);
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed dir: ${fullPath} -> ${newPath}`);
      }
    } else {
      replaceInFile(fullPath);
      // Rename file if needed
      if (file.includes('payment-batch') || file.includes('paymentBatch')) {
        let newName = file.replace(/payment-batch/g, 'loan-disbursement-batch').replace(/paymentBatch/g, 'loanDisbursementBatch');
        const newPath = path.join(dir, newName);
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed file: ${fullPath} -> ${newPath}`);
      }
    }
  }
}

processDirectory(targetDir);
console.log('Migration complete');
