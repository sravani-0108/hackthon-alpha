"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const User_1 = require("../models/User");
class UserRepository {
    repo() {
        return database_1.AppDataSource.getRepository(User_1.User);
    }
    async findByEmail(email) {
        return this.repo().findOne({ where: { email } });
    }
    async findById(id) {
        return this.repo().findOne({
            where: { id },
            select: ['id', 'name', 'email', 'role', 'created_at'],
        });
    }
    async create(userData) {
        const user = this.repo().create(userData);
        return this.repo().save(user);
    }
    async findAllManagers() {
        return this.repo().find({
            where: { role: 'bank_manager' },
            select: ['id', 'name', 'email'],
        });
    }
    async findByEmailWithToken(id) {
        return this.repo().findOne({ where: { id } });
    }
    async updateRefreshToken(id, refreshToken) {
        await this.repo().update(id, { refresh_token: refreshToken });
    }
}
exports.default = new UserRepository();
//# sourceMappingURL=userRepository.js.map