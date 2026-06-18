import { AppDataSource } from '../config/database';
import { User, UserCreationAttributes } from '../models/User';

class UserRepository {
  private repo() {
    return AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo().findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.repo().findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'created_at'],
    });
  }

  async create(userData: UserCreationAttributes): Promise<User> {
    const user = this.repo().create(userData);
    return this.repo().save(user);
  }

  async findAllManagers(): Promise<User[]> {
    return this.repo().find({
      where: { role: 'bank_manager' },
      select: ['id', 'name', 'email'],
    });
  }

  async findByEmailWithToken(id: number): Promise<User | null> {
    return this.repo().findOne({ where: { id } });
  }

  async updateRefreshToken(id: number, refreshToken: string | null): Promise<void> {
    await this.repo().update(id, { refresh_token: refreshToken });
  }
}

export default new UserRepository();
