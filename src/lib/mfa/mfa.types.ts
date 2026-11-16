/** Second factor identifiers as returned by GET /api/mfa, e.g. "totp". */
export type SecondFactor = 'totp' | (string & {});

export interface MfaFactorsResponse {
  factors: SecondFactor[];
}

/** Returned when TOTP enrollment starts. Show the URI as a QR code. */
export interface TotpEnrollment {
  /** Base32 secret for manual entry into the authenticator app. */
  secret: string;
  /** otpauth:// key URI understood by authenticator apps. */
  otpauthUri: string;
}

export interface DisableTotpRequest {
  password: string;
  code: string;
}

export class MfaError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'MfaError';
  }
}

export const FACTOR_LABELS: Record<string, string> = {
  totp: 'Authenticator app'
};
