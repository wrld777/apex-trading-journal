export interface UserProfile {
  id: string
  name: string
  email: string
  instrument: string
  accountSize: number
  createdAt: string
}

export interface UpdateProfileRequest {
  name: string
  instrument: string
  accountSize: number
}
