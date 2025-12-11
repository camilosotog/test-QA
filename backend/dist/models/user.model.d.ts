export interface User {
    id?: number;
    email: string;
    name: string;
    password: string;
    user_role: string;
    online?: boolean;
}
export declare class UserModel {
    static getAll(): Promise<User[]>;
    static getOnline(): Promise<User[]>;
    static getById(id: number): Promise<User | null>;
    static create(user: User): Promise<any>;
    static update(id: number, user: Partial<User>): Promise<any>;
    static delete(id: number): Promise<any>;
}
//# sourceMappingURL=user.model.d.ts.map