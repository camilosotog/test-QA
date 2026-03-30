"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestResult = exports.deleteTestExecution = exports.deleteEvidence = exports.recalculateAllExecutionStatuses = exports.reopenTestExecution = exports.completeTestExecution = exports.saveTestResult = exports.getTestExecution = exports.getTestExecutionMonths = exports.getTestExecutions = exports.createTestExecution = void 0;
const db_1 = require("../config/db");
const s3_1 = require("../config/s3");
// ============================================
// 🎬 TEST EXECUTIONS CONTROLLER
// ============================================
let tableEnsured = false;
/**
 * 🔧 HELPER: Asegurar que existen las tablas necesarias
 */
async function ensureTables() {
    if (tableEnsured)
        return;
    try {
        // Crear tabla sprints si no existe
        await db_1.db.query(`
      CREATE TABLE IF NOT EXISTS sprints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NULL,
        start_date TIMESTAMP NULL,
        finish_date TIMESTAMP NULL,
        returns INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // Crear tabla boards si no existe
        await db_1.db.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id INT NOT NULL,
        test_cases INT NULL,
        developer_id INT NULL,
        state VARCHAR(50) DEFAULT 'Sin iniciar',
        sprint_id INT NULL,
        sprint_prev TINYINT(1) NULL,
        returns INT DEFAULT 0,
        return_date DATE NULL,
        automated_cases INT DEFAULT 0,
        in_testing_age TIMESTAMP NULL,
        estimate DECIMAL(10,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        tableEnsured = true;
    }
    catch (error) {
        console.error('❌ Error en ensureTables:', error);
        throw error;
    }
}
/**
 * 🔧 HELPER: Obtiene o crea el sprint del mes actual
 * Patrón: Mes-Año (ej: Noviembre-2025 = Sprint 20, Diciembre-2025 = Sprint 21, etc)
 * Búsqueda: Busca sprint que CONTENGA el nombre del mes (case-insensitive)
 */
async function getCurrentOrCreateSprint() {
    try {
        const now = new Date();
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const monthName = monthNames[now.getMonth()];
        const year = now.getFullYear();
        const sprintNameExact = `${monthName}-${year}`;
        // Buscar sprint existente que contenga el nombre del mes (LIKE)
        const [existingSprint] = await db_1.db.query('SELECT id FROM sprints WHERE LOWER(name) LIKE LOWER(?) ORDER BY id DESC LIMIT 1', [`%${monthName}%`]);
        if (existingSprint && existingSprint.length > 0) {
            return existingSprint[0].id;
        }
        // Si no existe, crearlo con el formato exacto
        const [result] = await db_1.db.query('INSERT INTO sprints (name, start_date, finish_date) VALUES (?, NOW(), NULL)', [sprintNameExact]);
        return result.insertId;
    }
    catch (error) {
        console.error('❌ Error en getCurrentOrCreateSprint:', error);
        throw error;
    }
}
/**
 * 🔧 HELPER: Obtiene el nombre del usuario autenticado
 */
async function getUserName(userId) {
    try {
        const [user] = await db_1.db.query('SELECT name FROM users WHERE id = ?', [userId]);
        return user && user.length > 0 ? user[0].name : 'Sin Asignar';
    }
    catch (error) {
        console.error('❌ Error en getUserName:', error);
        return 'Sin Asignar';
    }
}
/**
 * 🔧 HELPER: Cuenta casos automatizados en una suite
 */
async function countAutomatedCases(suiteId) {
    try {
        const [result] = await db_1.db.query(`SELECT COUNT(*) as total FROM test_cases 
       WHERE test_suite_id = ? AND automation_status = 'automated'`, [suiteId]);
        return result[0]?.total || 0;
    }
    catch (error) {
        console.error('❌ Error en countAutomatedCases:', error);
        return 0;
    }
}
/**
 * 🔧 HELPER: Crea un registro automático en la tabla boards
 */
async function createBoardFromExecution(suiteName, suiteId, totalCases, automatedCases, executorId, sprintId) {
    try {
        const userName = await getUserName(executorId);
        const [result] = await db_1.db.query(`INSERT INTO boards 
       (name, owner_id, developer_id, test_cases, state, sprint_id, 
        returns, return_date, automated_cases, in_testing_age, estimate, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, NOW(), ?, NOW(), NOW())`, [
            suiteName, // name
            executorId, // owner_id (quien crea la ejecución)
            executorId, // developer_id (quien ejecuta)
            totalCases, // test_cases
            'En pruebas', // state
            sprintId, // sprint_id (sprint del mes actual)
            0, // returns (0 por defecto)
            automatedCases, // automated_cases
            0 // estimate (0 por ahora)
        ]);
    }
    catch (error) {
        console.error('❌ Error en createBoardFromExecution:', error);
        throw error;
    }
}
/**
 * Crea una nueva ejecución de suite Y automáticamente un registro en boards
 */
const createTestExecution = async (req, res) => {
    const { test_suite_id, executed_by_id } = req.body;
    // Usar el ID del usuario autenticado, o ID del body si se proporciona, o ID 14 (Sin Asignar) por defecto
    const executed_by = executed_by_id || req.user?.id || 14;
    if (!test_suite_id) {
        return res.status(400).json({ error: 'test_suite_id is required' });
    }
    try {
        // ✅ ASEGURAR QUE EXISTEN LAS TABLAS
        await ensureTables();
        // Obtener el test_project_id y nombre de la suite
        const [suiteData] = await db_1.db.query('SELECT test_project_id, name FROM test_suites WHERE id = ?', [test_suite_id]);
        if (!suiteData || suiteData.length === 0) {
            return res.status(404).json({ error: 'Suite not found' });
        }
        const test_project_id = suiteData[0].test_project_id;
        const suite_name = suiteData[0].name;
        // Obtener cantidad de casos en la suite
        const [cases] = await db_1.db.query('SELECT COUNT(*) as total FROM test_cases WHERE test_suite_id = ?', [test_suite_id]);
        const total_cases = cases[0]?.total || 0;
        // Nombre de la ejecución: nombre de suite + timestamp
        const execution_name = `${suite_name} - ${new Date().toLocaleString('es-CO')}`;
        // Crear ejecución con todos los campos requeridos
        const [result] = await db_1.db.query(`INSERT INTO test_executions 
       (test_project_id, test_suite_id, execution_name, execution_status, executed_by, status, total_cases, start_date, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`, [test_project_id, test_suite_id, execution_name, 'in_progress', executed_by, 'in_progress', total_cases]);
        // ============================================
        // 🔄 NUEVA FUNCIONALIDAD: CREAR BOARD AUTOMÁTICAMENTE
        // ============================================
        try {
            // Obtener sprint del mes actual (o crear si no existe)
            const sprintId = await getCurrentOrCreateSprint();
            // Contar casos automatizados
            const automatedCases = await countAutomatedCases(test_suite_id);
            // Crear registro en boards
            await createBoardFromExecution(suite_name, test_suite_id, total_cases, automatedCases, executed_by, sprintId);
        }
        catch (boardError) {
            console.error('❌ ERROR CREANDO BOARD:', boardError);
            // Continuamos - el error no debe bloquear la creación de la ejecución
        }
        res.status(201).json({
            id: result.insertId,
            test_project_id,
            test_suite_id,
            execution_name,
            executor_id: executed_by,
            status: 'in_progress',
            execution_status: 'in_progress',
            total_cases,
            passed_cases: 0,
            failed_cases: 0,
            start_date: new Date()
        });
    }
    catch (error) {
        console.error('❌ Error creating execution:', error);
        res.status(500).json({ error: 'Error creating test execution', details: error.message });
    }
};
exports.createTestExecution = createTestExecution;
/**
 * Obtiene todas las ejecuciones
 */
const getTestExecutions = async (req, res) => {
    try {
        const { year, month } = req.query;
        let whereClause = '';
        const params = [];
        if (year && month) {
            whereClause = 'WHERE YEAR(COALESCE(te.start_date, te.created_at)) = ? AND MONTH(COALESCE(te.start_date, te.created_at)) = ?';
            params.push(parseInt(year, 10), parseInt(month, 10));
        }
        const [executions] = await db_1.db.query(`
      SELECT 
        te.*,
        ts.name as suite_name,
        u.name as executed_by_name
      FROM test_executions te
      LEFT JOIN test_suites ts ON te.test_suite_id = ts.id
      LEFT JOIN users u ON te.executed_by = u.id
      ${whereClause}
      ORDER BY te.created_at DESC
      `, params);
        res.json(Array.isArray(executions) ? executions : []);
    }
    catch (error) {
        console.error('Error fetching executions:', error);
        res.status(500).json({ error: 'Error fetching test executions' });
    }
};
exports.getTestExecutions = getTestExecutions;
/**
 * Obtiene los meses disponibles con conteo de ejecuciones
 */
const getTestExecutionMonths = async (req, res) => {
    try {
        const [rows] = await db_1.db.query(`
      SELECT 
        YEAR(COALESCE(te.start_date, te.created_at)) as year,
        MONTH(COALESCE(te.start_date, te.created_at)) as month,
        COUNT(*) as total
      FROM test_executions te
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `);
        res.json(Array.isArray(rows) ? rows : []);
    }
    catch (error) {
        console.error('Error fetching execution months:', error);
        res.status(500).json({ error: 'Error fetching execution months' });
    }
};
exports.getTestExecutionMonths = getTestExecutionMonths;
/**
 * Obtiene una ejecución específica con sus resultados
 */
const getTestExecution = async (req, res) => {
    const { executionId } = req.params;
    try {
        const [executions] = await db_1.db.query(`
      SELECT 
        te.*,
        ts.name as suite_name,
        u.name as executed_by_name
      FROM test_executions te
      LEFT JOIN test_suites ts ON te.test_suite_id = ts.id
      LEFT JOIN users u ON te.executed_by = u.id
      WHERE te.id = ?
    `, [executionId]);
        if (!executions || executions.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        const execution = executions[0];
        // Obtener todos los casos de la suite con sus resultados
        const [cases] = await db_1.db.query(`
      SELECT 
        tc.*,
        COALESCE(tr.id, null) as result_id,
        COALESCE(tr.result_status, null) as result_status,
        COALESCE(tr.status, null) as status,
        COALESCE(tr.notes, null) as result_notes,
        COALESCE(tr.evidence_urls, null) as evidence_urls,
        COALESCE(tr.tester_name, null) as tester_name,
        COALESCE(tr.developer_name, null) as developer_name,
        COALESCE(tr.qa_tested_by, null) as qa_tested_by
      FROM test_cases tc
      LEFT JOIN test_results tr ON tc.id = tr.test_case_id AND tr.test_execution_id = ?
      WHERE tc.test_suite_id = ?
      ORDER BY tc.created_at ASC
    `, [executionId, execution.test_suite_id]);
        res.json({
            ...execution,
            cases: Array.isArray(cases) ? cases : []
        });
    }
    catch (error) {
        console.error('Error fetching execution:', error);
        res.status(500).json({ error: 'Error fetching test execution' });
    }
};
exports.getTestExecution = getTestExecution;
/**
 * Guarda el resultado de un caso de prueba en una ejecución
 */
const saveTestResult = async (req, res) => {
    const { test_case_id, execution_id, status, notes, tester_name, developer_name, qa_tested_by } = req.body;
    let evidence_urls = [];
    if (!test_case_id || !execution_id || !status) {
        return res.status(400).json({
            error: 'test_case_id, execution_id, and status are required'
        });
    }
    try {
        // Obtener test_project_id de la ejecución
        const [executionData] = await db_1.db.query('SELECT test_project_id FROM test_executions WHERE id = ?', [execution_id]);
        if (!executionData || executionData.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        const test_project_id = executionData[0].test_project_id;
        // Si hay archivos, subirlos a S3
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (const file of req.files) {
                const url = await (0, s3_1.uploadToS3)(file.buffer, file.originalname, file.mimetype);
                evidence_urls.push(url);
            }
        }
        // Insertar o actualizar resultado (usando test_execution_id en BD)
        const [existingResult] = await db_1.db.query('SELECT id, evidence_urls FROM test_results WHERE test_case_id = ? AND test_execution_id = ?', [test_case_id, execution_id]);
        // Acumular evidencias existentes con las nuevas
        let allEvidenceUrls = evidence_urls;
        if (existingResult && existingResult.length > 0 && existingResult[0].evidence_urls) {
            try {
                const existingUrlsString = existingResult[0].evidence_urls;
                // Intentar parsear como JSON
                let existingUrls = [];
                if (typeof existingUrlsString === 'string') {
                    // Si es string, intentar parsear
                    try {
                        existingUrls = JSON.parse(existingUrlsString);
                    }
                    catch (parseErr) {
                        // Si falla el parse, asumir que es un string simple de URL
                        existingUrls = [existingUrlsString];
                    }
                }
                else if (Array.isArray(existingUrlsString)) {
                    existingUrls = existingUrlsString;
                }
                if (Array.isArray(existingUrls)) {
                    allEvidenceUrls = [...existingUrls, ...evidence_urls];
                }
            }
            catch (e) {
                allEvidenceUrls = evidence_urls;
            }
        }
        if (existingResult && existingResult.length > 0) {
            // Actualizar - mapear status de enum nuevo al old
            const resultStatus = status === 'skipped' ? 'skip' : status;
            // IMPORTANTE: Si no hay nuevas URLs (no hay archivos), mantener las URLs existentes
            // Si hay nuevas URLs, combinarlas con las existentes
            let urlsToSave = existingResult[0].evidence_urls;
            if (allEvidenceUrls.length > 0) {
                // Tenemos nuevas URLs, guardarlas (ya están combinadas en allEvidenceUrls)
                urlsToSave = JSON.stringify(allEvidenceUrls);
            }
            else {
                // No hay nuevas URLs, mantener las existentes tal como están
                console.log('📝 Sin nuevas URLs, manteniendo existentes:', urlsToSave);
            }
            await db_1.db.query(`UPDATE test_results 
         SET result_status = ?, notes = ?, evidence_urls = ?, tester_name = ?, developer_name = ?, qa_tested_by = ?, status = ?, executed_at = NOW()
         WHERE test_case_id = ? AND test_execution_id = ?`, [
                resultStatus,
                notes || null,
                urlsToSave,
                tester_name || null,
                developer_name || null,
                qa_tested_by || null,
                status || null,
                test_case_id,
                execution_id
            ]);
        }
        else {
            // Insertar con test_project_id obtenido de la ejecución
            const resultStatus = status === 'skipped' ? 'skip' : status;
            await db_1.db.query(`INSERT INTO test_results 
         (test_case_id, test_execution_id, test_project_id, result_status, notes, evidence_urls, tester_name, developer_name, qa_tested_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                test_case_id,
                execution_id,
                test_project_id,
                resultStatus,
                notes || null,
                allEvidenceUrls.length > 0 ? JSON.stringify(allEvidenceUrls) : null,
                tester_name || null,
                developer_name || null,
                qa_tested_by || null,
                status || null
            ]);
        }
        // Actualizar contadores en la ejecución
        const [stats] = await db_1.db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN result_status = 'pass' OR status = 'pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN result_status = 'fail' OR status = 'fail' THEN 1 ELSE 0 END) as failed
      FROM test_results
      WHERE test_execution_id = ?
    `, [execution_id]);
        const { total = 0, passed = 0, failed = 0 } = stats[0] || {};
        // Si se proporcionó tester_name, obtener el ID del usuario y actualizar executed_by
        let updateQuery = 'UPDATE test_executions SET passed_cases = ?, failed_cases = ? WHERE id = ?';
        let updateParams = [passed, failed, execution_id];
        if (tester_name) {
            // Buscar el ID del usuario por nombre
            const [userData] = await db_1.db.query('SELECT id FROM users WHERE name = ? LIMIT 1', [tester_name]);
            if (userData && userData.length > 0) {
                updateQuery = 'UPDATE test_executions SET passed_cases = ?, failed_cases = ?, executed_by = ? WHERE id = ?';
                updateParams = [passed, failed, userData[0].id, execution_id];
            }
        }
        await db_1.db.query(updateQuery, updateParams);
        res.status(201).json({
            message: 'Result saved successfully',
            test_case_id,
            execution_id,
            status,
            evidence_urls,
            stats: { total, passed, failed }
        });
    }
    catch (error) {
        console.error('❌ Error saving result:', error);
        res.status(500).json({
            error: 'Error saving test result',
            details: error.message
        });
    }
};
exports.saveTestResult = saveTestResult;
/**
 * Marca una ejecución como completada
 */
const completeTestExecution = async (req, res) => {
    const { executionId } = req.params;
    try {
        // ✅ ASEGURAR QUE EXISTEN LAS TABLAS
        await ensureTables();
        // Obtener datos de la ejecución
        const [executionData] = await db_1.db.query(`SELECT te.test_suite_id, te.executed_by, ts.name as suite_name
       FROM test_executions te
       LEFT JOIN test_suites ts ON te.test_suite_id = ts.id
       WHERE te.id = ?`, [executionId]);
        if (!executionData || executionData.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        const test_suite_id = executionData[0].test_suite_id;
        const executed_by = executionData[0].executed_by;
        const suite_name = executionData[0].suite_name;
        // Obtener todos los resultados de esta ejecución
        const [results] = await db_1.db.query(`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN result_status = 'pass' OR status = 'pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN result_status = 'fail' OR status = 'fail' THEN 1 ELSE 0 END) as failed
      FROM test_results 
      WHERE test_execution_id = ?`, [executionId]);
        const { total = 0, passed = 0, failed = 0 } = results[0] || {};
        // Lógica: Si hay al menos 1 test fallido, la ejecución completa es FALLIDA
        // Si no hay fallos, es COMPLETADA
        const hasFailed = failed > 0;
        // Valores para status (nueva columna) y execution_status (enum vieja)
        const newStatus = hasFailed ? 'failed' : 'completed';
        const oldStatus = hasFailed ? 'aborted' : 'completed';
        // Actualizar estado y timestamps
        await db_1.db.query("UPDATE test_executions SET status = ?, execution_status = ?, end_date = NOW(), updated_at = NOW() WHERE id = ?", [newStatus, oldStatus, executionId]);
        // ============================================
        // 🔄 CREAR O ACTUALIZAR BOARD AL COMPLETAR
        // ============================================
        try {
            // Verificar si ya existe un board para esta ejecución
            const [existingBoard] = await db_1.db.query(`SELECT id FROM boards WHERE name = ? ORDER BY created_at DESC LIMIT 1`, [suite_name]);
            const sprintId = await getCurrentOrCreateSprint();
            const automatedCases = await countAutomatedCases(test_suite_id);
            if (existingBoard && existingBoard.length > 0) {
                // Si existe, actualizar el board con los nuevos datos
                // 🆕 Mapeo de estados: completed → Listo, failed → Devuelta
                const boardState = newStatus === 'completed' ? 'Listo' : 'Devuelta';
                // Si la ejecución falló, incrementar el contador de devoluciones en board y sprint
                if (newStatus === 'failed') {
                    await db_1.db.query(`UPDATE boards 
             SET test_cases = ?, automated_cases = ?, state = ?, sprint_id = ?, returns = returns + 1, return_date = NOW(), updated_at = NOW()
             WHERE id = ?`, [total, automatedCases, boardState, sprintId, existingBoard[0].id]);
                    // Incrementar devoluciones en el sprint también
                    await db_1.db.query(`UPDATE sprints SET returns = returns + 1, updated_at = NOW() WHERE id = ?`, [sprintId]);
                }
                else {
                    await db_1.db.query(`UPDATE boards 
             SET test_cases = ?, automated_cases = ?, state = ?, sprint_id = ?, updated_at = NOW()
             WHERE id = ?`, [total, automatedCases, boardState, sprintId, existingBoard[0].id]);
                }
            }
            else {
                // Si no existe, crear uno nuevo
                await createBoardFromExecution(suite_name, test_suite_id, total, automatedCases, executed_by, sprintId);
            }
        }
        catch (boardError) {
            console.error('⚠️ Advertencia: No se pudo crear/actualizar board:', boardError);
            // Continuamos - el error no debe bloquear la finalización de la ejecución
        }
        res.json({
            message: `Ejecución completada: ${hasFailed ? 'FALLIDA (hay tests fallidos)' : 'EXITOSA (todos los tests pasaron)'}`,
            status: newStatus,
            execution_status: oldStatus,
            stats: { total, passed, failed },
            hasFailed
        });
    }
    catch (error) {
        console.error('Error completing execution:', error);
        res.status(500).json({ error: 'Error completing execution', details: error.message });
    }
};
exports.completeTestExecution = completeTestExecution;
/**
 * Reabre una ejecución completada (marca como "en progreso")
 */
const reopenTestExecution = async (req, res) => {
    const { executionId } = req.params;
    try {
        // Actualizar estado a "en progreso"
        await db_1.db.query("UPDATE test_executions SET status = ?, execution_status = ?, end_date = NULL, updated_at = NOW() WHERE id = ?", ['in_progress', 'in_progress', executionId]);
        res.json({
            message: 'Ejecución reabierta para continuar ejecutando',
            status: 'in_progress',
            execution_status: 'in_progress'
        });
    }
    catch (error) {
        console.error('Error reopening execution:', error);
        res.status(500).json({ error: 'Error reopening execution', details: error.message });
    }
};
exports.reopenTestExecution = reopenTestExecution;
/**
 * Recalcula el estado de todas las ejecuciones basado en sus resultados
 * Útil para actualizar ejecuciones anteriores que pudieron haber sido guardadas con estado incorrecto
 */
const recalculateAllExecutionStatuses = async (req, res) => {
    try {
        // Obtener todas las ejecuciones
        const [executions] = await db_1.db.query('SELECT id FROM test_executions');
        let updatedCount = 0;
        for (const exec of executions) {
            const [results] = await db_1.db.query(`SELECT 
          SUM(CASE WHEN result_status = 'pass' OR status = 'pass' THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN result_status = 'fail' OR status = 'fail' THEN 1 ELSE 0 END) as failed
        FROM test_results 
        WHERE test_execution_id = ?`, [exec.id]);
            const { passed = 0, failed = 0 } = results[0] || {};
            const hasFailed = failed > 0;
            const newStatus = hasFailed ? 'failed' : 'completed';
            const oldStatus = hasFailed ? 'aborted' : 'completed';
            await db_1.db.query("UPDATE test_executions SET status = ?, execution_status = ? WHERE id = ?", [newStatus, oldStatus, exec.id]);
            updatedCount++;
        }
        res.json({
            message: `Recalculated ${updatedCount} execution statuses`,
            updated: updatedCount
        });
    }
    catch (error) {
        console.error('Error recalculating execution statuses:', error);
        res.status(500).json({ error: 'Error recalculating execution statuses', details: error.message });
    }
};
exports.recalculateAllExecutionStatuses = recalculateAllExecutionStatuses;
/**
 * Elimina una evidencia específica de un resultado de prueba
 */
const deleteEvidence = async (req, res) => {
    const { executionId, caseId } = req.params;
    const { evidenceUrl } = req.body;
    if (!executionId || !caseId || !evidenceUrl) {
        return res.status(400).json({
            error: 'executionId, caseId and evidenceUrl are required'
        });
    }
    try {
        // Obtener el resultado actual
        const [results] = await db_1.db.query('SELECT id, evidence_urls FROM test_results WHERE test_execution_id = ? AND test_case_id = ?', [executionId, caseId]);
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Test result not found' });
        }
        const result = results[0];
        let evidenceUrls = [];
        // Parsear las URLs existentes
        if (result.evidence_urls) {
            try {
                if (typeof result.evidence_urls === 'string') {
                    evidenceUrls = JSON.parse(result.evidence_urls);
                }
                else if (Array.isArray(result.evidence_urls)) {
                    evidenceUrls = result.evidence_urls;
                }
            }
            catch (e) {
                console.error('Error parsing evidence URLs:', e);
                evidenceUrls = [];
            }
        }
        // Filtrar la URL a eliminar
        const updatedUrls = evidenceUrls.filter(url => url !== evidenceUrl);
        // Eliminar el archivo de S3
        try {
            await (0, s3_1.deleteFromS3)(evidenceUrl);
            console.log(`🗑️ Archivo eliminado de S3: ${evidenceUrl}`);
        }
        catch (s3Error) {
            console.warn('⚠️ No se pudo eliminar de S3 (continuando con BD):', s3Error);
            // Continuamos con la eliminación de la BD aunque falle S3
        }
        // Actualizar en la base de datos
        await db_1.db.query('UPDATE test_results SET evidence_urls = ? WHERE test_execution_id = ? AND test_case_id = ?', [updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : null, executionId, caseId]);
        console.log(`✅ Evidencia eliminada: ${evidenceUrl}`);
        res.json({
            success: true,
            message: 'Evidencia eliminada correctamente',
            remaining_urls: updatedUrls
        });
    }
    catch (error) {
        console.error('❌ Error deleting evidence:', error);
        res.status(500).json({
            error: 'Error deleting evidence',
            details: error.message
        });
    }
};
exports.deleteEvidence = deleteEvidence;
/**
 * Elimina una ejecución de prueba y todos sus resultados asociados
 */
const deleteTestExecution = async (req, res) => {
    const { executionId } = req.params;
    if (!executionId) {
        return res.status(400).json({ error: 'executionId is required' });
    }
    try {
        // Verificar que la ejecución existe
        const [executions] = await db_1.db.query('SELECT id, test_suite_id FROM test_executions WHERE id = ?', [executionId]);
        if (!executions || executions.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        const execution = executions[0];
        // Obtener todas las evidencias para eliminarlas de S3
        const [results] = await db_1.db.query('SELECT evidence_urls FROM test_results WHERE test_execution_id = ?', [executionId]);
        // Eliminar evidencias de S3
        if (results && results.length > 0) {
            for (const result of results) {
                if (result.evidence_urls) {
                    try {
                        let urls = [];
                        if (typeof result.evidence_urls === 'string') {
                            urls = JSON.parse(result.evidence_urls);
                        }
                        else if (Array.isArray(result.evidence_urls)) {
                            urls = result.evidence_urls;
                        }
                        for (const url of urls) {
                            try {
                                await (0, s3_1.deleteFromS3)(url);
                                console.log(`🗑️ Evidencia eliminada de S3: ${url}`);
                            }
                            catch (s3Error) {
                                console.warn(`⚠️ No se pudo eliminar de S3: ${url}`, s3Error);
                            }
                        }
                    }
                    catch (parseError) {
                        console.warn('⚠️ Error parsing evidence URLs:', parseError);
                    }
                }
            }
        }
        // Eliminar resultados asociados
        await db_1.db.query('DELETE FROM test_results WHERE test_execution_id = ?', [executionId]);
        console.log(`✅ Resultados eliminados para ejecución ${executionId}`);
        // Eliminar la ejecución
        await db_1.db.query('DELETE FROM test_executions WHERE id = ?', [executionId]);
        console.log(`✅ Ejecución ${executionId} eliminada`);
        // Intentar eliminar el board asociado (si existe)
        try {
            const [suiteInfo] = await db_1.db.query('SELECT name FROM test_suites WHERE id = ?', [execution.test_suite_id]);
            if (suiteInfo && suiteInfo.length > 0) {
                const suiteName = suiteInfo[0].name;
                await db_1.db.query('DELETE FROM boards WHERE name = ? ORDER BY created_at DESC LIMIT 1', [suiteName]);
                console.log(`✅ Board asociado eliminado: ${suiteName}`);
            }
        }
        catch (boardError) {
            console.warn('⚠️ No se pudo eliminar el board asociado:', boardError);
        }
        res.json({
            success: true,
            message: 'Ejecución eliminada correctamente',
            deletedId: executionId
        });
    }
    catch (error) {
        console.error('❌ Error deleting test execution:', error);
        res.status(500).json({
            error: 'Error deleting test execution',
            details: error.message
        });
    }
};
exports.deleteTestExecution = deleteTestExecution;
const getTestResult = async (req, res) => {
    const { test_case_id, execution_id } = req.params;
    try {
        const [results] = await db_1.db.query(`SELECT * FROM test_results 
       WHERE test_case_id = ? AND execution_id = ?`, [test_case_id, execution_id]);
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Result not found' });
        }
        const result = results[0];
        if (result.evidence_urls && typeof result.evidence_urls === 'string') {
            result.evidence_urls = JSON.parse(result.evidence_urls);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ error: 'Error fetching test result' });
    }
};
exports.getTestResult = getTestResult;
//# sourceMappingURL=testExecution.controller.js.map