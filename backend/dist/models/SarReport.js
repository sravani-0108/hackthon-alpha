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
exports.SarReport = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Case_1 = require("./Case");
const Investigation_1 = require("./Investigation");
const Customer_1 = require("./Customer");
let SarReport = class SarReport {
};
exports.SarReport = SarReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SarReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SarReport.prototype, "case_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SarReport.prototype, "investigation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SarReport.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], SarReport.prototype, "report_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SarReport.prototype, "narrative", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], SarReport.prototype, "filed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], SarReport.prototype, "filed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'Draft' }),
    __metadata("design:type", String)
], SarReport.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SarReport.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Case_1.Case, (c) => c.sarReports, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'case_id' }),
    __metadata("design:type", Case_1.Case)
], SarReport.prototype, "case", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Investigation_1.Investigation, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'investigation_id' }),
    __metadata("design:type", Investigation_1.Investigation)
], SarReport.prototype, "investigation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Customer_1.Customer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", Customer_1.Customer)
], SarReport.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'filed_by' }),
    __metadata("design:type", User_1.User)
], SarReport.prototype, "filer", void 0);
exports.SarReport = SarReport = __decorate([
    (0, typeorm_1.Entity)('sar_reports')
], SarReport);
exports.default = SarReport;
//# sourceMappingURL=SarReport.js.map