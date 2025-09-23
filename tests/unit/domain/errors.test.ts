import { describe, it, expect } from 'vitest';
import { BusinessError } from '@/domain/errors/business-error';
import { ServerError } from '@/domain/errors/server-error';

describe('Domain Errors', () => {
  describe('BusinessError', () => {
    it('should create a business error with message', () => {
      const message = 'Invalid operation';
      const error = new BusinessError(message);

      expect(error).toBeInstanceOf(BusinessError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.name).toBe('BusinessError');
    });

    it('should be throwable and catchable', () => {
      const message = 'Business rule violation';
      
      expect(() => {
        throw new BusinessError(message);
      }).toThrow(BusinessError);
      
      expect(() => {
        throw new BusinessError(message);
      }).toThrow(message);
    });
  });

  describe('ServerError', () => {
    it('should create a server error with message only', () => {
      const message = 'Database connection failed';
      const error = new ServerError(message);

      expect(error).toBeInstanceOf(ServerError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.name).toBe('ServerError');
      expect(error.originalError).toBeUndefined();
    });

    it('should create a server error with message and original error', () => {
      const message = 'Database operation failed';
      const originalError = new Error('Connection timeout');
      const error = new ServerError(message, originalError);

      expect(error.message).toBe(message);
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('ServerError');
    });

    it('should create a server error with only original error', () => {
      const originalError = new Error('Network error');
      const error = new ServerError(originalError);

      expect(error.message).toBe('Network error');
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('ServerError');
    });

    it('should be throwable and catchable', () => {
      const message = 'Internal server error';
      
      expect(() => {
        throw new ServerError(message);
      }).toThrow(ServerError);
      
      expect(() => {
        throw new ServerError(message);
      }).toThrow(message);
    });
  });
});
