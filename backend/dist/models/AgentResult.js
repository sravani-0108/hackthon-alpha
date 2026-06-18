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
exports.AgentResult = void 0;
const typeorm_1 = require("typeorm");
const Investigation_1 = require("./Investigation");
let AgentResult = class AgentResult {
};
exports.AgentResult = AgentResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AgentResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], AgentResult.prototype, "investigation_id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'enum', enum: [
            'customer_analysis', 'transaction_analysis', 'sanctions_check',
            'pep_check', 'media_analysis', 'investigation', 'decision', 'report',
        ], enumName: 'agent_type' }),
    __metadata("design:type", String)
], AgentResult.prototype, "agent_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], AgentResult.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AgentResult.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Investigation_1.Investigation, (inv) => inv.agentResults, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'investigation_id' }),
    __metadata("design:type", Investigation_1.Investigation)
], AgentResult.prototype, "investigation", void 0);
exports.AgentResult = AgentResult = __decorate([
    (0, typeorm_1.Entity)('agent_results')
], AgentResult);
exports.default = AgentResult;
//# sourceMappingURL=AgentResult.js.map