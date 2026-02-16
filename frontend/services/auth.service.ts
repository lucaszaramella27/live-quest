import type { AuthProviderUser } from './backend-client'
import { backendClient } from './backend-client'
import type { User } from '@/shared/types'

interface UserRow {
  id: string
  email: string
  display_name: string
  photo_url: string | null
  is_premium: boolean
  created_at: string
}

function toDate(value: string | null | undefined): Date {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function buildUserFromAuth(authUser: AuthProviderUser, displayNameOverride?: string): Omit<User, 'id'> {
  return {
    email: authUser.email || '',
    displayName:
      displayNameOverride ||
      (typeof authUser.user_metadata?.display_name === 'string' && authUser.user_metadata.display_name.trim()) ||
      authUser.email?.split('@')[0] ||
      'Usuario',
    photoURL:
      (typeof authUser.user_metadata?.avatar_url === 'string' && authUser.user_metadata.avatar_url) ||
      null ||
      undefined,
    isPremium: false,
    createdAt: new Date(),
  }
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url ?? undefined,
    isPremium: Boolean(row.is_premium),
    createdAt: toDate(row.created_at),
  }
}

async function ensureUserProfile(authUser: AuthProviderUser, displayNameOverride?: string): Promise<User> {
  const { data: existingUser, error: existingError } = await backendClient
    .from('users')
    .select('id, email, display_name, photo_url, is_premium, created_at')
    .eq('id', authUser.id)
    .maybeSingle<UserRow>()

  if (existingError) {
    throw existingError
  }

  const fallbackUser = buildUserFromAuth(authUser, displayNameOverride)
  const normalizedEmail = authUser.email || fallbackUser.email
  const normalizedName = displayNameOverride || fallbackUser.displayName
  const normalizedPhoto = fallbackUser.photoURL ?? null

  if (existingUser) {
    const needsUpdate =
      existingUser.email !== normalizedEmail ||
      existingUser.display_name !== normalizedName ||
      (existingUser.photo_url ?? null) !== normalizedPhoto

    if (needsUpdate) {
      const { error: updateError } = await backendClient
        .from('users')
        .update({
          email: normalizedEmail,
          display_name: normalizedName,
          photo_url: normalizedPhoto,
        })
        .eq('id', authUser.id)

      if (updateError) {
        throw updateError
      }

      return {
        ...mapUserRow(existingUser),
        email: normalizedEmail,
        displayName: normalizedName,
        photoURL: normalizedPhoto ?? undefined,
      }
    }

    return mapUserRow(existingUser)
  }

  const now = new Date().toISOString()
  const newUserRow = {
    id: authUser.id,
    email: normalizedEmail,
    display_name: normalizedName,
    photo_url: normalizedPhoto,
    is_premium: false,
    created_at: now,
  }

  const { data: createdUser, error: createError } = await backendClient
    .from('users')
    .insert(newUserRow)
    .select('id, email, display_name, photo_url, is_premium, created_at')
    .single<UserRow>()

  if (createError) {
    throw createError
  }

  return mapUserRow(createdUser)
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await backendClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) {
    throw error
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
  const { data, error } = await backendClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error('Nao foi possivel criar usuario.')
  }

  return ensureUserProfile(data.user, displayName)
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await backendClient.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error('Usuario nao encontrado.')
  }

  return ensureUserProfile(data.user)
}

export async function signOut(): Promise<void> {
  const { error } = await backendClient.auth.signOut()
  if (error) {
    throw error
  }
}

export async function getCurrentUser(authUser: AuthProviderUser): Promise<User | null> {
  return ensureUserProfile(authUser)
}
