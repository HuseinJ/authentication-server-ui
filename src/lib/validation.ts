export const MIN_PASSWORD_LENGTH = 8;

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

export function newPasswordErrors(
  password: string,
  confirmation: string
): FieldErrors<'password' | 'confirmation'> {
  const errors: FieldErrors<'password' | 'confirmation'> = {};
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (confirmation !== password) {
    errors.confirmation = 'This doesn\'t match the new password.';
  }
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
