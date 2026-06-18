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
exports.Alert = void 0;
const typeorm_1 = require("typeorm");
const Customer_1 = require("./Customer");
const Transaction_1 = require("./Transaction");
const Investigation_1 = require("./Investigation");
const AlertEvidence_1 = require("./AlertEvidence");
let Alert = class Alert {
};
exports.Alert = Alert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Alert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Alert.prototype, "alert_code", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Alert.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Alert.prototype, "transaction_id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Alert.prototype, "alert_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Alert.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Alert.prototype, "risk_score", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Low', 'Medium', 'High', 'Critical'],
        enumName: 'alert_severity',
        default: 'Medium',
    }),
    __metadata("design:type", String)
], Alert.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Open', 'Under Investigation', 'Escalated', 'Closed', 'Cleared'],
        enumName: 'alert_status',
        default: 'Open',
    }),
    __metadata("design:type", String)
], Alert.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Alert.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Customer_1.Customer, (customer) => customer.alerts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", Customer_1.Customer)
], Alert.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Transaction_1.Transaction, (transaction) => transaction.alerts, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'transaction_id' }),
    __metadata("design:type", Transaction_1.Transaction)
], Alert.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Investigation_1.Investigation, (investigation) => investigation.alert),
    __metadata("design:type", Array)
], Alert.prototype, "investigations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AlertEvidence_1.AlertEvidence, (evidence) => evidence.alert),
    __metadata("design:type", Array)
], Alert.prototype, "evidence", void 0);
exports.Alert = Alert = __decorate([
    (0, typeorm_1.Entity)('alerts')
], Alert);
exports.default = Alert;
//# sourceMappingURL=Alert.js.map