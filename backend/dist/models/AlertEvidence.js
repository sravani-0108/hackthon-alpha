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
exports.AlertEvidence = void 0;
const typeorm_1 = require("typeorm");
const Alert_1 = require("./Alert");
let AlertEvidence = class AlertEvidence {
};
exports.AlertEvidence = AlertEvidence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AlertEvidence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], AlertEvidence.prototype, "alert_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AlertEvidence.prototype, "evidence_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AlertEvidence.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], AlertEvidence.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AlertEvidence.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AlertEvidence.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Alert_1.Alert, (alert) => alert.evidence, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'alert_id' }),
    __metadata("design:type", Alert_1.Alert)
], AlertEvidence.prototype, "alert", void 0);
exports.AlertEvidence = AlertEvidence = __decorate([
    (0, typeorm_1.Entity)('alert_evidence')
], AlertEvidence);
exports.default = AlertEvidence;
//# sourceMappingURL=AlertEvidence.js.map