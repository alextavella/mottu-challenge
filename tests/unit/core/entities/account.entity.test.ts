import { Account, CreateAccountData } from '@/core/entities/account.entity';

describe('Account Entity', () => {
  describe('CreateAccountData type', () => {
    it('should define correct structure for account creation', () => {
      const createAccountData: CreateAccountData = {
        name: 'John Doe',
        document: '12345678901',
        email: 'john.doe@example.com',
      };

      expect(createAccountData.name).toBe('John Doe');
      expect(createAccountData.document).toBe('12345678901');
      expect(createAccountData.email).toBe('john.doe@example.com');
    });

    it('should accept different name formats', () => {
      const testCases: CreateAccountData[] = [
        {
          name: 'John',
          document: '123',
          email: 'john@test.com',
        },
        {
          name: 'Maria Silva Santos',
          document: '98765432100',
          email: 'maria@example.org',
        },
        {
          name: 'José da Silva Jr.',
          document: '11111111111',
          email: 'jose.jr@company.co.uk',
        },
      ];

      testCases.forEach((data) => {
        expect(typeof data.name).toBe('string');
        expect(typeof data.document).toBe('string');
        expect(typeof data.email).toBe('string');
      });
    });

    it('should accept different document formats', () => {
      const documentFormats = [
        '12345678901', // CPF format
        '123.456.789-01', // CPF with formatting
        '12.345.678/0001-90', // CNPJ format
        '98765432100', // Different CPF
      ];

      documentFormats.forEach((document) => {
        const data: CreateAccountData = {
          name: 'Test User',
          document,
          email: 'test@example.com',
        };

        expect(data.document).toBe(document);
      });
    });

    it('should accept different email formats', () => {
      const emailFormats = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@subdomain.example.org',
        'simple@test.io',
      ];

      emailFormats.forEach((email) => {
        const data: CreateAccountData = {
          name: 'Test User',
          document: '12345678901',
          email,
        };

        expect(data.email).toBe(email);
      });
    });

    it('should handle empty strings', () => {
      const data: CreateAccountData = {
        name: '',
        document: '',
        email: '',
      };

      expect(data.name).toBe('');
      expect(data.document).toBe('');
      expect(data.email).toBe('');
    });

    it('should handle special characters in fields', () => {
      const data: CreateAccountData = {
        name: 'João José da Silva-Santos',
        document: '123.456.789-01',
        email: 'joao.jose+test@example-domain.com.br',
      };

      expect(data.name).toContain('João');
      expect(data.name).toContain('-');
      expect(data.document).toContain('.');
      expect(data.document).toContain('-');
      expect(data.email).toContain('+');
      expect(data.email).toContain('-');
    });
  });

  describe('Account type (from Prisma)', () => {
    it('should be available as exported type', () => {
      // This test ensures the Account type is properly exported
      // The actual structure comes from Prisma, so we just verify the export works
      const accountTypeCheck = (account: Account) => {
        return account;
      };

      expect(typeof accountTypeCheck).toBe('function');
    });
  });
});
