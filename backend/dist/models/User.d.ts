import { UserRole } from '../types';
import { Investigation } from './Investigation';
import { Notification } from './Notification';
export declare class User {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    refresh_token: string | null;
    role: UserRole;
    created_at: Date;
    investigations?: Investigation[];
    notifications?: Notification[];
}
export type UserCreationAttributes = Pick<User, 'name' | 'email' | 'password_hash'> & {
    role?: UserRole;
};
export default User;
//# sourceMappingURL=User.d.ts.map