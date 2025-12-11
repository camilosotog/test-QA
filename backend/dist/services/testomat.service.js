"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestomatService = void 0;
const db_1 = require("../config/db");
class TestomatService {
    async getAllProjects() {
        try {
            const [projects] = await db_1.db.query('SELECT * FROM test_projects ORDER BY created_at DESC');
            return Array.isArray(projects) ? projects : [];
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async createProject(name, description, projectId) {
        try {
            const [result] = await db_1.db.query('INSERT INTO test_projects (name, description, project_id) VALUES (?, ?, ?)', [name, description || null, projectId || null]);
            return result.insertId;
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async getSuitesByProject(projectId) {
        try {
            const [suites] = await db_1.db.query('SELECT * FROM test_suites WHERE test_project_id = ? ORDER BY order_index', [projectId]);
            return Array.isArray(suites) ? suites : [];
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async createSuite(testProjectId, name, description, status = 'active', orderIndex = 0) {
        try {
            const [result] = await db_1.db.query('INSERT INTO test_suites (test_project_id, name, description, status, order_index) VALUES (?, ?, ?, ?, ?)', [testProjectId, name, description || null, status, orderIndex]);
            return result.insertId;
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async getCasesByBuite(suiteId, filters) {
        try {
            let query = 'SELECT * FROM test_cases WHERE test_suite_id = ?';
            const params = [suiteId];
            if (filters?.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }
            if (filters?.testType) {
                query += ' AND test_type = ?';
                params.push(filters.testType);
            }
            if (filters?.automationStatus) {
                query += ' AND automation_status = ?';
                params.push(filters.automationStatus);
            }
            query += ' ORDER BY created_at DESC';
            const [cases] = await db_1.db.query(query, params);
            return Array.isArray(cases) ? cases : [];
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async createTestCase(testCase, createdBy) {
        try {
            const [result] = await db_1.db.query(`INSERT INTO test_cases (
          test_suite_id, test_project_id, name, description, preconditions,
          steps, expected_result, priority, status, automation_status,
          automation_tool, test_type, requirement_id, tags, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                testCase.test_suite_id, testCase.test_project_id, testCase.name, testCase.description || null,
                testCase.preconditions || null, testCase.steps ? JSON.stringify(testCase.steps) : null,
                testCase.expected_result || null, testCase.priority || 'medium', testCase.status || 'draft',
                testCase.automation_status || 'manual', testCase.automation_tool || null, testCase.test_type || 'functional',
                testCase.requirement_id || null, testCase.tags ? JSON.stringify(testCase.tags) : null, createdBy || null,
            ]);
            return result.insertId;
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async updateTestCase(caseId, updates, updatedBy) {
        try {
            const fields = [];
            const values = [];
            if (updates.status) {
                fields.push('status = ?');
                values.push(updates.status);
            }
            if (updates.priority) {
                fields.push('priority = ?');
                values.push(updates.priority);
            }
            if (updates.automation_status) {
                fields.push('automation_status = ?');
                values.push(updates.automation_status);
            }
            if (updates.tags) {
                fields.push('tags = ?');
                values.push(JSON.stringify(updates.tags));
            }
            if (fields.length === 0)
                return;
            fields.push('updated_at = NOW()');
            values.push(caseId);
            const query = `UPDATE test_cases SET ${fields.join(', ')} WHERE id = ?`;
            await db_1.db.query(query, values);
            if (updates.status || updates.priority || updates.automation_status) {
                await this.logTestCaseChange(caseId, updates, updatedBy);
            }
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async logTestCaseChange(caseId, updates, changedBy) {
        try {
            const query = `
        INSERT INTO test_case_history (test_case_id, field_name, new_value, changed_by)
        VALUES (?, ?, ?, ?)
      `;
            if (updates.status) {
                await db_1.db.query(query, [caseId, 'status', updates.status, changedBy || null]);
            }
            if (updates.priority) {
                await db_1.db.query(query, [caseId, 'priority', updates.priority, changedBy || null]);
            }
            if (updates.automation_status) {
                await db_1.db.query(query, [caseId, 'automation_status', updates.automation_status, changedBy || null]);
            }
        }
        catch (error) {
            console.error('Service error:', error);
        }
    }
    async createExecution(testProjectId, executionName, environment, executorId) {
        try {
            const [result] = await db_1.db.query(`INSERT INTO test_executions (
          test_project_id, execution_name, execution_status, environment, executor_id, start_date
        ) VALUES (?, ?, 'in_progress', ?, ?, NOW())`, [testProjectId, executionName || `Execution ${new Date().toISOString().split('T')[0]}`, environment || null, executorId || null]);
            return result.insertId;
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async getExecutionWithResults(executionId) {
        try {
            const [executions] = await db_1.db.query('SELECT * FROM test_executions WHERE id = ?', [executionId]);
            const execList = Array.isArray(executions) ? executions : [];
            if (execList.length === 0) {
                throw new Error('Execution not found');
            }
            const [results] = await db_1.db.query(`SELECT tr.*, tc.name as test_case_name
         FROM test_results tr
         JOIN test_cases tc ON tr.test_case_id = tc.id
         WHERE tr.test_execution_id = ?
         ORDER BY tr.executed_at DESC`, [executionId]);
            return {
                ...execList[0],
                results: Array.isArray(results) ? results : [],
            };
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async recordTestResult(result, executedBy) {
        try {
            const [insertResult] = await db_1.db.query(`INSERT INTO test_results (
          test_execution_id, test_case_id, test_project_id, result_status,
          execution_time, error_message, actual_result, screenshot_url, log_url, executed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                result.test_execution_id, result.test_case_id, result.test_project_id, result.result_status,
                result.execution_time || null, result.error_message || null, result.actual_result || null,
                result.screenshot_url || null, result.log_url || null, executedBy || null,
            ]);
            await this.updateExecutionStatistics(result.test_execution_id);
            return insertResult.insertId;
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async updateExecutionStatistics(executionId) {
        try {
            const [stats] = await db_1.db.query(`SELECT COUNT(*) as total,
                SUM(CASE WHEN result_status = 'pass' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN result_status = 'fail' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN result_status = 'skip' THEN 1 ELSE 0 END) as skipped,
                SUM(CASE WHEN result_status = 'blocked' THEN 1 ELSE 0 END) as blocked
         FROM test_results WHERE test_execution_id = ?`, [executionId]);
            const stat = Array.isArray(stats) ? stats[0] : stats;
            const successRate = stat.total > 0 ? Math.round((stat.passed / stat.total) * 100) : 0;
            await db_1.db.query(`UPDATE test_executions
         SET total_cases = ?, passed_cases = ?, failed_cases = ?, skipped_cases = ?, blocked_cases = ?, success_rate = ?
         WHERE id = ?`, [stat.total, stat.passed || 0, stat.failed || 0, stat.skipped || 0, stat.blocked || 0, successRate, executionId]);
        }
        catch (error) {
            console.error('Service error:', error);
        }
    }
    async completeExecution(executionId) {
        try {
            await db_1.db.query('UPDATE test_executions SET execution_status = ?, end_date = NOW() WHERE id = ?', ['completed', executionId]);
            await this.updateExecutionStatistics(executionId);
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async getProjectAnalytics(projectId) {
        try {
            const [totalCases] = await db_1.db.query('SELECT COUNT(*) as total FROM test_cases WHERE test_project_id = ?', [projectId]);
            const [casesByType] = await db_1.db.query('SELECT test_type, COUNT(*) as count FROM test_cases WHERE test_project_id = ? GROUP BY test_type', [projectId]);
            const [automationBreakdown] = await db_1.db.query('SELECT automation_status, COUNT(*) as count FROM test_cases WHERE test_project_id = ? GROUP BY automation_status', [projectId]);
            const [recentExecutions] = await db_1.db.query(`SELECT id, execution_name, execution_status, success_rate, total_cases, passed_cases, failed_cases, created_at
         FROM test_executions WHERE test_project_id = ? ORDER BY created_at DESC LIMIT 5`, [projectId]);
            return {
                total_cases: (Array.isArray(totalCases) ? totalCases[0] : totalCases).total,
                cases_by_type: Array.isArray(casesByType) ? casesByType : [],
                automation_breakdown: Array.isArray(automationBreakdown) ? automationBreakdown : [],
                recent_executions: Array.isArray(recentExecutions) ? recentExecutions : [],
            };
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async searchTestCases(projectId, query) {
        try {
            const searchTerm = `%${query}%`;
            const [results] = await db_1.db.query(`SELECT * FROM test_cases
         WHERE test_project_id = ? AND (name LIKE ? OR description LIKE ? OR requirement_id LIKE ?)
         ORDER BY created_at DESC`, [projectId, searchTerm, searchTerm, searchTerm]);
            return Array.isArray(results) ? results : [];
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async getRecentExecutions(projectId, limit = 10) {
        try {
            const [executions] = await db_1.db.query('SELECT * FROM test_executions WHERE test_project_id = ? ORDER BY created_at DESC LIMIT ?', [projectId, limit]);
            return Array.isArray(executions) ? executions : [];
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
    async exportTestCases(projectId) {
        try {
            const [cases] = await db_1.db.query(`SELECT tc.*, ts.name as suite_name
         FROM test_cases tc
         JOIN test_suites ts ON tc.test_suite_id = ts.id
         WHERE tc.test_project_id = ?
         ORDER BY ts.order_index, tc.created_at`, [projectId]);
            return {
                export_date: new Date().toISOString(),
                total_cases: (Array.isArray(cases) ? cases.length : 0),
                cases: Array.isArray(cases) ? cases : [],
            };
        }
        catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
}
exports.TestomatService = TestomatService;
exports.default = new TestomatService();
//# sourceMappingURL=testomat.service.js.map