interface GoogleOAuthTokenResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
  error_uri?: string
}

interface GoogleOAuthErrorResponse {
  type?: string
  message?: string
}

interface GoogleOAuthTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: GoogleOAuthTokenResponse) => void
    error_callback?: (error: GoogleOAuthErrorResponse) => void
  }) => GoogleOAuthTokenClient
}

interface GoogleAccountsNamespace {
  oauth2?: GoogleAccountsOAuth2
}

interface Window {
  google?: {
    accounts?: GoogleAccountsNamespace
  }
}
