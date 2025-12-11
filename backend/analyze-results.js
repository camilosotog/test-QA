// Script para procesar el archivo de resultados ya generado
const fs = require('fs');
const path = require('path');

const resultsFile = 'newman-results-1762466128361.json';
const resultsPath = path.join(__dirname, resultsFile);



if (!fs.existsSync(resultsPath)) {
  console.error('❌ Archivo no encontrado:', resultsPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));


// Información general
const collection = data.collection || {};
const run = data.run || {};
const executions = run.executions || [];


// Contadores
let passed = 0, failed = 0, errors = 0;

executions.forEach((execution, index) => {
  const item = execution.item || {};
  const response = execution.response || {};
  const assertions = execution.assertions || [];
  
  let status = 'UNKNOWN';
  if (response.code >= 200 && response.code < 300) {
    status = 'PASS';
    passed++;
  } else if (response.code >= 400) {
    status = 'FAIL';
    failed++;
  } else {
    errors++;
  }
  
  // Verificar assertions
  const hasFailedAssertions = assertions.some(assertion => assertion.error);
  if (hasFailedAssertions) {
    status = 'FAIL (Assertion)';
    if (response.code >= 200 && response.code < 300) {
      passed--;
      failed++;
    }
  }
  
});


const successRate = executions.length > 0 ? (passed / executions.length * 100).toFixed(1) : 0;
