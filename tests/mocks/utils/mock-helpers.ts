/**
 * Utilitários para trabalhar com mocks em testes
 */

/**
 * Limpa todos os mocks e reseta seus estados
 */
export const clearAllMocks = () => {
  vi.clearAllMocks();
};

/**
 * Cria um mock de função com valor de retorno
 */
export const createMockFn = <T = any>(returnValue?: T) => {
  const mockFn = vi.fn();
  if (returnValue !== undefined) {
    mockFn.mockReturnValue(returnValue);
  }
  return mockFn;
};

/**
 * Cria um mock de função assíncrona com valor de retorno
 */
export const createAsyncMockFn = <T = any>(resolvedValue?: T) => {
  const mockFn = vi.fn();
  if (resolvedValue !== undefined) {
    mockFn.mockResolvedValue(resolvedValue);
  }
  return mockFn;
};

/**
 * Cria um mock de função assíncrona que rejeita
 */
export const createRejectedMockFn = (error: Error) => {
  return vi.fn().mockRejectedValue(error);
};

/**
 * Helper para verificar se uma função mock foi chamada com argumentos específicos
 */
export const expectMockCalledWith = (mockFn: any, ...args: any[]) => {
  expect(mockFn).toHaveBeenCalledWith(...args);
};

/**
 * Helper para verificar quantas vezes uma função mock foi chamada
 */
export const expectMockCalledTimes = (mockFn: any, times: number) => {
  expect(mockFn).toHaveBeenCalledTimes(times);
};
