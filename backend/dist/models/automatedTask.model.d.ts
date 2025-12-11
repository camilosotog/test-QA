export interface AutomatedTask {
    id?: number;
    task_name: string;
    state: string;
    qa?: string;
}
export declare class AutomatedTaskModel {
    static findByName(task_name: string): Promise<AutomatedTask | null>;
    static getAll(): Promise<AutomatedTask[]>;
    static create(task: AutomatedTask): Promise<any>;
    static update(id: number, task: AutomatedTask): Promise<any>;
    static delete(id: number): Promise<any>;
}
//# sourceMappingURL=automatedTask.model.d.ts.map