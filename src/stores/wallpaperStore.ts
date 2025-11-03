import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useWallpaper } from '../composables/useWallpaper'
import type { Wallpaper } from '../composables/useWallpaper'

export const useWallpaperStore = defineStore('wallpaper', () => {
    const wallpaperComposable = useWallpaper()

    // State
    const wallpapers = ref<Wallpaper[]>([])
    const currentWallpaper = ref<Wallpaper | null>({
        id: '245245234',
        title: 'Sunset',
        uploader_id: 'uploader-xyz',
        tags: [],
        created_at: '2024-01-01T00:00:00Z',
        file_url: '/wallpapers/bg-default.jpg'
    })
    const favoriteWallpapers = ref<string[]>([]) // Array of wallpaper IDs
    const searchQuery = ref('')
    const selectedTags = ref<string[]>([])
    const sortBy = ref<'newest' | 'oldest' | 'popular'>('newest')
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const filteredWallpapers = computed(() => {
        let filtered = [...wallpapers.value]

        // Apply search filter
        if (searchQuery.value.trim()) {
            filtered = wallpaperComposable.searchWallpapers(searchQuery.value)
        }

        // Apply tag filter
        if (selectedTags.value.length > 0) {
            filtered = filtered.filter(wallpaper =>
                selectedTags.value.some(tag => wallpaper.tags.includes(tag))
            )
        }

        // Apply sorting
        switch (sortBy.value) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                break
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                break
            case 'popular':
                // For now, sort by newest. Later can implement view counts or likes
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                break
        }

        return filtered
    })

    const favoriteWallpapersList = computed(() =>
        wallpapers.value.filter(wallpaper => favoriteWallpapers.value.includes(wallpaper.id))
    )

    const allTags = computed(() => {
        const tags = new Set<string>()
        wallpapers.value.forEach(wallpaper => {
            wallpaper.tags.forEach(tag => tags.add(tag))
        })
        return Array.from(tags).sort()
    })

    const hasCurrentWallpaper = computed(() => !!currentWallpaper.value)

    // Actions
    const initializeStore = async () => {
        loading.value = true
        error.value = null

        try {
            await fetchWallpapers()
            loadFavorites()
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to initialize wallpaper store'
        } finally {
            loading.value = false
        }
    }

    const fetchWallpapers = async () => {
        loading.value = true
        error.value = null

        try {
            const result = await wallpaperComposable.fetchWallpapers()

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            wallpapers.value = [...(wallpaperComposable.wallpapers.value || [])] as Wallpaper[]
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch wallpapers'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const uploadWallpaper = async (file: File, title: string, tags: string[] = []) => {
        loading.value = true
        error.value = null

        try {
            const result = await wallpaperComposable.uploadWallpaper(file, title, tags)

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            if (result.data) {
                wallpapers.value.unshift(result.data)
            }

            return { success: true, data: result.data, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Upload failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const deleteWallpaper = async (wallpaperId: string) => {
        loading.value = true
        error.value = null

        try {
            const result = await wallpaperComposable.deleteWallpaper(wallpaperId)

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            // Remove from local state
            wallpapers.value = wallpapers.value.filter(w => w.id !== wallpaperId)

            // Clear current wallpaper if it was deleted
            if (currentWallpaper.value?.id === wallpaperId) {
                currentWallpaper.value = null
            }

            // Remove from favorites
            removeFavorite(wallpaperId)

            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Delete failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const setCurrentWallpaper = (wallpaper: Wallpaper | null) => {
        currentWallpaper.value = wallpaper
        wallpaperComposable.setCurrentWallpaper(wallpaper)

        // Save to localStorage for persistence
        if (wallpaper) {
            localStorage.setItem('currentWallpaper', JSON.stringify(wallpaper))
        } else {
            localStorage.removeItem('currentWallpaper')
        }
    }

    const loadCurrentWallpaperFromStorage = () => {
        try {
            const stored = localStorage.getItem('currentWallpaper')
            if (stored) {
                const wallpaper = JSON.parse(stored)
                currentWallpaper.value = wallpaper
                wallpaperComposable.setCurrentWallpaper(wallpaper)
            }
        } catch (err) {
            console.error('Failed to load current wallpaper from storage:', err)
        }
    }

    const addFavorite = (wallpaperId: string) => {
        if (!favoriteWallpapers.value.includes(wallpaperId)) {
            favoriteWallpapers.value.push(wallpaperId)
            saveFavorites()
        }
    }

    const removeFavorite = (wallpaperId: string) => {
        const index = favoriteWallpapers.value.indexOf(wallpaperId)
        if (index > -1) {
            favoriteWallpapers.value.splice(index, 1)
            saveFavorites()
        }
    }

    const toggleFavorite = (wallpaperId: string) => {
        if (favoriteWallpapers.value.includes(wallpaperId)) {
            removeFavorite(wallpaperId)
        } else {
            addFavorite(wallpaperId)
        }
    }

    const isFavorite = (wallpaperId: string): boolean => {
        return favoriteWallpapers.value.includes(wallpaperId)
    }

    const saveFavorites = () => {
        localStorage.setItem('favoriteWallpapers', JSON.stringify(favoriteWallpapers.value))
    }

    const loadFavorites = () => {
        try {
            const stored = localStorage.getItem('favoriteWallpapers')
            if (stored) {
                favoriteWallpapers.value = JSON.parse(stored)
            }
        } catch (err) {
            console.error('Failed to load favorites:', err)
            favoriteWallpapers.value = []
        }
    }

    const setSearchQuery = (query: string) => {
        searchQuery.value = query
    }

    const setSelectedTags = (tags: string[]) => {
        selectedTags.value = [...tags]
    }

    const addSelectedTag = (tag: string) => {
        if (!selectedTags.value.includes(tag)) {
            selectedTags.value.push(tag)
        }
    }

    const removeSelectedTag = (tag: string) => {
        const index = selectedTags.value.indexOf(tag)
        if (index > -1) {
            selectedTags.value.splice(index, 1)
        }
    }

    const clearFilters = () => {
        searchQuery.value = ''
        selectedTags.value = []
    }

    const setSortBy = (sort: 'newest' | 'oldest' | 'popular') => {
        sortBy.value = sort
    }

    const getWallpaperById = (id: string): Wallpaper | null => {
        return wallpapers.value.find(w => w.id === id) || null
    }

    const getRandomWallpaper = (): Wallpaper | null => {
        if (wallpapers.value.length === 0) return null
        const randomIndex = Math.floor(Math.random() * wallpapers.value.length)
        return wallpapers.value[randomIndex]
    }

    return {
        // State
        wallpapers: readonly(wallpapers),
        currentWallpaper: readonly(currentWallpaper),
        favoriteWallpapers: readonly(favoriteWallpapers),
        searchQuery: readonly(searchQuery),
        selectedTags: readonly(selectedTags),
        sortBy: readonly(sortBy),
        loading: readonly(loading),
        error: readonly(error),

        // Getters
        filteredWallpapers,
        favoriteWallpapersList,
        allTags,
        hasCurrentWallpaper,

        // Actions
        initializeStore,
        fetchWallpapers,
        uploadWallpaper,
        deleteWallpaper,
        setCurrentWallpaper,
        loadCurrentWallpaperFromStorage,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        setSearchQuery,
        setSelectedTags,
        addSelectedTag,
        removeSelectedTag,
        clearFilters,
        setSortBy,
        getWallpaperById,
        getRandomWallpaper
    }
})