export interface Bug {
    id?: number;
    title: string;
    description?: string | null;
    type?: string | null;
    reporter_id?: number | null;
    assignee_id?: number | null;
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
    priority?: 'BAJA' | 'MEDIA' | 'ALTA';
    severity?: 'NO CRITICO' | 'CRITICO';
    steps_to_reproduce?: string | null;
    environment?: string | null;
    attachments?: any;
    sprint_id?: number | null;
    created_at?: string;
    updated_at?: string;
    resolved_at?: string | null;
    is_active?: number;
}
declare class BugModel {
    static create(bug: Bug): Promise<number>;
    static getById(id: number): Promise<Bug | null>;
    static list(filters?: Partial<Bug>): Promise<Bug[]>;
    static update(id: number, patch: Partial<Bug>): Promise<boolean>;
    static remove(id: number): Promise<boolean>;
}
export default BugModel;
//# sourceMappingURL=bug.model.d.ts.map