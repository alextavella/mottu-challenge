import { ServerError } from '@/core/errors/server.error';

describe('SERVER_ERROR', () => {
  it('should create a server error with message', () => {
    const message = 'Database connection failed';
    const error = new ServerError(message);

    expect(error).toBeInstanceOf(ServerError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(message);
    expect(error.name).toBe('SERVER_ERROR');
  });

  it('should create a server error with message and original error', () => {
    const message = 'Database operation failed';
    const originalError = new Error('Connection timeout');
    const error = new ServerError(message, originalError);

    expect(error.message).toBe(message);
    expect(error.originalError).toBe(originalError);
  });

  it('should create a server error with only original error', () => {
    const originalError = new Error('Network error');
    const error = new ServerError(originalError);

    expect(error.message).toBe('Network error');
    expect(error.originalError).toBe(originalError);
  });

  it('should have correct stack trace', () => {
    const error = new ServerError('Test server error');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('SERVER_ERROR: Test server error');
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

  it('should preserve original error information', () => {
    const originalError = new Error('Original error message');
    originalError.stack = 'Original stack trace';

    const serverError = new ServerError('Wrapped error', originalError);

    expect(serverError.originalError).toBe(originalError);
    expect(serverError.originalError?.message).toBe('Original error message');
    expect(serverError.originalError?.stack).toBe('Original stack trace');
  });
});
