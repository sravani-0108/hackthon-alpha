"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const userRepository_1 = __importDefault(require("../repositories/userRepository"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
class AuthService {
    async register({ name, email, password, role = 'bank_manager' }) {
        const existing = await userRepository_1.default.findByEmail(email);
        if (existing) {
            const error = new Error('Email already registered.');
            error.statusCode = 409;
            throw error;
        }
        const password_hash = await bcrypt_1.default.hash(password, 12);
        const user = await userRepository_1.default.create({ name, email, password_hash, role });
        const tokens = await this.issueTokens(user);
        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            ...tokens,
        };
    }
    async login({ email, password }) {
        const user = await userRepository_1.default.findByEmail(email);
        if (!user) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            throw error;
        }
        const isValid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isValid) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            throw error;
        }
        const tokens = await this.issueTokens(user);
        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            ...tokens,
        };
    }
    async logout(userId) {
        const repo = database_1.AppDataSource.getRepository(User_1.User);
        await repo.update(userId, { refresh_token: null });
        return { message: 'Logged out successfully.' };
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.default.jwt.secret);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }
            const user = await userRepository_1.default.findByEmailWithToken(decoded.id);
            if (!user || user.refresh_token !== refreshToken) {
                const error = new Error('Invalid refresh token.');
                error.statusCode = 401;
                throw error;
            }
            const tokens = await this.issueTokens(user);
            return tokens;
        }
        catch {
            const error = new Error('Invalid or expired refresh token.');
            error.statusCode = 401;
            throw error;
        }
    }
    async issueTokens(user) {
        const signOptions = {
            expiresIn: config_1.default.jwt.expiresIn,
        };
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, config_1.default.jwt.secret, signOptions);
        const refreshSignOptions = {
            expiresIn: config_1.default.jwt.refreshExpiresIn,
        };
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, type: 'refresh' }, config_1.default.jwt.secret, refreshSignOptions);
        const repo = database_1.AppDataSource.getRepository(User_1.User);
        await repo.update(user.id, { refresh_token: refreshToken });
        return { token, refreshToken };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=authService.js.map