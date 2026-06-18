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
exports.Case = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Investigation_1 = require("./Investigation");
const Alert_1 = require("./Alert");
const Customer_1 = require("./Customer");
const SarReport_1 = require("./SarReport");
let Case = class Case {
};
exports.Case = Case;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Case.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Case.prototype, "case_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Case.prototype, "investigation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Case.prototype, "alert_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Case.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Case.prototype, "assigned_to", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Open', 'Assigned', 'Under Review', 'Closed', 'SAR Filed'],
        enumName: 'case_status',
        default: 'Open',
    }),
    __metadata("design:type", String)
], Case.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Low', 'Medium', 'High', 'Critical'],
        enumName: 'alert_severity',
        default: 'Medium',
    }),
    __metadata("design:type", String)
], Case.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Case.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Case.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Case.prototype, "closed_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Investigation_1.Investigation, (inv) => inv.cases, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'investigation_id' }),
    __metadata("design:type", Investigation_1.Investigation)
], Case.prototype, "investigation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Alert_1.Alert, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'alert_id' }),
    __metadata("design:type", Alert_1.Alert)
], Case.prototype, "alert", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Customer_1.Customer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", Customer_1.Customer)
], Case.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to' }),
    __metadata("design:type", User_1.User)
], Case.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SarReport_1.SarReport, (sar) => sar.case),
    __metadata("design:type", Array)
], Case.prototype, "sarReports", void 0);
exports.Case = Case = __decorate([
    (0, typeorm_1.Entity)('cases')
], Case);
exports.default = Case;
//# sourceMappingURL=Case.js.map