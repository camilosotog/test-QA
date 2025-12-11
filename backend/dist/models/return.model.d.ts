export interface Return {
    id?: number;
    po_name: string;
    task_code: string;
    return_reason: string;
    created_at?: Date;
    is_active?: number;
}
export declare class ReturnModel {
    static create(data: Return): Promise<number>;
    static getById(id: number): Promise<Return | null>;
    static list(filters?: {
        po_name?: string;
        task_code?: string;
    }, limit?: number): Promise<Return[]>;
    static listByDateRange(startDate: string, endDate: string): Promise<Return[]>;
    static getStatisticsByPO(): Promise<any[]>;
    static getStatisticsByMonth(year?: number, month?: number): Promise<any[]>;
    static update(id: number, patch: Partial<Return>): Promise<boolean>;
    static delete(id: number): Promise<boolean>;
}
//# sourceMappingURL=return.model.d.ts.map