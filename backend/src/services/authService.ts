import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import userRepository from '../repositories/userRepository';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole, AppError } from '../types';

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

class AuthService {
  async register({ name, email, password, role = 'bank_manager' }: RegisterInput) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const error = new Error('Email already registered.') as AppError;
      error.statusCode = 409;
      throw error;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({ name, email, password_hash, role });
    const tokens = await this.issueTokens(user);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async login({ email, password }: LoginInput) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.') as AppError;
      error.statusCode = 401;
      throw error;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const error = new Error('Invalid email or password.') as AppError;
      error.statusCode = 401;
      throw error;
    }

    const tokens = await this.issueTokens(user);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async logout(userId: number) {
    const repo = AppDataSource.getRepository(User);
    await repo.update(userId, { refresh_token: null });
    return { message: 'Logged out successfully.' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as { id: number; type: string };
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const user = await userRepository.findByEmailWithToken(decoded.id);
      if (!user || user.refresh_token !== refreshToken) {
        const error = new Error('Invalid refresh token.') as AppError;
        error.statusCode = 401;
        throw error;
      }

      const tokens = await this.issueTokens(user);
      return tokens;
    } catch {
      const error = new Error('Invalid or expired refresh token.') as AppError;
      error.statusCode = 401;
      throw error;
    }
  }

  private async issueTokens(user: User) {
    const signOptions: SignOptions = {
      expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    };
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      signOptions
    );

    const refreshSignOptions: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    };
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.jwt.secret,
      refreshSignOptions
    );

    const repo = AppDataSource.getRepository(User);
    await repo.update(user.id, { refresh_token: refreshToken });

    return { token, refreshToken };
  }
}

export default new AuthService();
