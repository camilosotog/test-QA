"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importFromTestomat = exports.getProjectAnalytics = exports.createTestResult = exports.createTestExecution = exports.getTestExecutionById = exports.getTestExecutions = exports.deleteTestCase = exports.updateTestCase = exports.createTestCase = exports.getTestCaseById = exports.getTestCases = exports.createTestSuite = exports.getTestSuites = exports.updateTestProject = exports.createTestProject = exports.getTestProjectById = exports.getTestProjects = void 0;
const db_1 = require("../config/db");
// ============================================
// 🧪 TESTOMAT CONTROLLER
// ============================================
// ========== TEST PROJECTS ==========
const getTestProjects = async (req, res) => {
    try {
        // 🚀 OPTIMIZACIÓN: Paginación opcional para mejorar rendimiento
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Límite default de 50
        const offset = (page - 1) * limit;
        // Una sola query con JOIN para obtener proyectos + conteo de suites
        const [projects] = await db_1.db.query(`
      SELECT 
        p.*,
        COALESCE(COUNT(s.id), 0) as suite_count
      FROM test_projects p
      LEFT JOIN test_suites s ON p.id = s.test_project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
        // Obtener total de proyectos para paginación
        const [countResult] = await db_1.db.query('SELECT COUNT(*) as total FROM test_projects');
        const total = countResult[0]?.total || 0;
        res.json({
            projects: Array.isArray(projects) ? projects : [],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching test projects' });
    }
};
exports.getTestProjects = getTestProjects;
const getTestProjectById = async (req, res) => {
    const { projectId } = req.params;
    try {
        const [projects] = await db_1.db.query('SELECT * FROM test_projects WHERE id = ?', [projectId]);
        const projectsList = Array.isArray(projects) ? projects : [];
        if (projectsList.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(projectsList[0]);
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching test project' });
    }
};
exports.getTestProjectById = getTestProjectById;
const createTestProject = async (req, res) => {
    const { name, description, project_id } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    try {
        const [result] = await db_1.db.query('INSERT INTO test_projects (name, description, project_id) VALUES (?, ?, ?)', [name, description || null, project_id || null]);
        res.status(201).json({
            id: result.insertId,
            name,
            description,
            project_id,
        });
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Project name already exists' });
        }
        console.error('Error:', error);
        res.status(500).json({ error: 'Error creating test project' });
    }
};
exports.createTestProject = createTestProject;
const updateTestProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, description } = req.body;
    if (!projectId || isNaN(parseInt(projectId))) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }
    try {
        const updates = [];
        const params = [];
        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updates.push('updated_at = NOW()');
        params.push(parseInt(projectId));
        const query = `UPDATE test_projects SET ${updates.join(', ')} WHERE id = ?`;
        const [result] = await db_1.db.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ message: 'Test project updated successfully' });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error updating test project' });
    }
};
exports.updateTestProject = updateTestProject;
// ========== TEST SUITES ==========
const getTestSuites = async (req, res) => {
    const { projectId } = req.params;
    try {
        const [suites] = await db_1.db.query('SELECT * FROM test_suites WHERE test_project_id = ? ORDER BY order_index ASC', [projectId]);
        res.json(Array.isArray(suites) ? suites : []);
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching test suites' });
    }
};
exports.getTestSuites = getTestSuites;
const createTestSuite = async (req, res) => {
    const { test_project_id, name, description, status, order_index } = req.body;
    if (!test_project_id || !name) {
        return res.status(400).json({ error: 'Project ID and name are required', received: { test_project_id, name } });
    }
    try {
        const [result] = await db_1.db.query('INSERT INTO test_suites (test_project_id, name, description, status, order_index) VALUES (?, ?, ?, ?, ?)', [test_project_id, name, description || null, status || 'active', order_index || 0]);
        const newSuite = {
            id: result.insertId,
            test_project_id,
            name,
            description,
            status: status || 'active',
            order_index: order_index || 0,
            created_at: new Date(),
            updated_at: new Date(),
        };
        res.status(201).json(newSuite);
    }
    catch (error) {
        console.error('❌ Error creating test suite:', error);
        res.status(500).json({ error: 'Error creating test suite', details: error.message });
    }
};
exports.createTestSuite = createTestSuite;
// ========== TEST CASES ==========
const getTestCases = async (req, res) => {
    const { suiteId } = req.params;
    const { status, test_type, automation_status } = req.query;
    try {
        let query = 'SELECT * FROM test_cases WHERE test_suite_id = ?';
        const params = [suiteId];
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (test_type) {
            query += ' AND test_type = ?';
            params.push(test_type);
        }
        if (automation_status) {
            query += ' AND automation_status = ?';
            params.push(automation_status);
        }
        query += ' ORDER BY created_at DESC';
        const [cases] = await db_1.db.query(query, params);
        res.json(Array.isArray(cases) ? cases : []);
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching test cases' });
    }
};
exports.getTestCases = getTestCases;
const getTestCaseById = async (req, res) => {
    const { caseId } = req.params;
    try {
        const [cases] = await db_1.db.query('SELECT * FROM test_cases WHERE id = ?', [caseId]);
        const casesList = Array.isArray(cases) ? cases : [];
        if (casesList.length === 0) {
            return res.status(404).json({ error: 'Test case not found' });
        }
        const [history] = await db_1.db.query('SELECT * FROM test_case_history WHERE test_case_id = ? ORDER BY changed_at DESC', [caseId]);
        res.json({
            ...casesList[0],
            history: Array.isArray(history) ? history : [],
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching test case' });
    }
};
exports.getTestCaseById = getTestCaseById;
const createTestCase = async (req, res) => {
    const { test_suite_id, test_project_id, name, description, preconditions, input_data, steps, expected_result, priority, status, automation_status, automation_tool, test_type, requirement_id, tags, created_by, } = req.body;
    if (!test_suite_id || !test_project_id || !name) {
        return res.status(400).json({ error: 'Required: test_suite_id, test_project_id, name' });
    }
    try {
        // Verificar si la columna input_data existe, si no, crearla
        try {
            await db_1.db.query('ALTER TABLE test_cases ADD COLUMN input_data TEXT AFTER preconditions');
        }
        catch (err) {
            if (!err.message.includes('Duplicate column')) {
                console.log('ℹ️  Columna input_data ya existe');
            }
        }
        const [result] = await db_1.db.query(`INSERT INTO test_cases (
        test_suite_id, test_project_id, name, description, preconditions, input_data, steps, 
        expected_result, priority, status, automation_status, automation_tool, 
        test_type, requirement_id, tags, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            test_suite_id, test_project_id, name, description || null, preconditions || null,
            input_data || null, steps ? JSON.stringify(steps) : null, expected_result || null,
            priority || 'medium', status || 'draft', automation_status || 'manual',
            automation_tool || null, test_type || 'functional', requirement_id || null,
            tags ? JSON.stringify(tags) : null, created_by || null,
        ]);
        res.status(201).json({
            id: result.insertId,
            test_suite_id,
            test_project_id,
            name,
            description,
            status: status || 'draft',
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error creating test case' });
    }
};
exports.createTestCase = createTestCase;
const updateTestCase = async (req, res) => {
    const caseId = parseInt(req.params.caseId || '0');
    const { name, description, preconditions, input_data, steps, expected_result, status, priority, automation_status, automation_tool, test_type, tags, updated_by } = req.body;
    if (!caseId || isNaN(caseId)) {
        return res.status(400).json({ error: 'Invalid case ID' });
    }
    try {
        // Construir dinámicamente la query UPDATE
        const updates = [];
        const params = [];
        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (preconditions !== undefined) {
            updates.push('preconditions = ?');
            params.push(preconditions);
        }
        if (input_data !== undefined) {
            updates.push('input_data = ?');
            params.push(input_data);
        }
        if (steps !== undefined) {
            updates.push('steps = ?');
            params.push(steps ? JSON.stringify(steps) : null);
        }
        if (expected_result !== undefined) {
            updates.push('expected_result = ?');
            params.push(expected_result);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            params.push(priority);
        }
        if (automation_status !== undefined) {
            updates.push('automation_status = ?');
            params.push(automation_status);
        }
        if (automation_tool !== undefined) {
            updates.push('automation_tool = ?');
            params.push(automation_tool);
        }
        if (test_type !== undefined) {
            updates.push('test_type = ?');
            params.push(test_type);
        }
        if (tags !== undefined) {
            updates.push('tags = ?');
            params.push(tags ? JSON.stringify(tags) : null);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updates.push('updated_at = NOW()');
        params.push(caseId);
        const query = `UPDATE test_cases SET ${updates.join(', ')} WHERE id = ?`;
        await db_1.db.query(query, params);
        res.json({ message: 'Test case updated successfully' });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error updating test case' });
    }
};
exports.updateTestCase = updateTestCase;
const deleteTestCase = async (req, res) => {
    const caseId = parseInt(req.params.caseId || '0');
    if (!caseId || isNaN(caseId)) {
        return res.status(400).json({ error: 'Invalid case ID' });
    }
    try {
        // Eliminar primero los resultados asociados a este caso
        await db_1.db.query('DELETE FROM test_results WHERE test_case_id = ?', [caseId]);
        // Luego eliminar el caso
        const [result] = await db_1.db.query('DELETE FROM test_cases WHERE id = ?', [caseId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Test case not found' });
        }
        res.json({ message: 'Test case deleted successfully' });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error deleting test case' });
    }
};
exports.deleteTestCase = deleteTestCase;
// ========== TEST EXECUTIONS ==========
const getTestExecutions = async (req, res) => {
    const { projectId } = req.params;
    const { status } = req.query;
    try {
        let query = 'SELECT * FROM test_executions WHERE test_project_id = ?';
        const params = [projectId];
        if (status) {
            query += ' AND execution_status = ?';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC LIMIT 50';
        const [executions] = await db_1.db.query(query, params);
        res.json(Array.isArray(executions) ? executions : []);
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching test executions' });
    }
};
exports.getTestExecutions = getTestExecutions;
const getTestExecutionById = async (req, res) => {
    const { executionId } = req.params;
    try {
        // 🚀 OPTIMIZACIÓN: Una sola query con LEFT JOINs para obtener ejecución + casos + resultados
        const [executionData] = await db_1.db.query(`
      SELECT 
        e.*, 
        tc.id as case_id,
        tc.name as case_name,
        tc.description as case_description,
        tc.preconditions,
        tc.input_data,
        tc.steps,
        tc.expected_result,
        tc.priority,
        tc.test_type,
        tc.automation_status,
        tc.status as case_status,
        tr.id as result_id,
        tr.result_status,
        tr.notes as result_notes,
        tr.evidence_urls,
        tr.tester_name,
        tr.developer_name,
        tr.qa_tested_by,
        tr.status as result_status_enum,
        tr.executed_at
      FROM test_executions e
      INNER JOIN test_cases tc ON tc.test_suite_id = e.test_suite_id
      LEFT JOIN test_results tr ON (tr.test_execution_id = e.id AND tr.test_case_id = tc.id)
      WHERE e.id = ?
      ORDER BY tc.id ASC
    `, [executionId]);
        const executionRows = Array.isArray(executionData) ? executionData : [];
        if (executionRows.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        // Transformar los datos a la estructura esperada
        const execution = {
            id: executionRows[0].id,
            test_suite_id: executionRows[0].test_suite_id,
            test_project_id: executionRows[0].test_project_id,
            execution_name: executionRows[0].execution_name,
            execution_status: executionRows[0].execution_status,
            environment: executionRows[0].environment,
            executor_id: executionRows[0].executor_id,
            start_date: executionRows[0].start_date,
            end_date: executionRows[0].end_date,
            created_at: executionRows[0].created_at,
            updated_at: executionRows[0].updated_at
        };
        // Agrupar casos con sus resultados
        const cases = executionRows.map((row) => ({
            id: row.case_id,
            test_suite_id: execution.test_suite_id,
            test_project_id: execution.test_project_id,
            name: row.case_name,
            description: row.case_description,
            preconditions: row.preconditions,
            input_data: row.input_data,
            steps: row.steps,
            expected_result: row.expected_result,
            priority: row.priority,
            test_type: row.test_type,
            automation_status: row.automation_status,
            status: row.case_status,
            result_id: row.result_id,
            result_status: row.result_status,
            result_notes: row.result_notes,
            evidence_urls: row.evidence_urls,
            tester_name: row.tester_name,
            developer_name: row.developer_name,
            qa_tested_by: row.qa_tested_by,
            executed_at: row.executed_at
        }));
        res.json({
            ...execution,
            cases: cases
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching test execution' });
    }
};
exports.getTestExecutionById = getTestExecutionById;
const createTestExecution = async (req, res) => {
    const { test_project_id, execution_name, environment, executor_id } = req.body;
    if (!test_project_id) {
        return res.status(400).json({ error: 'Project ID is required' });
    }
    try {
        const [result] = await db_1.db.query(`INSERT INTO test_executions (
        test_project_id, execution_name, execution_status, environment, executor_id, start_date
      ) VALUES (?, ?, 'in_progress', ?, ?, NOW())`, [test_project_id, execution_name || `Execution ${new Date().toISOString().split('T')[0]}`, environment || null, executor_id || null]);
        res.status(201).json({
            id: result.insertId,
            test_project_id,
            execution_status: 'in_progress',
            start_date: new Date(),
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error creating test execution' });
    }
};
exports.createTestExecution = createTestExecution;
// ========== TEST RESULTS ==========
const createTestResult = async (req, res) => {
    const { test_execution_id, test_case_id, test_project_id, result_status, execution_time, error_message, actual_result, screenshot_url, log_url, executed_by, } = req.body;
    if (!test_execution_id || !test_case_id || !test_project_id || !result_status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const [result] = await db_1.db.query(`INSERT INTO test_results (
        test_execution_id, test_case_id, test_project_id, result_status,
        execution_time, error_message, actual_result, screenshot_url, log_url, executed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [test_execution_id, test_case_id, test_project_id, result_status, execution_time || null,
            error_message || null, actual_result || null, screenshot_url || null, log_url || null, executed_by || null]);
        await updateExecutionStats(test_execution_id);
        res.status(201).json({
            id: result.insertId,
            test_execution_id,
            test_case_id,
            result_status,
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error creating test result' });
    }
};
exports.createTestResult = createTestResult;
async function updateExecutionStats(executionId) {
    try {
        const [stats] = await db_1.db.query(`SELECT COUNT(*) as total,
              SUM(CASE WHEN result_status = 'pass' THEN 1 ELSE 0 END) as passed,
              SUM(CASE WHEN result_status = 'fail' THEN 1 ELSE 0 END) as failed,
              SUM(CASE WHEN result_status = 'skip' THEN 1 ELSE 0 END) as skipped
       FROM test_results WHERE test_execution_id = ?`, [executionId]);
        const stat = Array.isArray(stats) ? stats[0] : stats;
        const successRate = stat.total > 0 ? Math.round((stat.passed / stat.total) * 100) : 0;
        await db_1.db.query(`UPDATE test_executions
       SET total_cases = ?, passed_cases = ?, failed_cases = ?, skipped_cases = ?, success_rate = ?
       WHERE id = ?`, [stat.total, stat.passed, stat.failed, stat.skipped, successRate, executionId]);
    }
    catch (error) {
        console.error('Error updating stats:', error);
    }
}
// ========== ANALYTICS ==========
const getProjectAnalytics = async (req, res) => {
    const { projectId } = req.params;
    try {
        const [casesResult] = await db_1.db.query('SELECT COUNT(*) as total FROM test_cases WHERE test_project_id = ?', [projectId]);
        const [typeResult] = await db_1.db.query('SELECT test_type, COUNT(*) as count FROM test_cases WHERE test_project_id = ? GROUP BY test_type', [projectId]);
        const [automationResult] = await db_1.db.query('SELECT automation_status, COUNT(*) as count FROM test_cases WHERE test_project_id = ? GROUP BY automation_status', [projectId]);
        const [executionsResult] = await db_1.db.query(`SELECT id, execution_name, execution_status, success_rate, total_cases, passed_cases, failed_cases, created_at
       FROM test_executions WHERE test_project_id = ? ORDER BY created_at DESC LIMIT 5`, [projectId]);
        res.json({
            total_cases: (Array.isArray(casesResult) ? casesResult[0] : casesResult).total,
            cases_by_type: Array.isArray(typeResult) ? typeResult : [],
            automation_breakdown: Array.isArray(automationResult) ? automationResult : [],
            recent_executions: Array.isArray(executionsResult) ? executionsResult : [],
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching analytics' });
    }
};
exports.getProjectAnalytics = getProjectAnalytics;
// ========== IMPORT ==========
const importFromTestomat = async (req, res) => {
    const { projectName, apiKey, workspaceId, suiteIds } = req.body;
    if (!projectName || !apiKey || !workspaceId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    try {
        const [projectResult] = await db_1.db.query('INSERT INTO test_projects (name, description) VALUES (?, ?)', [projectName, `Imported from TestOmat.io - ${new Date().toISOString()}`]);
        const [importResult] = await db_1.db.query(`INSERT INTO testomat_imports (test_project_id, import_source, status)
       VALUES (?, 'testomat.io', 'processing')`, [projectResult.insertId]);
        res.status(201).json({
            import_id: importResult.insertId,
            test_project_id: projectResult.insertId,
            status: 'processing',
            message: 'Import started',
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error starting import' });
    }
};
exports.importFromTestomat = importFromTestomat;
exports.default = {
    getTestProjects: exports.getTestProjects,
    getTestProjectById: exports.getTestProjectById,
    createTestProject: exports.createTestProject,
    getTestSuites: exports.getTestSuites,
    createTestSuite: exports.createTestSuite,
    getTestCases: exports.getTestCases,
    getTestCaseById: exports.getTestCaseById,
    createTestCase: exports.createTestCase,
    updateTestCase: exports.updateTestCase,
    getTestExecutions: exports.getTestExecutions,
    getTestExecutionById: exports.getTestExecutionById,
    createTestExecution: exports.createTestExecution,
    createTestResult: exports.createTestResult,
    getProjectAnalytics: exports.getProjectAnalytics,
    importFromTestomat: exports.importFromTestomat,
};
//# sourceMappingURL=testomat.controller.js.map