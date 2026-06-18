import { UserRole } from '../types';
interface RegisterInput {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
}
interface LoginInput {
    email: string;
    password: string;
}
declare class AuthService {
    register({ name, email, password, role }: RegisterInput): Promise<{
        token: string;
        refreshToken: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: UserRole;
        };
    }>;
    login({ email, password }: LoginInput): Promise<{
        token: string;
        refreshToken: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: UserRole;
        };
    }>;
    logout(userId: number): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    private issueTokens;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=authService.d.ts.map