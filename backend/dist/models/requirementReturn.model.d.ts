export interface RequirementReturn {
    id?: number;
    po_name: string;
    task_code: string;
    return_reason: string;
    created_at?: string;
    is_active?: number;
}
declare class RequirementReturnModel {
    static create(data: RequirementReturn): Promise<number>;
    static getById(id: number): Promise<RequirementReturn | null>;
    static list(filters?: Partial<RequirementReturn>, limit?: number): Promise<RequirementReturn[]>;
    static listByDateRange(startDate: string, endDate: string): Promise<RequirementReturn[]>;
    static getStatisticsByPO(): Promise<any[]>;
    static getStatisticsByMonth(year?: number, month?: number): Promise<any[]>;
    static update(id: number, patch: Partial<RequirementReturn>): Promise<boolean>;
    static delete(id: number): Promise<boolean>;
}
export default RequirementReturnModel;
//# sourceMappingURL=requirementReturn.model.d.ts.map