import { User, UserCreationAttributes } from '../models/User';
declare class UserRepository {
    private repo;
    findByEmail(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    create(userData: UserCreationAttributes): Promise<User>;
    findAllManagers(): Promise<User[]>;
    findByEmailWithToken(id: number): Promise<User | null>;
    updateRefreshToken(id: number, refreshToken: string | null): Promise<void>;
}
declare const _default: UserRepository;
export default _default;
//# sourceMappingURL=userRepository.d.ts.map