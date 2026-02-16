/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_BACKEND_FUNCTIONS_BASE_URL?: string
  readonly VITE_USE_BACKEND_FUNCTIONS?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_TWITCH_CLIENT_ID?: string
  readonly VITE_TWITCH_REDIRECT_URI?: string
  readonly VITE_FUNCTIONS_BASE_URL?: string
  readonly VITE_TWITCH_BACKEND_BASE_URL?: string
  readonly VITE_FUNCTIONS_USE_PROXY?: string
  readonly VITE_FUNCTIONS_DEV_FALLBACK?: string
  readonly VITE_FUNCTIONS_FORCE_FALLBACK?: string
  readonly VITE_FUNCTIONS_PREFER_FALLBACK?: string
  readonly VITE_FUNCTIONS_DEBUG_FALLBACK?: string
  readonly VITE_ADMIN_UIDS?: string
  readonly VITE_ENABLE_INSECURE_TWITCH_OAUTH?: string
  readonly VITE_TWITCH_CLIENT_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
