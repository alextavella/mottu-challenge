/**
 * Helper functions for testing validation error responses
 */

export interface ValidationErrorResponse {
  error: string;
  message: string;
  errors: string[];
  fields: Record<string, string>;
}

/**
 * Validates the structure of a validation error response
 */
export function expectValidationErrorStructure(response: any): void {
  expect(response.body).toMatchObject({
    error: 'VALIDATION_ERROR',
    message: 'Os dados enviados são inválidos',
    errors: expect.any(Array),
    fields: expect.any(Object),
  });

  // Validate that errors array contains only strings
  expect(
    response.body.errors.every((error: any) => typeof error === 'string'),
  ).toBe(true);

  // Validate that fields object has only string values
  const fieldValues = Object.values(response.body.fields);
  expect(fieldValues.every((value: any) => typeof value === 'string')).toBe(
    true,
  );
}

/**
 * Validates that a specific field has an expected error message
 */
export function expectFieldError(
  response: any,
  fieldName: string,
  expectedMessage: string,
): void {
  expect(response.body.fields).toHaveProperty(fieldName);
  expect(response.body.fields[fieldName]).toContain(expectedMessage);
}

/**
 * Validates that the errors array contains expected messages
 */
export function expectErrorsToContain(
  response: any,
  expectedMessages: string[],
): void {
  expectedMessages.forEach((message) => {
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining(message)]),
    );
  });
}

/**
 * Common validation error messages for reuse across tests
 */
export const ValidationMessages = {
  REQUIRED_NAME: 'Nome é obrigatório',
  REQUIRED_DOCUMENT: 'Documento deve ter pelo menos 11 caracteres',
  REQUIRED_DOCUMENT_FIELD: 'Documento é obrigatório',
  INVALID_EMAIL: 'Email deve ser válido',
  REQUIRED_EMAIL: 'Email é obrigatório',
  INVALID_UUID: 'AccountId deve ser um UUID válido',
  REQUIRED_ACCOUNT_ID: 'AccountId é obrigatório',
  POSITIVE_AMOUNT: 'Valor deve ser positivo',
  REQUIRED_AMOUNT: 'Valor é obrigatório',
  REQUIRED_TYPE: 'Tipo de movimento é obrigatório',
} as const;
