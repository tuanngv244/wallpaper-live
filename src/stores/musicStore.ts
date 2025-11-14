import { defineStore } from 'pinia'
import { ref, computed, readonly, watch } from 'vue'
import { useMusic } from '../composables/useMusic'
import type { MusicTrack } from '../composables/useMusic'
import { ITrack } from '../types/music'

export type PlayMode = 'single' | 'repeat' | 'shuffle'

export const useMusicStore = defineStore('music', () => {
    const musicComposable = useMusic()

    // State
    const tracks = ref<ITrack[]>([])
    const currentTrack = ref<ITrack | null>(null)
    const playlist = ref<ITrack[]>([])
    const currentPlaylistIndex = ref(0)
    const isPlaying = ref(false)
    const isPaused = ref(false)
    const volume = ref(0.7)
    const isMuted = ref(false)
    const previousVolume = ref(0.7)
    const currentTime = ref(0)
    const duration = ref(0)
    const playMode = ref<PlayMode>('single')
    const autoPlay = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const hasCurrentTrack = computed(() => !!currentTrack.value)
    const hasNextTrack = computed(() =>
        playlist.value.length > 0 && currentPlaylistIndex.value < playlist.value.length - 1
    )
    const hasPreviousTrack = computed(() =>
        playlist.value.length > 0 && currentPlaylistIndex.value > 0
    )
    const progress = computed(() =>
        duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
    )
    const formattedCurrentTime = computed(() => formatTime(currentTime.value))
    const formattedDuration = computed(() => formatTime(duration.value))
    const isFirstTrack = computed(() => currentPlaylistIndex.value === 0)
    const isLastTrack = computed(() => currentPlaylistIndex.value === playlist.value.length - 1)

    // Sync with composable state
    watch(() => musicComposable.tracks.value, (newTracks) => {
        tracks.value = [...newTracks] as ITrack[]
    })

    watch(() => musicComposable.currentTrack.value, (newTrack) => {
        currentTrack.value = newTrack
    })

    watch(() => musicComposable.isPlaying.value, (playing) => {
        isPlaying.value = playing
    })

    watch(() => musicComposable.isPaused.value, (paused) => {
        isPaused.value = paused
    })

    watch(() => musicComposable.currentTime.value, (time) => {
        currentTime.value = time
    })

    watch(() => musicComposable.duration.value, (dur) => {
        duration.value = dur
    })

    // Actions
    const initializeStore = async () => {
        loading.value = true
        error.value = null

        try {
            await fetchTracks()
            loadSettings()
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to initialize music store'
        } finally {
            loading.value = false
        }
    }

    // Upload new music track
    const setTrack = async (
        track: ITrack
    ) => {
        currentTrack.value = track
    }

    const fetchTracks = async () => {
        loading.value = true
        error.value = null

        try {
            const result = await musicComposable.fetchTracks()

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            tracks.value = [...(musicComposable.tracks.value || [])] as ITrack[]
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch tracks'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const uploadTrack = async (file: File, title: string, artist?: string) => {
        loading.value = true
        error.value = null

        try {
            const result = await musicComposable.uploadTrack(file, title, artist)

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            if (result.data) {
                tracks.value.unshift(result.data)
            }

            return { success: true, data: result.data, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Upload failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const playTrack = async (track: ITrack) => {
        try {
            await musicComposable.playTrack(track)
            currentTrack.value = track

            // Update playlist position if track is in current playlist
            const playlistIndex = playlist.value.findIndex(t => t.id === track.id)
            if (playlistIndex !== -1) {
                currentPlaylistIndex.value = playlistIndex
            }

            saveCurrentTrack()
            error.value = null
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to play track'
            return { success: false, error: error.value }
        }
    }

    const pauseTrack = () => {
        musicComposable.pauseTrack()
    }

    const resumeTrack = async () => {
        try {
            await musicComposable.resumeTrack()
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to resume track'
            return { success: false, error: error.value }
        }
    }

    const stopTrack = () => {
        musicComposable.stopTrack()
        currentTrack.value = null
        localStorage.removeItem('currentTrack')
    }

    const restartTrack = async () => {
        try {
            await musicComposable.restartTrack()
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to restart track'
            return { success: false, error: error.value }
        }
    }

    const setVolume = (newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume))
        volume.value = clampedVolume
        musicComposable.setVolume(clampedVolume)

        if (clampedVolume > 0) {
            isMuted.value = false
            previousVolume.value = clampedVolume
        }

        saveSettings()
    }

    const toggleMute = () => {
        if (isMuted.value) {
            // Unmute
            isMuted.value = false
            setVolume(previousVolume.value)
        } else {
            // Mute
            previousVolume.value = volume.value
            isMuted.value = true
            setVolume(0)
        }
        musicComposable.toggleMute()
    }

    const seekTo = (time: number) => {
        musicComposable.seekTo(time)
    }

    const seekToPercentage = (percentage: number) => {
        const time = (percentage / 100) * duration.value
        seekTo(time)
    }

    const setPlaylist = (tracks: ITrack[], startIndex: number = 0) => {
        playlist.value = [...tracks]
        currentPlaylistIndex.value = Math.max(0, Math.min(startIndex, tracks.length - 1))
        savePlaylist()
    }

    const addToPlaylist = (track: ITrack) => {
        if (!playlist.value.find(t => t.id === track.id)) {
            playlist.value.push(track)
            savePlaylist()
        }
    }

    const removeFromPlaylist = (trackId: string) => {
        const index = playlist.value.findIndex(t => t.id === trackId)
        if (index !== -1) {
            playlist.value.splice(index, 1)

            // Adjust current index if needed
            if (currentPlaylistIndex.value >= index && currentPlaylistIndex.value > 0) {
                currentPlaylistIndex.value--
            }

            savePlaylist()
        }
    }

    const clearPlaylist = () => {
        playlist.value = []
        currentPlaylistIndex.value = 0
        localStorage.removeItem('playlist')
    }

    const nextTrack = async () => {
        if (!hasNextTrack.value) {
            if (playMode.value === 'repeat' && playlist.value.length > 0) {
                currentPlaylistIndex.value = 0
            } else {
                return { success: false, error: 'No next track available' }
            }
        } else {
            currentPlaylistIndex.value++
        }

        const nextTrack = playlist.value[currentPlaylistIndex.value]
        if (nextTrack) {
            return await playTrack(nextTrack)
        }

        return { success: false, error: 'Next track not found' }
    }

    const previousTrack = async () => {
        if (!hasPreviousTrack.value) {
            if (playMode.value === 'repeat' && playlist.value.length > 0) {
                currentPlaylistIndex.value = playlist.value.length - 1
            } else {
                return { success: false, error: 'No previous track available' }
            }
        } else {
            currentPlaylistIndex.value--
        }

        const prevTrack = playlist.value[currentPlaylistIndex.value]
        if (prevTrack) {
            return await playTrack(prevTrack)
        }

        return { success: false, error: 'Previous track not found' }
    }

    const shufflePlaylist = () => {
        if (playlist.value.length < 2) return

        const currentTrackId = currentTrack.value?.id
        const shuffled = [...playlist.value]

        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        playlist.value = shuffled

        // Update current index to match current track
        if (currentTrackId) {
            const newIndex = playlist.value.findIndex(t => t.id === currentTrackId)
            if (newIndex !== -1) {
                currentPlaylistIndex.value = newIndex
            }
        }

        savePlaylist()
    }

    const setPlayMode = (mode: PlayMode) => {
        playMode.value = mode
        saveSettings()
    }

    const setAutoPlay = (enabled: boolean) => {
        autoPlay.value = enabled
        saveSettings()
    }

    const deleteTrack = async (trackId: string) => {
        const result = await musicComposable.deleteTrack(trackId)

        if (!result.error) {
            // Remove from local state
            tracks.value = tracks.value.filter(t => t.id !== trackId)
            removeFromPlaylist(trackId)

            // Stop if currently playing
            if (currentTrack.value?.id === trackId) {
                stopTrack()
            }
        }

        return result
    }

    const searchTracks = (query: string) => {
        return musicComposable.searchTracks(query)
    }

    const getTrackById = (id: string) => {
        return tracks.value.find(t => t.id === id) || null
    }

    // Persistence
    const saveSettings = () => {
        const settings = {
            volume: volume.value,
            playMode: playMode.value,
            autoPlay: autoPlay.value
        }
        localStorage.setItem('musicSettings', JSON.stringify(settings))
    }

    const loadSettings = () => {
        try {
            const stored = localStorage.getItem('musicSettings')
            if (stored) {
                const settings = JSON.parse(stored)
                volume.value = settings.volume ?? 0.7
                playMode.value = settings.playMode ?? 'single'
                autoPlay.value = settings.autoPlay ?? false

                // Apply volume to composable
                musicComposable.setVolume(volume.value)
            }
        } catch (err) {
            console.error('Failed to load music settings:', err)
        }
    }

    const saveCurrentTrack = () => {
        if (currentTrack.value) {
            localStorage.setItem('currentTrack', JSON.stringify(currentTrack.value))
        }
    }

    const loadCurrentTrack = () => {
        try {
            const stored = localStorage.getItem('currentTrack')
            if (stored) {
                const track = JSON.parse(stored)
                currentTrack.value = track
            }
        } catch (err) {
            console.error('Failed to load current track:', err)
        }
    }

    const savePlaylist = () => {
        const playlistData = {
            tracks: playlist.value,
            currentIndex: currentPlaylistIndex.value
        }
        localStorage.setItem('playlist', JSON.stringify(playlistData))
    }

    const loadPlaylist = () => {
        try {
            const stored = localStorage.getItem('playlist')
            if (stored) {
                const data = JSON.parse(stored)
                playlist.value = data.tracks || []
                currentPlaylistIndex.value = data.currentIndex || 0
            }
        } catch (err) {
            console.error('Failed to load playlist:', err)
        }
    }

    // Utility function
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return {
        // State
        tracks: readonly(tracks),
        currentTrack: readonly(currentTrack),
        playlist: readonly(playlist),
        currentPlaylistIndex: readonly(currentPlaylistIndex),
        isPlaying: readonly(isPlaying),
        isPaused: readonly(isPaused),
        volume: readonly(volume),
        isMuted: readonly(isMuted),
        currentTime: (currentTime),
        duration: (duration),
        playMode: readonly(playMode),
        autoPlay: readonly(autoPlay),
        loading: readonly(loading),
        error: readonly(error),

        // Getters
        hasCurrentTrack,
        hasNextTrack,
        hasPreviousTrack,
        progress,
        formattedCurrentTime,
        formattedDuration,
        isFirstTrack,
        isLastTrack,

        // Actions
        initializeStore,
        fetchTracks,
        uploadTrack,
        playTrack,
        pauseTrack,
        resumeTrack,
        stopTrack,
        restartTrack,
        setVolume,
        toggleMute,
        seekTo,
        seekToPercentage,
        setPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        clearPlaylist,
        nextTrack,
        previousTrack,
        shufflePlaylist,
        setPlayMode,
        setAutoPlay,
        deleteTrack,
        searchTracks,
        getTrackById,
        loadCurrentTrack,
        loadPlaylist,
        setTrack,
        saveCurrentTrack
    }
})