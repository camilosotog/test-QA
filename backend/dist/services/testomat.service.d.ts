import { TestCase, TestResult } from '../models/testomat.model';
export declare class TestomatService {
    getAllProjects(): Promise<any[]>;
    createProject(name: string, description?: string, projectId?: number): Promise<any>;
    getSuitesByProject(projectId: number): Promise<any[]>;
    createSuite(testProjectId: number, name: string, description?: string, status?: string, orderIndex?: number): Promise<any>;
    getCasesByBuite(suiteId: number, filters?: {
        status?: string;
        testType?: string;
        automationStatus?: string;
    }): Promise<any[]>;
    createTestCase(testCase: TestCase, createdBy?: number): Promise<any>;
    updateTestCase(caseId: number, updates: Partial<TestCase>, updatedBy?: number): Promise<void>;
    private logTestCaseChange;
    createExecution(testProjectId: number, executionName: string, environment?: string, executorId?: number): Promise<any>;
    getExecutionWithResults(executionId: number): Promise<any>;
    recordTestResult(result: TestResult, executedBy?: number): Promise<any>;
    updateExecutionStatistics(executionId: number): Promise<void>;
    completeExecution(executionId: number): Promise<void>;
    getProjectAnalytics(projectId: number): Promise<{
        total_cases: any;
        cases_by_type: any[];
        automation_breakdown: any[];
        recent_executions: any[];
    }>;
    searchTestCases(projectId: number, query: string): Promise<any[]>;
    getRecentExecutions(projectId: number, limit?: number): Promise<any[]>;
    exportTestCases(projectId: number): Promise<{
        export_date: string;
        total_cases: number;
        cases: any[];
    }>;
}
declare const _default: TestomatService;
export default _default;
//# sourceMappingURL=testomat.service.d.ts.map