import { AccountRepository } from '@/adapters/repositories/account-repository';
import { MovementRepository } from '@/adapters/repositories/movement-repository';
import { IAccountRepository } from '@/core/contracts/repositories/account-repository';
import { IMovementRepository } from '@/core/contracts/repositories/movement-repository';
import { PrismaClient } from '@prisma/client';

export class Container {
  private static instance: Container;
  private prismaClient: PrismaClient;
  private accountRepository: IAccountRepository;
  private movementRepository: IMovementRepository;

  private constructor() {
    this.prismaClient = new PrismaClient();
    this.accountRepository = new AccountRepository(this.prismaClient);
    this.movementRepository = new MovementRepository(this.prismaClient);
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

  getMovementRepository(): IMovementRepository {
    return this.movementRepository;
  }

  async disconnect(): Promise<void> {
    await this.prismaClient.$disconnect();
  }
}

// Factory functions for easy access
export const getContainer = () => Container.getInstance();
export const getAccountRepository = () => getContainer().getAccountRepository();
export const getMovementRepository = () =>
  getContainer().getMovementRepository();
export const getPrismaClient = () => getContainer().getPrismaClient();
