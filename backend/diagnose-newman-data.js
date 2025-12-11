// Script para diagnosticar problemas en el procesamiento de resultados
const fs = require('fs');
const path = require('path');

// Buscar archivos de Newman disponibles
const files = fs.readdirSync(__dirname).filter(f => f.startsWith('newman-results-') && f.endsWith('.json'));

if (files.length === 0) {
  process.exit(1);
}

const latestFile = files.sort().reverse()[0];
const resultsPath = path.join(__dirname, latestFile);


try {
  const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const executions = data.run?.executions || [];
  

  let problematicItems = [];

  for (let i = 0; i < executions.length; i++) {
    const execution = executions[i];
    const item = execution.item || {};
    const response = execution.response || {};
    const assertions = execution.assertions || [];

    
    // Verificar problemas potenciales
    const issues = [];
    
    // 1. Nombre muy largo
    if ((item.name || '').length > 255) {
      issues.push(`Nombre muy largo (${item.name.length} chars)`);
    }
    
    // 2. Descripción muy larga  
    if ((item.description || '').length > 1000) {
      issues.push(`Descripción muy larga (${item.description.length} chars)`);
    }
    
    // 3. Caracteres especiales problemáticos
    const problematicChars = /[^\x00-\x7F]/g;
    if (problematicChars.test(item.name || '')) {
      issues.push('Contiene caracteres no ASCII');
    }
    
    // 4. Assertions con datos muy largos
    if (assertions.length > 0) {
      assertions.forEach((assertion, j) => {
        if (assertion.error) {
          if ((assertion.error.message || '').length > 1000) {
            issues.push(`Assertion ${j + 1} con mensaje de error muy largo`);
          }
        }
      });
    }

    // 5. Response time inválido
    if (response.responseTime && (isNaN(response.responseTime) || response.responseTime < 0)) {
      issues.push('Response time inválido');
    }

    if (issues.length > 0) {
      issues.forEach(issue => console.log(`       - ${issue}`));
      problematicItems.push({ index: i + 1, name: item.name, issues });
    } else {
    }
  }

  if (problematicItems.length > 0) {
    problematicItems.slice(0, 5).forEach(item => {
    });
    
  }

} catch (error) {
  console.error('❌ Error analizando archivo:', error);
}