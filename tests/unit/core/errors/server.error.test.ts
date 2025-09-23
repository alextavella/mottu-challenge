import { ServerError, throwServerError } from '@/core/errors/server.error';
import { describe, expect, it } from 'vitest';

describe('ServerError', () => {
  describe('constructor overloads', () => {
    it('should create server error with message only', () => {
      const message = 'Database connection failed';
      const error = new ServerError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('SERVER_ERROR');
      expect(error.originalError).toBeUndefined();
    });

    it('should create server error with original error only', () => {
      const originalError = new Error('Original error message');
      const error = new ServerError(originalError);

      expect(error.message).toBe(originalError.message);
      expect(error.name).toBe('SERVER_ERROR');
      expect(error.originalError).toBe(originalError);
    });

    it('should handle Error object with empty message', () => {
      const originalError = new Error('');
      const error = new ServerError(originalError);

      expect(error.message).toBe('');
      expect(error.originalError).toBe(originalError);
    });

    it('should handle Error object with complex message', () => {
      const complexError = new TypeError('Complex type error with details');
      const error = new ServerError(complexError);

      expect(error.message).toBe('Complex type error with details');
      expect(error.originalError).toBe(complexError);
      expect(error.originalError instanceof TypeError).toBe(true);
    });

    it('should create server error with message and original error', () => {
      const message = 'Custom server error message';
      const originalError = new Error('Original error');
      const error = new ServerError(message, originalError);

      expect(error.message).toBe(message);
      expect(error.name).toBe('SERVER_ERROR');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('error properties', () => {
    it('should be instance of Error', () => {
      const error = new ServerError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServerError);
    });

    it('should have correct name property', () => {
      const error1 = new ServerError('Message only');
      const error2 = new ServerError(new Error('Original'));
      const error3 = new ServerError('Message', new Error('Original'));

      expect(error1.name).toBe('SERVER_ERROR');
      expect(error2.name).toBe('SERVER_ERROR');
      expect(error3.name).toBe('SERVER_ERROR');
    });

    it('should preserve original error information', () => {
      const originalError = new TypeError('Type mismatch');
      originalError.stack = 'Original stack trace';

      const error = new ServerError('Server error occurred', originalError);

      expect(error.originalError).toBe(originalError);
      expect(error.originalError?.name).toBe('TypeError');
      expect(error.originalError?.message).toBe('Type mismatch');
      expect(error.originalError?.stack).toBe('Original stack trace');
    });

    it('should have stack trace', () => {
      const error = new ServerError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('SERVER_ERROR');
    });
  });

  describe('error handling scenarios', () => {
    it('should handle database connection errors', () => {
      const dbError = new Error('Connection timeout');
      const error = new ServerError('Failed to connect to database', dbError);

      expect(error.message).toBe('Failed to connect to database');
      expect(error.originalError?.message).toBe('Connection timeout');
    });

    it('should handle API call failures', () => {
      const apiError = new Error('HTTP 500 Internal Server Error');
      const error = new ServerError('External API call failed', apiError);

      expect(error.message).toBe('External API call failed');
      expect(error.originalError?.message).toBe(
        'HTTP 500 Internal Server Error',
      );
    });

    it('should handle validation errors', () => {
      const validationError = new Error('Schema validation failed');
      const error = new ServerError(validationError);

      expect(error.message).toBe('Schema validation failed');
      expect(error.originalError).toBe(validationError);
    });

    it('should handle empty or undefined messages', () => {
      const error1 = new ServerError('');
      const error2 = new ServerError(new Error(''));

      expect(error1.message).toBe('');
      expect(error2.message).toBe('');
    });
  });

  describe('throwable and catchable', () => {
    it('should be throwable and catchable with message', () => {
      const message = 'Server error occurred';

      expect(() => {
        throw new ServerError(message);
      }).toThrow(message);

      try {
        throw new ServerError(message);
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        expect((error as ServerError).name).toBe('SERVER_ERROR');
      }
    });

    it('should be throwable and catchable with original error', () => {
      const originalError = new Error('Original error');

      expect(() => {
        throw new ServerError(originalError);
      }).toThrow('Original error');

      try {
        throw new ServerError(originalError);
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        expect((error as ServerError).originalError).toBe(originalError);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle null or undefined original error gracefully', () => {
      const error1 = new ServerError('Test message');
      const error2 = new ServerError('Test message', null as any);

      expect(error1.originalError).toBeUndefined();
      expect(error2.originalError).toBeNull();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new ServerError(longMessage);

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(1000);
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Error with special chars: @#$%^&*()_+{}|:"<>?';
      const error = new ServerError(specialMessage);

      expect(error.message).toBe(specialMessage);
    });
  });
});

describe('throwServerError', () => {
  describe('function behavior', () => {
    it('should return a function that throws ServerError', () => {
      const message = 'Database operation failed';
      const throwFunction = throwServerError(message);

      expect(typeof throwFunction).toBe('function');
    });

    it('should throw ServerError with correct message and original error', () => {
      const message = 'Custom error message';
      const originalError = new Error('Original error');
      const throwFunction = throwServerError(message);

      expect(() => {
        throwFunction(originalError);
      }).toThrow(ServerError);

      try {
        throwFunction(originalError);
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        expect((error as ServerError).message).toBe(message);
        expect((error as ServerError).originalError).toBe(originalError);
      }
    });

    it('should create ServerError using both message and originalError constructor path', () => {
      const message = 'Function-created error';
      const originalError = new RangeError('Range error details');
      const throwFunction = throwServerError(message);

      try {
        throwFunction(originalError);
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        expect((error as ServerError).message).toBe(message);
        expect((error as ServerError).originalError).toBe(originalError);
        expect((error as ServerError).originalError instanceof RangeError).toBe(
          true,
        );
      }
    });

    it('should work with different types of original errors', () => {
      const message = 'Operation failed';
      const throwFunction = throwServerError(message);

      const testErrors = [
        new Error('Standard error'),
        new TypeError('Type error'),
        new RangeError('Range error'),
        new SyntaxError('Syntax error'),
      ];

      testErrors.forEach((originalError) => {
        try {
          throwFunction(originalError);
        } catch (error) {
          expect(error).toBeInstanceOf(ServerError);
          expect((error as ServerError).message).toBe(message);
          expect((error as ServerError).originalError).toBe(originalError);
        }
      });
    });
  });

  describe('usage scenarios', () => {
    it('should work in promise catch chains', async () => {
      const message = 'Promise operation failed';
      const originalError = new Error('Async operation error');

      // Test that the function returns a function
      const throwFunction = throwServerError(message);
      expect(typeof throwFunction).toBe('function');

      // Test the actual throwing behavior
      expect(() => throwFunction(originalError)).toThrow(ServerError);

      // Test in a promise context properly
      await expect(
        Promise.reject(originalError).catch(throwFunction),
      ).rejects.toThrow(ServerError);
    });

    it('should work with error handling utilities', () => {
      const message = 'Utility error';
      const throwFunction = throwServerError(message);
      const originalError = new Error('Utility operation failed');

      const errorHandler = (error: Error) => {
        throwFunction(error);
      };

      expect(() => errorHandler(originalError)).toThrow(ServerError);
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      const throwFunction = throwServerError('');
      const originalError = new Error('Original');

      try {
        throwFunction(originalError);
      } catch (error) {
        expect((error as ServerError).message).toBe('');
        expect((error as ServerError).originalError).toBe(originalError);
      }
    });

    it('should handle very long messages', () => {
      const longMessage = 'B'.repeat(500);
      const throwFunction = throwServerError(longMessage);
      const originalError = new Error('Original');

      try {
        throwFunction(originalError);
      } catch (error) {
        expect((error as ServerError).message).toBe(longMessage);
      }
    });
  });
});
