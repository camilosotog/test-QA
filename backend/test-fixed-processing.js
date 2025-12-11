// Script para procesar archivo Newman con el sistema arreglado
const fs = require('fs');
const path = require('path');

// Importar la función desde el controlador compilado
const { saveResultsToDatabase } = require('./dist/controllers/postman.controller.js');

async function processNewmanFile() {
  // Buscar archivo más reciente
  const files = fs.readdirSync(__dirname).filter(f => f.startsWith('newman-results-') && f.endsWith('.json'));
  
  if (files.length === 0) {
    return;
  }

  const latestFile = files.sort().reverse()[0];
  const resultsPath = path.join(__dirname, latestFile);

  try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    const savedResults = await saveResultsToDatabase(
      data, 
      'Oncredit Yamaha Pre', 
      'Pre-produccion'
    );
    
    if (savedResults.length === data.run?.executions?.length) {
    } else {
      console.warn(`⚠️ Solo se guardaron ${savedResults.length}/${data.run?.executions?.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Cerrar el proceso para que no quede colgado
  process.exit(0);
}

processNewmanFile();