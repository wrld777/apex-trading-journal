export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  /** Nome e cognome già composti dal backend. */
  displayName: string
  email: string
  /** Data URI dell'immagine, o null se non c'è foto. */
  avatarUrl: string | null
  createdAt: string
}

export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
