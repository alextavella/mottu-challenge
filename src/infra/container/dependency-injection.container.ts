import { AccountRepository } from '@/core/repositories/account-repository';
import { BalanceRepository } from '@/core/repositories/balance-repository';
import { LedgerLogRepository } from '@/core/repositories/legder-log-repository';
import { MovementRepository } from '@/core/repositories/movement-repository';
import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { IBalanceRepository } from '@/domain/contracts/repositories/balance-repository';
import { ILedgerLogRepository } from '@/domain/contracts/repositories/ledger-log-repository';
import { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';
import { PrismaClient } from '@prisma/client';

export class Container {
  private static instance: Container;
  private prismaClient: PrismaClient;
  private accountRepository: IAccountRepository;
  private balanceRepository: IBalanceRepository;
  private movementRepository: IMovementRepository;
  private ledgerLogRepository: ILedgerLogRepository;

  private constructor() {
    this.prismaClient = new PrismaClient();
    this.accountRepository = new AccountRepository(this.prismaClient);
    this.balanceRepository = new BalanceRepository(this.prismaClient);
    this.movementRepository = new MovementRepository(this.prismaClient);
    this.ledgerLogRepository = new LedgerLogRepository(this.prismaClient);
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }

  getAccountRepository(): IAccountRepository {
    return this.accountRepository;
  }

  getBalanceRepository(): IBalanceRepository {
    return this.balanceRepository;
  }

  getMovementRepository(): IMovementRepository {
    return this.movementRepository;
  }

  getLedgerLogRepository(): ILedgerLogRepository {
    return this.ledgerLogRepository;
  }

  async disconnect(): Promise<void> {
    await this.prismaClient.$disconnect();
  }
}

// Factory functions for easy access
export const getContainer = () => Container.getInstance();
export const getAccountRepository = () => getContainer().getAccountRepository();
export const getBalanceRepository = () => getContainer().getBalanceRepository();
export const getMovementRepository = () =>
  getContainer().getMovementRepository();
export const getLedgerLogRepository = () =>
  getContainer().getLedgerLogRepository();
export const getPrismaClient = () => getContainer().getPrismaClient();
