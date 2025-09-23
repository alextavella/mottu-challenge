import { AccountRepository } from '@/domain/repositories/account-repository';
import { MovementRepository } from '@/domain/repositories/movement-repository';
import { PrismaAccountRepository } from '@/infrastructure/repositories/prisma-account-repository';
import { PrismaMovementRepository } from '@/infrastructure/repositories/prisma-movement-repository';
import { PrismaClient } from '@prisma/client';

export class Container {
  private static instance: Container;
  private prismaClient: PrismaClient;
  private accountRepository: AccountRepository;
  private movementRepository: MovementRepository;

  private constructor() {
    // Use appropriate client based on environment
    if (process.env.NODE_ENV === 'test') {
      this.prismaClient = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'file:./test.db',
          },
        },
      });
    } else {
      this.prismaClient = new PrismaClient();
    }

    this.accountRepository = new PrismaAccountRepository(this.prismaClient);
    this.movementRepository = new PrismaMovementRepository(this.prismaClient);
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

  getAccountRepository(): AccountRepository {
    return this.accountRepository;
  }

  getMovementRepository(): MovementRepository {
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
