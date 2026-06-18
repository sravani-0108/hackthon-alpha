"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Investigation = void 0;
const typeorm_1 = require("typeorm");
const Alert_1 = require("./Alert");
const User_1 = require("./User");
const AgentResult_1 = require("./AgentResult");
const Case_1 = require("./Case");
let Investigation = class Investigation {
};
exports.Investigation = Investigation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Investigation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Investigation.prototype, "alert_id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Investigation.prototype, "manager_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Investigation.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Open', 'Under Investigation', 'Legitimate', 'Escalated', 'Closed', 'Completed'],
        enumName: 'investigation_status',
        default: 'Open',
    }),
    __metadata("design:type", String)
], Investigation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['CLEAR', 'ESCALATE', 'SAR'],
        enumName: 'ai_decision_type',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Investigation.prototype, "ai_decision", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Investigation.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Investigation.prototype, "report_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Investigation.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Investigation.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Investigation.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Alert_1.Alert, (alert) => alert.investigations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'alert_id' }),
    __metadata("design:type", Alert_1.Alert)
], Investigation.prototype, "alert", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.investigations, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'manager_id' }),
    __metadata("design:type", User_1.User)
], Investigation.prototype, "manager", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AgentResult_1.AgentResult, (result) => result.investigation),
    __metadata("design:type", Array)
], Investigation.prototype, "agentResults", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Case_1.Case, (c) => c.investigation),
    __metadata("design:type", Array)
], Investigation.prototype, "cases", void 0);
exports.Investigation = Investigation = __decorate([
    (0, typeorm_1.Entity)('investigations')
], Investigation);
exports.default = Investigation;
//# sourceMappingURL=Investigation.js.map