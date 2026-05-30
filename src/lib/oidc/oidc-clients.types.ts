export interface OidcClientsState {
    clients: OidcClient[];
    isLoading: boolean;
    error?: string;
  }
  
  export class OidcClientsError extends Error {
    constructor(
      message: string,
      public status: number,
      public errors?: Record<string, string[]>
    ) {
      super(message);
      this.name = 'OidcClientsError';
    }
  }
  
  // Frontend OidcClient type
  export interface OidcClient {
    id: string;
    clientId: string;
    clientName: string;
    grantTypes: string[];
    authenticationMethods: string[];
    redirectUris: string[];
    postLogoutRedirectUris: string[];
    scopes: string[];
    tokenSettings: TokenSettings;
    clientSettings: ClientSettings;
  }
  
  export interface TokenSettings {
    accessTokenTimeToLiveSeconds: number;
    refreshTokenTimeToLiveSeconds: number;
    authorizationCodeTimeToLiveSeconds: number;
    reuseRefreshTokens: boolean;
  }
  
  export interface ClientSettings {
    requireProofKey: boolean;
    requireAuthorizationConsent: boolean;
  }
  
  // Backend response types
  export interface BackendOidcClient {
    id: { value: string };
    clientId: { value: string };
    clientName: { value: string };
    grantTypes: Array<{ value: string }>;
    authenticationMethods: Array<{ value: string }>;
    redirectUris: Array<{ value: string }>;
    postLogoutRedirectUris: Array<{ value: string }>;
    scopes: Array<{ value: string }>;
    tokenSettings: TokenSettings;
    clientSettings: ClientSettings;
  }
  
  export interface CreateClientResponse {
    client: BackendOidcClient;
    clientSecret: string;
    message: string;
  }
  
  export interface RegenerateSecretResponse {
    client: BackendOidcClient;
    clientSecret: string;
    message: string;
  }
  
  // Request types
  export interface CreateOidcClientRequest {
    clientId: string;
    clientName: string;
    grantTypes: string[];
    authenticationMethods: string[];
    redirectUris: string[];
    postLogoutRedirectUris: string[];
    scopes: string[];
    tokenSettings: TokenSettings;
    clientSettings: ClientSettings;
  }
  
  export interface UpdateOidcClientRequest {
    clientName: string;
    grantTypes: string[];
    redirectUris: string[];
    postLogoutRedirectUris: string[];
    scopes: string[];
    tokenSettings: TokenSettings;
    clientSettings: ClientSettings;
  }
  
  // Default settings
  export const defaultTokenSettings: TokenSettings = {
    accessTokenTimeToLiveSeconds: 3600,
    refreshTokenTimeToLiveSeconds: 86400,
    authorizationCodeTimeToLiveSeconds: 300,
    reuseRefreshTokens: false
  };
  
  export const defaultClientSettings: ClientSettings = {
    requireProofKey: true,
    requireAuthorizationConsent: true
  };

  export const AVAILABLE_GRANT_TYPES = [
    'authorization_code',
    'refresh_token',
    'client_credentials',
    'device_code'
  ] as const;

  export const AVAILABLE_AUTH_METHODS = [
    'client_secret_basic',
    'client_secret_post',
    'client_secret_jwt',
    'private_key_jwt',
    'none'
  ] as const;

  export const AVAILABLE_SCOPES = [
    'openid',
    'profile',
    'email',
    'address',
    'phone'
  ] as const;