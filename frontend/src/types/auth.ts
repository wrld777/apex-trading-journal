export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  userId: string
  name: string
  email: string
  token: string
  expirationDate?: string
}

// Register no longer logs the user in — it returns a confirmation, not a token.
export interface RegisterResponse {
  message: string
  userId: string
  email: string
}
