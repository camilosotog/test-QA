export interface TestProject {
    id?: number;
    name: string;
    description?: string;
    project_id?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface TestSuite {
    id?: number;
    test_project_id: number;
    name: string;
    description?: string;
    status: 'active' | 'inactive' | 'deprecated';
    order_index?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface TestStep {
    number: number;
    action: string;
    expected?: string;
}
export interface TestCase {
    id?: number;
    test_suite_id: number;
    test_project_id: number;
    name: string;
    description?: string;
    preconditions?: string;
    steps?: TestStep[];
    expected_result?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'draft' | 'ready' | 'deprecated';
    automation_status: 'manual' | 'automated' | 'semi-automated';
    automation_tool?: string;
    test_type: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance' | 'security';
    requirement_id?: string;
    tags?: string[];
    created_by?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface TestExecution {
    id?: number;
    test_project_id: number;
    execution_name?: string;
    execution_status: 'pending' | 'in_progress' | 'completed' | 'aborted';
    environment?: string;
    executor_id?: number;
    start_date?: Date;
    end_date?: Date;
    total_cases?: number;
    passed_cases?: number;
    failed_cases?: number;
    skipped_cases?: number;
    success_rate?: number;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface TestResult {
    id?: number;
    test_execution_id: number;
    test_case_id: number;
    test_project_id: number;
    result_status: 'pass' | 'fail' | 'skip' | 'blocked';
    execution_time?: number;
    error_message?: string;
    actual_result?: string;
    screenshot_url?: string;
    log_url?: string;
    executed_by?: number;
    executed_at?: Date;
}
export interface TestomatImport {
    id?: number;
    test_project_id: number;
    import_source: string;
    total_imported?: number;
    total_suites?: number;
    total_cases?: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_message?: string;
    mapping_config?: any;
    imported_at?: Date;
    created_at?: Date;
}
export interface TestCaseHistory {
    id?: number;
    test_case_id: number;
    field_name: string;
    old_value?: string;
    new_value?: string;
    changed_by?: number;
    changed_at?: Date;
}
export interface TestomatImportRequest {
    projectName: string;
    apiKey: string;
    workspaceId: string;
    suiteIds?: number[];
}
export interface ExecuteTestsRequest {
    test_project_id: number;
    suite_ids?: number[];
    case_ids?: number[];
    environment?: string;
    executor_id?: number;
}
export interface ExecutionResponse {
    execution_id: number;
    total_cases: number;
    status: string;
    start_date: Date;
}
//# sourceMappingURL=testomat.model.d.ts.map