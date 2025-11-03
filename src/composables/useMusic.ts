import { ref, readonly, onUnmounted, watch } from 'vue'
import { supabase } from './useSupabase'

export interface MusicTrack {
    id: string
    title: string
    artist?: string
    file_url: string
    duration?: number
    uploader_id: string
    created_at: string
    uploader?: {
        username: string
        avatar_url?: string
    }
}

export const useMusic = () => {
    const tracks = ref<MusicTrack[]>([])
    const currentTrack = ref<MusicTrack | null>(null)
    const isPlaying = ref(false)
    const isPaused = ref(false)
    const volume = ref(0.7)
    const currentTime = ref(0)
    const duration = ref(0)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const uploading = ref(false)

    let audioElement: HTMLAudioElement | null = null

    // Initialize audio element
    const initAudio = () => {
        if (!audioElement) {
            audioElement = new Audio()
            audioElement.volume = volume.value

            // Audio event listeners
            audioElement.addEventListener('loadedmetadata', () => {
                duration.value = audioElement?.duration || 0
            })

            audioElement.addEventListener('timeupdate', () => {
                currentTime.value = audioElement?.currentTime || 0
            })

            audioElement.addEventListener('ended', () => {
                isPlaying.value = false
                isPaused.value = false
                currentTime.value = 0
            })

            audioElement.addEventListener('play', () => {
                isPlaying.value = true
                isPaused.value = false
            })

            audioElement.addEventListener('pause', () => {
                isPlaying.value = false
                isPaused.value = true
            })

            audioElement.addEventListener('error', () => {
                error.value = 'Audio playback error'
                isPlaying.value = false
                isPaused.value = false
            })
        }
        return audioElement
    }

    // Fetch all music tracks
    const fetchTracks = async () => {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('music_tracks')
                .select(`
          *,
          uploader:users(username, avatar_url)
        `)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            tracks.value = data || []
            return { data, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tracks'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Upload new music track
    const uploadTrack = async (
        file: File,
        title: string,
        artist?: string
    ) => {
        uploading.value = true
        error.value = null

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User must be authenticated to upload')

            // Validate file type
            if (!file.type.startsWith('audio/')) {
                throw new Error('File must be an audio file')
            }

            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('music')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('music')
                .getPublicUrl(fileName)

            // Save track metadata to database
            const { data: trackData, error: dbError } = await supabase
                .from('music_tracks')
                .insert({
                    title,
                    artist,
                    file_url: publicUrl,
                    uploader_id: user.id
                })
                .select(`
          *,
          uploader:users(username, avatar_url)
        `)
                .single()

            if (dbError) throw dbError

            // Add to local tracks list
            tracks.value.unshift(trackData)

            return { data: trackData, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            uploading.value = false
        }
    }

    // Play a track
    const playTrack = async (track: MusicTrack) => {
        try {
            const audio = initAudio()

            // If switching tracks, load new source
            if (currentTrack.value?.id !== track.id) {
                audio.src = track.file_url
                currentTrack.value = track
                currentTime.value = 0
            }

            await audio.play()
            error.value = null
        } catch (err) {
            error.value = 'Failed to play track'
            isPlaying.value = false
        }
    }

    // Pause current track
    const pauseTrack = () => {
        if (audioElement) {
            audioElement.pause()
        }
    }

    // Resume current track
    const resumeTrack = async () => {
        if (audioElement && isPaused.value) {
            try {
                await audioElement.play()
                error.value = null
            } catch (err) {
                error.value = 'Failed to resume track'
            }
        }
    }

    // Stop current track
    const stopTrack = () => {
        if (audioElement) {
            audioElement.pause()
            audioElement.currentTime = 0
            isPlaying.value = false
            isPaused.value = false
            currentTime.value = 0
        }
    }

    // Restart current track
    const restartTrack = async () => {
        if (audioElement && currentTrack.value) {
            audioElement.currentTime = 0
            if (!isPlaying.value) {
                await playTrack(currentTrack.value)
            }
        }
    }

    // Set volume (0-1)
    const setVolume = (newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume))
        volume.value = clampedVolume
        if (audioElement) {
            audioElement.volume = clampedVolume
        }
    }

    // Seek to specific time
    const seekTo = (time: number) => {
        if (audioElement) {
            audioElement.currentTime = Math.max(0, Math.min(duration.value, time))
        }
    }

    // Mute/unmute
    const toggleMute = () => {
        if (audioElement) {
            audioElement.muted = !audioElement.muted
        }
    }

    // Delete track (only by uploader)
    const deleteTrack = async (trackId: string) => {
        loading.value = true
        error.value = null

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User must be authenticated')

            // Get track info first
            const { data: track, error: fetchError } = await supabase
                .from('music_tracks')
                .select('*')
                .eq('id', trackId)
                .eq('uploader_id', user.id)
                .single()

            if (fetchError) throw fetchError
            if (!track) throw new Error('Track not found or unauthorized')

            // Stop if currently playing this track
            if (currentTrack.value?.id === trackId) {
                stopTrack()
                currentTrack.value = null
            }

            // Extract filename from URL
            const urlParts = track.file_url.split('/')
            const fileName = urlParts.slice(-2).join('/') // user_id/filename

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('music')
                .remove([fileName])

            if (storageError) throw storageError

            // Delete from database
            const { error: dbError } = await supabase
                .from('music_tracks')
                .delete()
                .eq('id', trackId)
                .eq('uploader_id', user.id)

            if (dbError) throw dbError

            // Remove from local list
            tracks.value = tracks.value.filter(t => t.id !== trackId)

            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Delete failed'
            error.value = errorMessage
            return { error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Get track by ID
    const getTrackById = (id: string) => {
        return tracks.value.find(t => t.id === id) || null
    }

    // Search tracks
    const searchTracks = (query: string) => {
        const lowercaseQuery = query.toLowerCase()
        return tracks.value.filter(track =>
            track.title.toLowerCase().includes(lowercaseQuery) ||
            track.artist?.toLowerCase().includes(lowercaseQuery)
        )
    }

    // Watch volume changes to update audio element
    watch(volume, (newVolume) => {
        if (audioElement) {
            audioElement.volume = newVolume
        }
    })

    // Cleanup on unmount
    onUnmounted(() => {
        if (audioElement) {
            audioElement.pause()
            audioElement.src = ''
            audioElement = null
        }
    })

    return {
        tracks: readonly(tracks),
        currentTrack: readonly(currentTrack),
        isPlaying: readonly(isPlaying),
        isPaused: readonly(isPaused),
        volume: readonly(volume),
        currentTime: readonly(currentTime),
        duration: readonly(duration),
        loading: readonly(loading),
        error: readonly(error),
        uploading: readonly(uploading),
        fetchTracks,
        uploadTrack,
        playTrack,
        pauseTrack,
        resumeTrack,
        stopTrack,
        restartTrack,
        setVolume,
        seekTo,
        toggleMute,
        deleteTrack,
        getTrackById,
        searchTracks
    }
}