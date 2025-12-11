"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOtherResponseResults = exports.getControlledResponseResults = exports.getContractResults = exports.listResults = exports.getTopFailures = exports.getDaily = exports.getSummary = exports.getAvailableProjects = void 0;
const db_1 = require("../config/db");
// Obtener lista de proyectos disponibles (suites únicos)
const getAvailableProjects = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT 
        suite,
        COUNT(*) as total_tests,
        SUM(status='passed') as passed,
        SUM(status='failed') as failed,
        MAX(run_date) as last_execution
      FROM playwright_results
      WHERE suite IS NOT NULL AND suite != ''
      GROUP BY suite
      ORDER BY last_execution DESC
    `);
        const projects = rows.map((row) => ({
            id: row.suite.toLowerCase(),
            name: row.suite,
            testSuites: row.total_tests,
            passed: row.passed,
            failed: row.failed,
            lastExecution: row.last_execution,
            status: 'active'
        }));
        return res.json(projects);
    }
    catch (err) {
        console.error('Error obteniendo proyectos disponibles:', err);
        return res.status(500).json({ error: 'Error obteniendo proyectos', details: err?.message });
    }
};
exports.getAvailableProjects = getAvailableProjects;
const getSummary = async (req, res) => {
    const suite = req.query.suite;
    try {
        let query = `
      SELECT 
        COUNT(*) AS total,
        SUM(status='passed') AS passed,
        SUM(status='failed') AS failed,
        SUM(status='skipped') AS skipped,
        ROUND(100 * SUM(status='passed') / COUNT(*), 2) AS pass_rate,
        ROUND(AVG(duration_ms), 2) AS avg_duration_ms
      FROM playwright_results`;
        const params = [];
        if (suite) {
            query += ` WHERE suite = ?`;
            params.push(suite);
        }
        const [rows] = await db_1.pool.query(query, params);
        return res.json(rows[0] || {});
    }
    catch (err) {
        console.error('playwright summary error', err);
        return res.status(500).json({ error: 'Error obteniendo resumen', details: err?.message });
    }
};
exports.getSummary = getSummary;
const getDaily = async (req, res) => {
    const days = parseInt(req.query.days || '30', 10);
    const suite = req.query.suite;
    try {
        let query = `SELECT DATE(run_date) AS day,
         SUM(status='passed') AS passed,
         SUM(status='failed') AS failed,
         SUM(status='skipped') AS skipped,
         COUNT(*) AS total
       FROM playwright_results
       WHERE run_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
        const params = [days];
        if (suite) {
            query += ` AND suite = ?`;
            params.push(suite);
        }
        query += ` GROUP BY day ORDER BY day ASC`;
        const [rows] = await db_1.pool.query(query, params);
        return res.json(rows || []);
    }
    catch (err) {
        console.error('playwright daily error', err);
        return res.status(500).json({ error: 'Error obteniendo resumen diario', details: err?.message });
    }
};
exports.getDaily = getDaily;
const getTopFailures = async (req, res) => {
    const limit = parseInt(req.query.limit || '10', 10);
    const suite = req.query.suite;
    try {
        let query = `SELECT test_name,
              COUNT(*) AS runs,
              SUM(status='failed') AS failures
       FROM playwright_results`;
        const params = [];
        if (suite) {
            query += ` WHERE suite = ?`;
            params.push(suite);
        }
        query += ` GROUP BY test_name
       HAVING failures > 0
       ORDER BY failures DESC
       LIMIT ?`;
        params.push(limit);
        const [rows] = await db_1.pool.query(query, params);
        return res.json(rows || []);
    }
    catch (err) {
        console.error('playwright top failures error', err);
        return res.status(500).json({ error: 'Error obteniendo top failures', details: err?.message });
    }
};
exports.getTopFailures = getTopFailures;
const listResults = async (req, res) => {
    const limit = parseInt(req.query.limit || '200', 10);
    const suite = req.query.suite;
    try {
        let query = `SELECT id, project_id, suite, test_name, status, duration_ms, run_date FROM playwright_results`;
        const params = [];
        if (suite) {
            query += ` WHERE suite = ?`;
            params.push(suite);
        }
        query += ` ORDER BY run_date DESC LIMIT ?`;
        params.push(limit);
        const [rows] = await db_1.pool.query(query, params);
        return res.json(rows || []);
    }
    catch (err) {
        console.error('playwright list error', err);
        return res.status(500).json({ error: 'Error listando resultados', details: err?.message });
    }
};
exports.listResults = listResults;
// Endpoints filtrados por suite (tipo de prueba)
const getContractResults = async (req, res) => {
    try {
        const suite = req.body.suite || 'contract';
        const [rows] = await db_1.pool.query(`SELECT 
        id, 
        project_id, 
        test_name, 
        status, 
        duration_ms, 
        suite,
        run_date as created_at
       FROM playwright_results 
       WHERE suite = ?
       ORDER BY run_date DESC 
       LIMIT 200`, [suite]);
        return res.json({ results: rows });
    }
    catch (err) {
        console.error('❌ Error obteniendo resultados CONTRACT de Playwright:', err);
        return res.status(500).json({ error: 'Error obteniendo resultados CONTRACT', details: err?.message });
    }
};
exports.getContractResults = getContractResults;
const getControlledResponseResults = async (req, res) => {
    try {
        const suite = req.body.suite || 'controlled_response';
        const [rows] = await db_1.pool.query(`SELECT 
        id, 
        project_id, 
        test_name, 
        status, 
        duration_ms, 
        suite,
        run_date as created_at
       FROM playwright_results 
       WHERE suite = ?
       ORDER BY run_date DESC 
       LIMIT 200`, [suite]);
        return res.json({ results: rows });
    }
    catch (err) {
        console.error('❌ Error obteniendo resultados CONTROLLED RESPONSE de Playwright:', err);
        return res.status(500).json({ error: 'Error obteniendo resultados CONTROLLED RESPONSE', details: err?.message });
    }
};
exports.getControlledResponseResults = getControlledResponseResults;
const getOtherResponseResults = async (req, res) => {
    try {
        const suite = req.body.suite || 'response';
        const [rows] = await db_1.pool.query(`SELECT 
        id, 
        project_id, 
        test_name, 
        status, 
        duration_ms, 
        suite,
        run_date as created_at
       FROM playwright_results 
       WHERE suite = ?
       ORDER BY run_date DESC 
       LIMIT 200`, [suite]);
        return res.json({ results: rows });
    }
    catch (err) {
        console.error('❌ Error obteniendo resultados GENERAL de Playwright:', err);
        return res.status(500).json({ error: 'Error obteniendo resultados GENERAL', details: err?.message });
    }
};
exports.getOtherResponseResults = getOtherResponseResults;
//# sourceMappingURL=playwright.controller.js.map