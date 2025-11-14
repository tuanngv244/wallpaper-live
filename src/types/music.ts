



export interface ITrack {
    id: string
    title: string
    artist: string
    album: string
    file_url: string
    thumbnail_url: string
    duration: number
    file_size: number
    genre: string
    year: number
    uploader_id: string
    is_public: boolean
    play_count: number
    like_count: number
    created_at: string
    updated_at: string
    uploader: Uploader
}

export interface Uploader {
    username: string
    avatar_url: any
}
