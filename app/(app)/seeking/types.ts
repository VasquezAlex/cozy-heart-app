export interface SeekingProfile {
  id: string
  userId: string
  name: string
  age: number
  photos?: string[]
  bio?: string
  tags: string[]
  region?: string
  verified: boolean
  complete: boolean
}
