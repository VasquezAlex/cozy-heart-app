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

export interface SeekingFilters {
    age: {
        min: number
        max: number
    }
    height: {
        min: number
        max: number
    }
    tags: string[]
    verified: boolean
}