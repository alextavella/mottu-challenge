import { DomainError } from '@/domain/errors/domain.error';

// Concrete implementation for testing abstract class
class TestDomainError extends DomainError {
  readonly code = 'TEST_ERROR';
  readonly statusCode = 400;
}

describe('DomainError', () => {
  describe('constructor', () => {
    it('should create domain error with message', () => {
      const message = 'Test domain error message';
      const error = new TestDomainError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('TestDomainError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should be instance of Error', () => {
      const error = new TestDomainError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
    });

    it('should set name to constructor name', () => {
      const error = new TestDomainError('Test message');

      expect(error.name).toBe('TestDomainError');
    });

    it('should have stack trace', () => {
      const error = new TestDomainError('Test message');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestDomainError');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new TestDomainError('Test error');
      }).toThrow('Test error');

      try {
        throw new TestDomainError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(TestDomainError);
        expect(error).toBeInstanceOf(DomainError);
        expect((error as TestDomainError).code).toBe('TEST_ERROR');
      }
    });
  });
});
