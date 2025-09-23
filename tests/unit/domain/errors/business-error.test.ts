import { BusinessError } from '@/domain/errors/business-error';

describe('BusinessError', () => {
  it('should create a business error with message', () => {
    const message = 'Invalid operation';
    const error = new BusinessError(message);

    expect(error).toBeInstanceOf(BusinessError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(message);
    expect(error.name).toBe('BusinessError');
  });

  it('should have correct stack trace', () => {
    const error = new BusinessError('Test error');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('BusinessError: Test error');
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
