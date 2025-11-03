import { ref, readonly } from 'vue'
import { supabase } from './useSupabase'

export interface Wallpaper {
    id: string
    title: string
    file_url: string
    thumbnail_url?: string
    uploader_id: string
    tags: string[]
    created_at: string
    uploader?: {
        username: string
        avatar_url?: string
    }
}

export const useWallpaper = () => {
    const wallpapers = ref<Wallpaper[]>([])
    const currentWallpaper = ref<Wallpaper | null>({
        id: '245245234',
        title: 'Sunset',
        uploader_id: 'uploader-xyz',
        tags: [],
        created_at: '2024-01-01T00:00:00Z',
        file_url: '/wallpapers/bg-default.jpg'
    })
    const loading = ref(false)
    const error = ref<string | null>(null)
    const uploading = ref(false)

    // Fetch all wallpapers from database
    const fetchWallpapers = async () => {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('wallpapers')
                .select(`
          *,
          uploader:users(username, avatar_url)
        `)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            wallpapers.value = data || []
            return { data, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallpapers'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Upload new wallpaper
    const uploadWallpaper = async (
        file: File,
        title: string,
        tags: string[] = []
    ) => {
        uploading.value = true
        error.value = null

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User must be authenticated to upload')

            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('wallpapers')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('wallpapers')
                .getPublicUrl(fileName)

            // Save wallpaper metadata to database
            const { data: wallpaperData, error: dbError } = await supabase
                .from('wallpapers')
                .insert({
                    title,
                    file_url: publicUrl,
                    uploader_id: user.id,
                    tags
                })
                .select(`
          *,
          uploader:users(username, avatar_url)
        `)
                .single()

            if (dbError) throw dbError

            // Add to local wallpapers list
            wallpapers.value.unshift(wallpaperData)

            return { data: wallpaperData, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            uploading.value = false
        }
    }

    // Delete wallpaper (only by uploader)
    const deleteWallpaper = async (wallpaperId: string) => {
        loading.value = true
        error.value = null

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User must be authenticated')

            // Get wallpaper info first
            const { data: wallpaper, error: fetchError } = await supabase
                .from('wallpapers')
                .select('*')
                .eq('id', wallpaperId)
                .eq('uploader_id', user.id)
                .single()

            if (fetchError) throw fetchError
            if (!wallpaper) throw new Error('Wallpaper not found or unauthorized')

            // Extract filename from URL for storage deletion
            const urlParts = wallpaper.file_url.split('/')
            const fileName = urlParts.slice(-2).join('/') // user_id/filename

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('wallpapers')
                .remove([fileName])

            if (storageError) throw storageError

            // Delete from database
            const { error: dbError } = await supabase
                .from('wallpapers')
                .delete()
                .eq('id', wallpaperId)
                .eq('uploader_id', user.id)

            if (dbError) throw dbError

            // Remove from local list
            wallpapers.value = wallpapers.value.filter(w => w.id !== wallpaperId)

            // Clear current wallpaper if it was deleted
            if (currentWallpaper.value?.id === wallpaperId) {
                currentWallpaper.value = null
            }

            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Delete failed'
            error.value = errorMessage
            return { error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Set current wallpaper
    const setCurrentWallpaper = (wallpaper: Wallpaper | null) => {
        currentWallpaper.value = wallpaper
    }

    // Get wallpaper by ID
    const getWallpaperById = (id: string) => {
        return wallpapers.value.find(w => w.id === id) || null
    }

    // Filter wallpapers by tags
    const getWallpapersByTags = (tags: string[]) => {
        return wallpapers.value.filter(wallpaper =>
            tags.some(tag => wallpaper.tags.includes(tag))
        )
    }

    // Search wallpapers by title
    const searchWallpapers = (query: string) => {
        const lowercaseQuery = query.toLowerCase()
        return wallpapers.value.filter(wallpaper =>
            wallpaper.title.toLowerCase().includes(lowercaseQuery) ||
            wallpaper.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        )
    }

    return {
        wallpapers: readonly(wallpapers),
        currentWallpaper: readonly(currentWallpaper),
        loading: readonly(loading),
        error: readonly(error),
        uploading: readonly(uploading),
        fetchWallpapers,
        uploadWallpaper,
        deleteWallpaper,
        setCurrentWallpaper,
        getWallpaperById,
        getWallpapersByTags,
        searchWallpapers
    }
}