import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from './index';
import {
  User,
  Customer,
  Account,
  Transaction,
  Alert,
  AlertEvidence,
  Investigation,
  AgentResult,
  Case,
  SarReport,
  Notification,
} from '../models';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false,
  logging: config.env === 'development',
  extra: {
    connectionTimeoutMillis: 30000,
  },
  entities: [
    User,
    Customer,
    Account,
    Transaction,
    Alert,
    AlertEvidence,
    Investigation,
    AgentResult,
    Case,
    SarReport,
    Notification,
  ],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};

export default AppDataSource;
