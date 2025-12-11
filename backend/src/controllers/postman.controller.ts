import { pool } from "../config/db";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { io } from '../server';

const execAsync = promisify(exec);

// Versión actualizada con ejecución en segundo plano y fix para limit/offset

// Asegurar que las tablas existen
async function ensurePostmanTable() {
  // Tabla principal de requests
  await pool.query(`
    CREATE TABLE IF NOT EXISTS postman_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_name VARCHAR(255),
      description TEXT,
      status VARCHAR(50),
      http_code INT,
      response_time INT,
      response_body TEXT,
      collection_name VARCHAR(255),
      environment_name VARCHAR(255),
      request_id VARCHAR(255),
      execution_order INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Migración: Agregar columna response_body si no existe
  try {
    await pool.query(`
      ALTER TABLE postman_results 
      ADD COLUMN response_body TEXT NULL AFTER response_time;
    `);
  } catch (error: any) {
    // Ignorar error si la columna ya existe (código 1060)
    if (error.errno !== 1060) {
      console.error('Error agregando columna response_body:', error.message);
    }
  }

  // Tabla de assertions detalladas
  await pool.query(`
    CREATE TABLE IF NOT EXISTS postman_assertions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      postman_result_id INT,
      assertion_name VARCHAR(500),
      assertion_description TEXT,
      assertion_status VARCHAR(50), -- 'PASS', 'FAIL'
      error_message TEXT,
      expected_value TEXT,
      actual_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_postman_result_id (postman_result_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

export async function runPostmanCollection(req: any, res: any) {
  try {
    // Configurar timeout más largo para la respuesta HTTP
    req.setTimeout(600000); // 10 minutos
    res.setTimeout(600000); // 10 minutos
    
    await ensurePostmanTable();

    const { 
      collectionPath, 
      collectionUrl,
      collectionId,
      environmentPath, 
      environmentUrl,
      environmentId,
      collectionName, 
      environmentName,
      postmanApiKey
    } = req.body;

    let collection = collectionId || collectionUrl || collectionPath;
    let environment = environmentId || environmentUrl || environmentPath;

    if (!collection) {
      return res.status(400).json({ error: 'Collection ID, path or URL is required' });
    }

    const isUrl = (str: string) => str.startsWith('http://') || str.startsWith('https://');
    const isId = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const postmanIdRegex = /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str) || postmanIdRegex.test(str);
    };
    const isFilePath = (str: string) => !isUrl(str) && !isId(str);

    if (isFilePath(collection) && !fs.existsSync(collection)) {
      return res.status(400).json({ error: 'Collection file not found: ' + collection });
    }

    if (environment && isFilePath(environment) && !fs.existsSync(environment)) {
      return res.status(400).json({ error: 'Environment file not found: ' + environment });
    }

    if ((isId(collection) || isUrl(collection)) && !postmanApiKey) {
      return res.status(400).json({ error: 'Postman API Key is required when using Collection ID or URL' });
    }

    const timestamp = Date.now();
    const resultsPath = path.join(process.cwd(), `newman-results-${timestamp}.json`);

    let newmanCommand = `npx newman run "${collection}"`;
    if (environment) {
      newmanCommand += ` -e "${environment}"`;
    }
    
    if (postmanApiKey && (isId(collection) || isUrl(collection))) {
      newmanCommand += ` --postman-api-key "${postmanApiKey}"`;
    }
    
    // Opciones para manejar ECONNRESET y CONTINUAR con todos los requests
    newmanCommand += ` --delay-request 3000`; // 3 segundos entre requests
    newmanCommand += ` --timeout-request 60000`; // 60 segundos timeout por request
    newmanCommand += ` --timeout-script 60000`; // 60 segundos timeout para scripts
    newmanCommand += ` --suppress-exit-code`; // No fallar por assertions
    newmanCommand += ` --ignore-redirects`; // Ignorar redirects problemáticos
    newmanCommand += ` --disable-unicode`; // Evitar problemas de encoding
    newmanCommand += ` --insecure`; // Ignorar certificados SSL inválidos
    // NO usar --bail para que continúe con TODOS los requests aunque fallen algunos
    newmanCommand += ` -r json --reporter-json-export "${resultsPath}"`;

    let stdout, stderr;
    try {
      // Timeout dinámico basado en número estimado de requests
      const estimatedDuration = 48 * 3000 + 60000; // 48 requests * 3s delay + buffer
      
      const result = await execAsync(newmanCommand, {
        maxBuffer: 1024 * 1024 * 20, // 20MB buffer
        timeout: Math.max(estimatedDuration, 300000), // Mínimo 5 minutos
        killSignal: 'SIGTERM'
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError: any) {
      console.error('Newman execution error:', execError.message);
      console.error('Exit code:', execError.code);
      console.error('Signal:', execError.signal);
      
      // Newman puede "fallar" pero generar resultados exitosos cuando algunos requests fallan
      // Los códigos 0 y 1 son normales cuando hay requests que fallan pero otros pasan
      if ((execError.code === 1 || execError.code === 0 || execError.signal === 'SIGTERM') && fs.existsSync(resultsPath)) {
        stdout = execError.stdout || '';
        stderr = execError.stderr || '';
      } else if (fs.existsSync(resultsPath)) {
        // Si existe el archivo de resultados, considerarlo exitoso independientemente del exit code
        stdout = execError.stdout || '';
        stderr = execError.stderr || '';
      } else {
        throw new Error(`Newman failed completely: ${execError.stderr || execError.stdout || execError.message}`);
      }
    }

    if (stderr) {
      console.warn('Newman stderr:', stderr);
    }

    if (!fs.existsSync(resultsPath)) {
      console.error('❌ El archivo de resultados no fue creado');
      return res.status(500).json({ error: 'Results file was not created' });
    }

    const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Contar total de requests ejecutados
    const totalExecutions = resultsData.run?.executions?.length || 0;
    
    const savedResults = await saveResultsToDatabase(
      resultsData, 
      collectionName, 
      environmentName
    );

    fs.unlinkSync(resultsPath);

    const response = {
      message: `Postman collection executed successfully - ${totalExecutions} requests processed`,
      resultsCount: savedResults.length,
      totalExecutions: totalExecutions,
      results: savedResults,
      executionTime: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error ejecutando colección de Postman:', error);
    res.status(500).json({ 
      error: 'Error executing Postman collection', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function saveResultsToDatabase(data: any, collectionName?: string, environmentName?: string) {
  const savedResults = [];

  try {
    // Extraer información de la colección
    const collection = data.collection || {};
    const finalCollectionName = collectionName || collection.info?.name || 'Unknown Collection';
    const finalEnvironmentName = environmentName || 'Unknown Environment';

    const executions = data.run?.executions || [];
    const totalExecutions = executions.length;

    // 🔥 Emitir evento inicial de progreso
    const initialProgress = {
      current: 0,
      total: totalExecutions,
      percentage: 0,
      currentTest: 'Iniciando procesamiento...',
      status: 'processing'
    };
    io.emit('postman:progress', initialProgress);

    // Procesar cada ejecución
    for (let i = 0; i < executions.length; i++) {
      const execution = executions[i];
      const item = execution.item || {};
      const response = execution.response || {};
      
      // 🔥 Emitir progreso en tiempo real
      const progressData = {
        current: i + 1,
        total: totalExecutions,
        percentage: Math.round(((i + 1) / totalExecutions) * 100),
        currentTest: item.name || 'Procesando...',
        status: 'processing'
      };
      
      if (i === 0 || i === totalExecutions - 1 || i % 5 === 0) {
      }
      
      io.emit('postman:progress', progressData);

      // Determinar el estado del test
      let status = 'UNKNOWN';
      
      // Primero verificar si hay response
      if (!response || !response.code) {
        status = 'NO_RESPONSE';
      } else if (response.code >= 200 && response.code < 300) {
        status = 'PASS';
      } else if (response.code >= 400) {
        status = 'FAIL';
      } else if (response.code >= 300 && response.code < 400) {
        status = 'REDIRECT';
      }

      // Verificar si hay assertions que fallaron
      const assertions = execution.assertions || [];
      const hasFailedAssertions = assertions.some((assertion: any) => assertion.error);
      if (hasFailedAssertions) {
        status = 'FAIL';
      } else if (assertions.length > 0) {
        console.log(`✅ ${assertions.length} assertions - todas pasaron`);
      }

      // Generar un ID único para este request
      const requestId = `${item.id || item.name}_${i}`;

      // Capturar response body si existe
      let responseBody = null;
      if (response && response.stream) {
        try {
          // El response body puede estar en diferentes formatos
          if (typeof response.stream === 'string') {
            responseBody = response.stream;
          } else if (Buffer.isBuffer(response.stream)) {
            responseBody = response.stream.toString('utf8');
          } else if (response.stream.type === 'Buffer' && Array.isArray(response.stream.data)) {
            responseBody = Buffer.from(response.stream.data).toString('utf8');
          }
          
          // Limitar tamaño del response body (máximo 64KB para TEXT)
          if (responseBody && responseBody.length > 65000) {
            responseBody = responseBody.substring(0, 65000) + '... [truncated]';
          }
        } catch (bodyError) {
          console.log(`⚠️ Error procesando response body: ${bodyError}`);
        }
      }

      const testResult = {
        test_name: item.name || 'Unnamed Test',
        description: item.description || null,
        status: status,
        http_code: response.code || null,
        response_time: response.responseTime || null,
        response_body: responseBody,
        collection_name: finalCollectionName,
        environment_name: finalEnvironmentName,
        request_id: requestId,
        execution_order: i + 1
      };

      try {
        // Insertar en base de datos
        const query = `
          INSERT INTO postman_results 
          (test_name, description, status, http_code, response_time, response_body, collection_name, environment_name, request_id, execution_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
          testResult.test_name,
          testResult.description,
          testResult.status,
          testResult.http_code,
          testResult.response_time,
          testResult.response_body,
          testResult.collection_name,
          testResult.environment_name,
          testResult.request_id,
          testResult.execution_order
        ]);

        const insertedId = (result as any).insertId;
        savedResults.push({ id: insertedId, ...testResult });

        // Procesar y guardar assertions individuales
        if (assertions.length > 0) {
          try {
            await saveAssertions(insertedId, assertions);
          } catch (assertionError) {
            console.error(`      ⚠️ Error guardando assertions (continuando):`, assertionError);
          }
        }

      } catch (dbError: any) {
        console.error(`      ❌ Error guardando request ${i + 1} "${item.name}":`, dbError.message || dbError);
        console.error(`      📊 Test data:`, JSON.stringify(testResult, null, 2));
        
        // Verificar si el error es por datos demasiado largos
        if (dbError.message?.includes('Data too long')) {
          console.error(`      🔧 Intentando guardar con datos truncados...`);
          try {
            // Truncar campos que pueden ser muy largos
            const truncatedResult = {
              ...testResult,
              test_name: testResult.test_name?.substring(0, 250) || 'Unnamed Test',
              description: testResult.description?.substring(0, 500) || null,
              response_body: testResult.response_body?.substring(0, 65000) || null
            };
            
            const truncateQuery = `
              INSERT INTO postman_results 
              (test_name, description, status, http_code, response_time, response_body, collection_name, environment_name, request_id, execution_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.execute(truncateQuery, [
              truncatedResult.test_name,
              truncatedResult.description,
              truncatedResult.status,
              truncatedResult.http_code,
              truncatedResult.response_time,
              truncatedResult.response_body,
              truncatedResult.collection_name,
              truncatedResult.environment_name,
              truncatedResult.request_id,
              truncatedResult.execution_order
            ]);
            
            const insertedId = (result as any).insertId;
            savedResults.push({ id: insertedId, ...truncatedResult });
          } catch (truncateError) {
            console.error(`      ❌ Falló incluso con datos truncados:`, truncateError);
          }
        }
        // Continuar con el siguiente aunque falle uno
      }
    }

    if (savedResults.length < totalExecutions) {
      console.warn(`⚠️ ADVERTENCIA: Solo se guardaron ${savedResults.length} de ${totalExecutions} ejecuciones`);
    }

    // 🔥 Emitir evento de completado
    const completedProgress = {
      current: totalExecutions,
      total: totalExecutions,
      percentage: 100,
      currentTest: 'Completado',
      status: 'completed',
      savedCount: savedResults.length
    };
    io.emit('postman:progress', completedProgress);

    return savedResults;

  } catch (error) {
    console.error('❌ Error crítico guardando resultados:', error);
    throw error;
  }
}

// Función para guardar assertions individuales
async function saveAssertions(postmanResultId: number, assertions: any[]) {
  for (let j = 0; j < assertions.length; j++) {
    const assertion = assertions[j];
    
    // Extraer información de la assertion
    const assertionName = assertion.assertion || `Test ${j + 1}`;
    const assertionStatus = assertion.error ? 'FAIL' : 'PASS';
    const errorMessage = assertion.error ? assertion.error.message : null;
    const errorTest = assertion.error ? assertion.error.test : null;
    
    if (assertion.error) {
      console.log(`Error: ${errorMessage}`);
    }

    try {
      const assertionQuery = `
        INSERT INTO postman_assertions 
        (postman_result_id, assertion_name, assertion_description, assertion_status, error_message, expected_value, actual_value)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      // Truncar valores que pueden ser muy largos
      const truncatedData = [
        postmanResultId,
        (assertionName || '').substring(0, 500),
        (errorTest || '').substring(0, 1000),
        assertionStatus,
        (errorMessage || '').substring(0, 1000),
        (assertion.error ? String(assertion.error.expected || '').substring(0, 1000) : null),
        (assertion.error ? String(assertion.error.actual || '').substring(0, 1000) : null)
      ];

      await pool.execute(assertionQuery, truncatedData);

    } catch (assertionError: any) {
      console.error(`❌ Error guardando assertion ${j + 1} "${assertionName}":`, assertionError.message || assertionError);
      // Continuar con las siguientes assertions aunque falle una
    }
  }
}

export async function getPostmanResults(req: any, res: any) {
  try {
    await ensurePostmanTable();

    const { 
      collection_name, 
      environment_name, 
      status, 
      limit = 100, 
      offset = 0 
    } = req.query;

    // Convertir limit y offset a números enteros válidos
    const limitNum = Math.max(1, Math.min(1000, parseInt(String(limit)) || 100));
    const offsetNum = Math.max(0, parseInt(String(offset)) || 0);

    let query = 'SELECT * FROM postman_results WHERE 1=1';
    const params: any[] = [];

    if (collection_name) {
      query += ' AND collection_name = ?';
      params.push(collection_name);
    }

    if (environment_name) {
      query += ' AND environment_name = ?';
      params.push(environment_name);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // IMPORTANT: No usar placeholders para LIMIT/OFFSET con mysql2
    // Construir directamente con valores numéricos validados (ya sanitizados arriba)
    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [rows] = await pool.execute(query, params);

    res.json(rows);

  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({ error: 'Error fetching results' });
  }
}

// Nueva función para obtener resultados con assertions detalladas
export async function getPostmanResultsWithAssertions(req: any, res: any) {
  try {
    await ensurePostmanTable();

    const { 
      collection_name, 
      environment_name, 
      status, 
      limit = 100, 
      offset = 0 
    } = req.query;

    // Convertir limit y offset a números enteros válidos
    const limitNum = Math.max(1, Math.min(1000, parseInt(String(limit)) || 100));
    const offsetNum = Math.max(0, parseInt(String(offset)) || 0);

    let query = `
      SELECT 
        pr.*,
        COUNT(pa.id) as total_assertions,
        COUNT(CASE WHEN pa.assertion_status = 'PASS' THEN 1 END) as passed_assertions,
        COUNT(CASE WHEN pa.assertion_status = 'FAIL' THEN 1 END) as failed_assertions
      FROM postman_results pr
      LEFT JOIN postman_assertions pa ON pr.id = pa.postman_result_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (collection_name) {
      query += ' AND pr.collection_name = ?';
      params.push(collection_name);
    }

    if (environment_name) {
      query += ' AND pr.environment_name = ?';
      params.push(environment_name);
    }

    if (status) {
      query += ' AND pr.status = ?';
      params.push(status);
    }

    // IMPORTANT: No usar placeholders para LIMIT/OFFSET con mysql2
    query += ` GROUP BY pr.id ORDER BY pr.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [results] = await pool.execute(query, params);

    // Para cada resultado, obtener las assertions individuales
    const resultsWithAssertions = await Promise.all(
      (results as any[]).map(async (result) => {
        const assertionsQuery = `
          SELECT * FROM postman_assertions 
          WHERE postman_result_id = ? 
          ORDER BY id
        `;
        const [assertions] = await pool.execute(assertionsQuery, [result.id]);
        
        return {
          ...result,
          assertions: assertions
        };
      })
    );

    res.json(resultsWithAssertions);

  } catch (error) {
    console.error('Error obteniendo resultados con assertions:', error);
    res.status(500).json({ error: 'Error fetching detailed results' });
  }
}

export async function deletePostmanResults(req: any, res: any) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM postman_results WHERE id IN (${placeholders})`;

    const [result] = await pool.execute(query, ids);

    res.json({
      message: 'Results deleted successfully',
      deletedCount: (result as any).affectedRows
    });

  } catch (error) {
    console.error('Error eliminando resultados:', error);
    res.status(500).json({ error: 'Error deleting results' });
  }
}

// Función para obtener pruebas de contrato por proyecto
export async function getContractTestResults(req: any, res: any) {
  try {
    await ensurePostmanTable();

    const { projectName } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required in request body' });
    }

    // Buscar las variables de entorno del proyecto
    const projectNameUpper = projectName.toUpperCase();
    const collectionName = process.env[`COLLECTION_NAME_${projectNameUpper}`];
    const environmentName = process.env[`ENVIRONMENT_NAME_${projectNameUpper}`];

    // Si no existe configuración para este proyecto, devolver vacío
    if (!collectionName) {
      return res.json({
        projectName,
        collectionName: null,
        environmentName: null,
        totalTests: 0,
        results: [],
        message: `No configuration found for project: ${projectName}. Expected environment variable: COLLECTION_NAME_${projectNameUpper}`
      });
    }

    // Query para obtener pruebas de contrato - SIEMPRE filtrar por collection_name
    const query = `
      SELECT 
        pr.id,
        pr.test_name,
        pr.status,
        pr.response_time,
        pr.http_code,
        pr.response_body,
        pr.created_at,
        pa.assertion_name,
        pa.assertion_status,
        pa.error_message
      FROM postman_results pr
      INNER JOIN postman_assertions pa ON pr.id = pa.postman_result_id
      WHERE pa.assertion_name LIKE '%Contrato%'
        AND pr.collection_name = ?
      ORDER BY pr.created_at DESC, pr.id
    `;

    const params: any[] = [collectionName];

    const [rows] = await pool.execute(query, params);

    // Agrupar por test_name para consolidar resultados
    const resultsMap = new Map();
    
    (rows as any[]).forEach((row: any) => {
      const key = row.id;
      if (!resultsMap.has(key)) {
        resultsMap.set(key, {
          id: row.id,
          test_name: row.test_name,
          status: row.status,
          response_time: row.response_time,
          http_code: row.http_code,
          response_body: row.response_body,
          created_at: row.created_at,
          contract_assertions: []
        });
      }
      
      resultsMap.get(key).contract_assertions.push({
        assertion_name: row.assertion_name,
        assertion_status: row.assertion_status,
        error_message: row.error_message
      });
    });

    const results = Array.from(resultsMap.values());

    res.json({
      projectName,
      collectionName: collectionName || 'Unknown',
      environmentName: environmentName || 'Unknown',
      totalTests: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error obteniendo pruebas de contrato:', error);
    res.status(500).json({ 
      error: 'Error fetching contract test results',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Función para obtener pruebas de respuesta (todas las que no sean de contrato)
export async function getResponseTestResults(req: any, res: any) {
  try {
    await ensurePostmanTable();

    const { projectName } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required in request body' });
    }

    // Buscar las variables de entorno del proyecto
    const projectNameUpper = projectName.toUpperCase();
    const collectionName = process.env[`COLLECTION_NAME_${projectNameUpper}`];
    const environmentName = process.env[`ENVIRONMENT_NAME_${projectNameUpper}`];

    // Si no existe configuración para este proyecto, devolver vacío
    if (!collectionName) {
      return res.json({
        projectName,
        collectionName: null,
        environmentName: null,
        totalTests: 0,
        results: [],
        message: `No configuration found for project: ${projectName}. Expected environment variable: COLLECTION_NAME_${projectNameUpper}`
      });
    }

    // Query para obtener pruebas que NO sean de contrato NI respuesta controlada - SIEMPRE filtrar por collection_name
    const query = `
      SELECT 
        pr.id,
        pr.test_name,
        pr.status,
        pr.response_time,
        pr.http_code,
        pr.response_body,
        pr.created_at,
        pa.assertion_name,
        pa.assertion_status,
        pa.error_message
      FROM postman_results pr
      INNER JOIN postman_assertions pa ON pr.id = pa.postman_result_id
      WHERE pa.assertion_name NOT LIKE '%Contrato%'
        AND pa.assertion_name NOT LIKE '%Respuesta controlada%'
        AND pr.collection_name = ?
      ORDER BY pr.created_at DESC, pr.id
    `;

    const params: any[] = [collectionName];

    const [rows] = await pool.execute(query, params);

    // Agrupar por test_name
    const resultsMap = new Map();
    
    (rows as any[]).forEach((row: any) => {
      const key = row.id;
      if (!resultsMap.has(key)) {
        resultsMap.set(key, {
          id: row.id,
          test_name: row.test_name,
          status: row.status,
          response_time: row.response_time,
          http_code: row.http_code,
          response_body: row.response_body,
          created_at: row.created_at,
          response_assertions: []
        });
      }
      
      resultsMap.get(key).response_assertions.push({
        assertion_name: row.assertion_name,
        assertion_status: row.assertion_status,
        error_message: row.error_message
      });
    });

    const results = Array.from(resultsMap.values());

    res.json({
      projectName,
      collectionName: collectionName || 'Unknown',
      environmentName: environmentName || 'Unknown',
      totalTests: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error obteniendo pruebas de respuesta:', error);
    res.status(500).json({ 
      error: 'Error fetching response test results',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Función para obtener pruebas de "Respuesta controlada" por proyecto
export async function getControlledResponseTestResults(req: any, res: any) {
  try {
    await ensurePostmanTable();

    const { projectName } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required in request body' });
    }

    // Buscar las variables de entorno del proyecto
    const projectNameUpper = projectName.toUpperCase();
    const collectionName = process.env[`COLLECTION_NAME_${projectNameUpper}`];
    const environmentName = process.env[`ENVIRONMENT_NAME_${projectNameUpper}`];

    // Si no existe configuración para este proyecto, devolver vacío
    if (!collectionName) {
      return res.json({
        projectName,
        collectionName: null,
        environmentName: null,
        totalTests: 0,
        results: [],
        message: `No configuration found for project: ${projectName}. Expected environment variable: COLLECTION_NAME_${projectNameUpper}`
      });
    }

    // Query para obtener pruebas de respuesta controlada - SIEMPRE filtrar por collection_name
    const query = `
      SELECT 
        pr.id,
        pr.test_name,
        pr.status,
        pr.response_time,
        pr.http_code,
        pr.response_body,
        pr.created_at,
        pa.assertion_name,
        pa.assertion_status,
        pa.error_message
      FROM postman_results pr
      INNER JOIN postman_assertions pa ON pr.id = pa.postman_result_id
      WHERE pa.assertion_name LIKE '%Respuesta controlada%'
        AND pr.collection_name = ?
      ORDER BY pr.created_at DESC, pr.id
    `;

    const params: any[] = [collectionName];

    const [rows] = await pool.execute(query, params);

    // Agrupar por test_name para consolidar resultados
    const resultsMap = new Map();
    
    (rows as any[]).forEach((row: any) => {
      const key = row.id;
      if (!resultsMap.has(key)) {
        resultsMap.set(key, {
          id: row.id,
          test_name: row.test_name,
          status: row.status,
          response_time: row.response_time,
          http_code: row.http_code,
          response_body: row.response_body,
          created_at: row.created_at,
          controlled_response_assertions: []
        });
      }
      
      resultsMap.get(key).controlled_response_assertions.push({
        assertion_name: row.assertion_name,
        assertion_status: row.assertion_status,
        error_message: row.error_message
      });
    });

    const results = Array.from(resultsMap.values());

    res.json({
      projectName,
      collectionName: collectionName || 'Unknown',
      environmentName: environmentName || 'Unknown',
      totalTests: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error obteniendo pruebas de respuesta controlada:', error);
    res.status(500).json({ 
      error: 'Error fetching controlled response test results',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Función específica para ejecutar desde URL de Postman
export async function runPostmanFromUrl(req: any, res: any) {
  try {
    // Configurar timeout más largo para la respuesta HTTP
    req.setTimeout(600000); // 10 minutos
    res.setTimeout(600000); // 10 minutos
    
    await ensurePostmanTable();

    const { 
      collectionUrl,
      collectionId,
      environmentUrl,
      environmentId,
      collectionName, 
      environmentName,
      postmanApiKey
    } = req.body;

    const collection = collectionId || collectionUrl;
    const environment = environmentId || environmentUrl;

    if (!collection) {
      return res.status(400).json({ error: 'Collection ID or URL is required' });
    }

    if (!postmanApiKey) {
      return res.status(400).json({ error: 'Postman API Key is required' });
    }

    // Crear nombre único para el archivo de resultados
    const timestamp = Date.now();
    const resultsPath = path.join(process.cwd(), `newman-results-${timestamp}.json`);

    // Construir comando Newman con protección ECONNRESET
    let newmanCommand = `npx newman run "${collection}"`;
    if (environment) {
      newmanCommand += ` -e "${environment}"`;
    }
    
    // Agregar API Key si se proporciona
    if (postmanApiKey) {
      newmanCommand += ` --postman-api-key "${postmanApiKey}"`;
    }
    
    // Opciones para manejar ECONNRESET y CONTINUAR con todos los requests
    newmanCommand += ` --delay-request 3000`; // 3 segundos entre requests
    newmanCommand += ` --timeout-request 60000`; // 60 segundos timeout por request
    newmanCommand += ` --timeout-script 60000`; // 60 segundos timeout para scripts
    newmanCommand += ` --suppress-exit-code`; // No fallar por assertions
    newmanCommand += ` --ignore-redirects`; // Ignorar redirects problemáticos
    newmanCommand += ` --disable-unicode`; // Evitar problemas de encoding
    newmanCommand += ` --insecure`; // Ignorar certificados SSL inválidos
    // NO usar --bail para que continúe con TODOS los requests aunque fallen algunos
    newmanCommand += ` -r json --reporter-json-export "${resultsPath}"`;

    let stdout, stderr;
    try {
      // Timeout dinámico basado en número estimado de requests
      const estimatedDuration = 48 * 3000 + 60000; // 48 requests * 3s delay + buffer
      
      const result = await execAsync(newmanCommand, {
        maxBuffer: 1024 * 1024 * 20, // 20MB buffer
        timeout: Math.max(estimatedDuration, 300000), // Mínimo 5 minutos
        killSignal: 'SIGTERM'
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError: any) {
      console.error('Newman execution error:', execError.message);
      console.error('Exit code:', execError.code);
      console.error('Signal:', execError.signal);
      
      // Newman puede "fallar" pero generar resultados exitosos
      if ((execError.code === 1 || execError.signal === 'SIGTERM') && fs.existsSync(resultsPath)) {
        stdout = execError.stdout || '';
        stderr = execError.stderr || '';
      } else {
        throw new Error(`Newman falló completamente: ${execError.stderr || execError.stdout || execError.message}`);
      }
    }

    if (stderr && !stderr.includes('newman')) {
      console.error('Newman stderr:', stderr);
    }

    // Leer resultados
    if (!fs.existsSync(resultsPath)) {
      console.error('❌ El archivo de resultados no fue creado');
      return res.status(500).json({ error: 'Results file was not created' });
    }

    const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Procesar y guardar resultados
    const savedResults = await saveResultsToDatabase(
      resultsData, 
      collectionName, 
      environmentName
    );

    // Limpiar archivo temporal
    fs.unlinkSync(resultsPath);

    const response = {
      message: 'Postman collection from URL executed successfully',
      resultsCount: savedResults.length,
      results: savedResults,
      collectionUrl: collectionUrl,
      executionTime: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error ejecutando colección desde URL:', error);
    res.status(500).json({ 
      error: 'Error executing Postman collection from URL', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function runPostmanWithRetry(req: any, res: any) {
  try {
    await ensurePostmanTable();

    const { 
      projectName,
      maxRetries = 2
    } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'Project Name is required' });
    }

    // Construir los nombres de las variables de entorno basándose en el nombre del proyecto
    const projectNameUpper = projectName.toUpperCase().replace(/\s+/g, '');
    
    const collectionId = process.env[`COLLECTION_ID_${projectNameUpper}`];
    const postmanApiKey = process.env[`API_KEY_${projectNameUpper}`] || process.env.POSTMAN_API_KEY;
    const environmentId = process.env[`ENVIRONMENT_ID_${projectNameUpper}`];
    const collectionName = process.env[`COLLECTION_NAME_${projectNameUpper}`];
    const environmentName = process.env[`ENVIRONMENT_NAME_${projectNameUpper}`];

    if (!collectionId) {
      return res.status(400).json({ 
        error: `Collection ID not found for project: ${projectName}`,
        detail: `Expected environment variable: COLLECTION_ID_${projectNameUpper}`
      });
    }

    if (!postmanApiKey) {
      return res.status(400).json({ error: 'Postman API Key is required (POSTMAN_API_KEY)' });
    }

    const timestamp = Date.now();
    const resultsPath = path.join(process.cwd(), `newman-results-${timestamp}.json`);

    // Comando Newman optimizado con configuración robusta
    let newmanCommand = `npx newman run "${collectionId}"`;
    
    if (environmentId) {
      newmanCommand += ` -e "${environmentId}"`;
    }
    
    newmanCommand += ` --postman-api-key "${postmanApiKey}"`;
    newmanCommand += ` --delay-request 3000`; // 3 segundos entre requests (aumentado)
    newmanCommand += ` --timeout-request 180000`; // 3 minutos por request (aumentado)
    newmanCommand += ` --timeout-script 180000`; // 3 minutos timeout para scripts
    newmanCommand += ` --suppress-exit-code`; // No fallar por assertions
    newmanCommand += ` --ignore-redirects`; // Ignorar redirects problemáticos
    newmanCommand += ` --disable-unicode`; // Evitar problemas de encoding
    newmanCommand += ` --insecure`; // Ignorar certificados SSL inválidos
    // Removidos --silent y --reporter-no-assert para ver errores completos
    // NO usar --bail para que continúe con TODOS los requests aunque fallen algunos
    newmanCommand += ` -r json --reporter-json-export "${resultsPath}"`;

    // 🔥 EMITIR EVENTO INICIAL DE EJECUCIÓN
    const startProgress = {
      current: 0,
      total: 0, // Se actualizará cuando Newman termine
      percentage: 0,
      currentTest: 'Newman ejecutándose... (esto puede tardar varios minutos)',
      status: 'newman_running'
    };
    io.emit('postman:progress', startProgress);

    // ⭐ RESPONDER INMEDIATAMENTE - No esperar a que termine Newman
    res.json({
      message: `Newman execution started for project: ${projectName}`,
      projectName: projectName,
      collectionName: collectionName || `Collection_${projectName}`,
      environmentName: environmentName || `Environment_${projectName}`,
      status: 'RUNNING',
      resultsFile: resultsPath,
      estimatedRequests: 48,
      estimatedTime: '15-20 minutes (3s delay per request)',
      configuration: {
        delayBetweenRequests: '3 seconds',
        timeoutPerRequest: '3 minutes',
        maxRetries: maxRetries
      },
      note: 'Results will be saved to database when execution completes. Check /api/postman/results endpoint later.',
      checkProgress: 'Monitor server logs for real-time progress updates',
      startedAt: new Date().toISOString()
    });

    // ⭐ EJECUTAR NEWMAN EN SEGUNDO PLANO (después de responder)
    executeNewmanInBackground(newmanCommand, resultsPath, collectionName, environmentName, maxRetries);

  } catch (error) {
    console.error('❌ Error iniciando colección:', error);
    res.status(500).json({ 
      error: 'Error starting Postman collection', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// ⭐ NUEVA FUNCIÓN: Ejecutar Newman en segundo plano
async function executeNewmanInBackground(
  newmanCommand: string, 
  resultsPath: string, 
  collectionName?: string, 
  environmentName?: string,
  maxRetries: number = 2
) {
  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    attempt++;

    try {
      const { stdout, stderr } = await execAsync(newmanCommand, {
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer (aumentado)
        timeout: 900000, // 15 minutos (aumentado)
        killSignal: 'SIGTERM',
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' } // Más memoria
      });

      // Verificar si existe el archivo
      if (!fs.existsSync(resultsPath)) {
        console.error('❌ [Background] Archivo no encontrado:', resultsPath);
        throw new Error('Results file not created');
      }

      const fileStats = fs.statSync(resultsPath);

      if (fileStats.size === 0) {
        console.error('❌ [Background] Archivo vacío');
        throw new Error('Results file is empty');
      }

      // Leer y procesar resultados con manejo de errores robusto
      let resultsData;
      try {
        const rawData = fs.readFileSync(resultsPath, 'utf8');
        resultsData = JSON.parse(rawData);
      } catch (parseError) {
        console.error('❌ [Background] Error parsing JSON:', parseError);
        throw new Error('Failed to parse results JSON');
      }
      
      const totalExecutions = resultsData.run?.executions?.length || 0;

      if (totalExecutions === 0) {
        console.warn('⚠️ [Background] No se encontraron ejecuciones en el archivo');
        throw new Error('No executions found in results');
      }

      const savedResults = await saveResultsToDatabase(
        resultsData, 
        collectionName, 
        environmentName
      );

      if (savedResults.length < totalExecutions) {
        console.warn(`⚠️ [Background] Solo se guardaron ${savedResults.length} de ${totalExecutions} requests`);
      }

      // Limpiar archivo temporal
      try {
        fs.unlinkSync(resultsPath);
      } catch (unlinkError) {
        console.warn('⚠️ [Background] No se pudo eliminar archivo temporal:', unlinkError);
      }

      return; // Éxito - salir del loop

    } catch (error: any) {
      lastError = error;
      console.error(`❌ [Background] Intento ${attempt} falló:`, error.message);
      console.error(`❌ [Background] Error completo:`, error);

      // Si el archivo existe aunque haya error, intentar procesarlo
      if (fs.existsSync(resultsPath)) {
        try {
          const fileStats = fs.statSync(resultsPath);
          
          if (fileStats.size > 0) {
            const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            const totalExecutions = resultsData.run?.executions?.length || 0;
            
            if (totalExecutions > 0) {
              const savedResults = await saveResultsToDatabase(resultsData, collectionName, environmentName);
              fs.unlinkSync(resultsPath);
              return;
            }
          }
        } catch (parseError) {
          console.error('❌ [Background] No se pudo procesar archivo parcial:', parseError);
        }
      }

      if (attempt <= maxRetries) {
        const waitTime = attempt * 5000; // Aumentar tiempo de espera
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error('❌ [Background] Todos los intentos fallaron:', lastError?.message);
  console.error('❌ [Background] Proceso terminado sin éxito a las', new Date().toISOString());
}

export async function testLongRequest(req: any, res: any) {
  try {
    // Configurar timeouts para requests largos
    req.setTimeout(600000); // 10 minutos
    res.setTimeout(600000); // 10 minutos

    // Simular una operación que toma tiempo (30 segundos)
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    res.json({
      message: 'Long request test completed successfully',
      duration: '30 seconds',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en test largo:', error);
    res.status(500).json({ 
      error: 'Error in long request test', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Función para probar Newman con comando básico
export async function testNewman(req: any, res: any) {
  try {
    const { collectionId, postmanApiKey } = req.body;
    
    // Comando básico para probar Newman
    let testCommand = 'npx newman --version';
    
    const versionResult = await execAsync(testCommand);
    
    if (collectionId && postmanApiKey) {
      // Probar comando completo
      testCommand = `npx newman run "${collectionId}" --postman-api-key "${postmanApiKey}" --disable-unicode`;
      
      const result = await execAsync(testCommand);
    }
    
    res.json({
      message: 'Newman test completed',
      version: versionResult.stdout.trim(),
      collectionTest: collectionId ? 'Executed' : 'Skipped - no collection provided'
    });
    
  } catch (error) {
    console.error('Newman test failed:', error);
    res.status(500).json({ 
      error: 'Newman test failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Función de ejemplo para procesar un archivo JSON de resultados existente
export async function processExistingResults(req: any, res: any) {
  try {
    await ensurePostmanTable();

    const { filePath, collectionName, environmentName } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'Results file not found' });
    }

    // Leer archivo de resultados
    const resultsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Procesar y guardar resultados
    const savedResults = await saveResultsToDatabase(
      resultsData, 
      collectionName, 
      environmentName
    );

    res.json({
      message: 'Results processed successfully',
      resultsCount: savedResults.length,
      results: savedResults
    });

  } catch (error) {
    console.error('Error procesando resultados:', error);
    res.status(500).json({ 
      error: 'Error processing results', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
