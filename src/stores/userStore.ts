import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useSupabase, supabase } from '../composables/useSupabase'
import type { User, Session } from '@supabase/supabase-js'

export interface UserProfile {
    id: string
    username: string
    email?: string
    avatar_url?: string
    created_at?: string
}

export interface UserPreferences {
    user_id: string
    wallpaper_id?: string
    music_url?: string
    volume: number
    theme?: string
    auto_play_music: boolean
    show_chat: boolean
}

export const useUserStore = defineStore('user', () => {
    const supabaseComposable = useSupabase()

    // State
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)
    const profile = ref<UserProfile | null>(null)
    const preferences = ref<UserPreferences | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const isAuthenticated = computed(() => !!user.value)
    const isAnonymous = computed(() => user.value?.is_anonymous || false)
    const username = computed(() => profile.value?.username || 'Guest')
    const avatarUrl = computed(() => profile.value?.avatar_url)

    // Actions
    const initialize = async () => {
        loading.value = true
        error.value = null

        try {
            await supabaseComposable.initAuth()
            supabaseComposable.setupAuthListener()

            // Sync with supabase composable state
            user.value = supabaseComposable.user.value as User | null
            session.value = supabaseComposable.session.value as Session | null

            if (user.value) {
                await fetchProfile()
                await fetchPreferences()
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Initialization failed'
        } finally {
            loading.value = false
        }
    }

    const signUp = async (email: string, password: string, username: string) => {
        loading.value = true
        error.value = null

        try {
            const result = await supabaseComposable.signUp(email, password, username)

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            if (result.data?.user) {
                user.value = result.data.user
                session.value = result.data.session
                await fetchProfile()
                await createDefaultPreferences()
            }

            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Sign up failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const signIn = async (email: string, password: string) => {
        loading.value = true
        error.value = null

        try {
            const result = await supabaseComposable.signIn(email, password)

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            if (result.data?.user) {
                user.value = result.data.user
                session.value = result.data.session
                await fetchProfile()
                await fetchPreferences()
            }

            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Sign in failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const signInAnonymously = async () => {
        loading.value = true
        error.value = null

        try {
            const result = await supabaseComposable.signInAnonymously()

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            if (result.data?.user) {
                user.value = result.data.user
                session.value = result.data.session
                await fetchProfile()
                await createDefaultPreferences()
            }

            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Anonymous sign in failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const signOut = async () => {
        loading.value = true
        error.value = null

        try {
            const result = await supabaseComposable.signOut()

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            // Clear state
            user.value = null
            session.value = null
            profile.value = null
            preferences.value = null

            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Sign out failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const fetchProfile = async () => {
        if (!user.value) return

        try {
            const { data, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.value.id)
                .single()

            if (fetchError) throw fetchError
            profile.value = data
        } catch (err) {
            console.error('Failed to fetch profile:', err)
        }
    }

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user.value) throw new Error('User not authenticated')

        loading.value = true
        error.value = null

        try {
            const { data, error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.value.id)
                .select()
                .single()

            if (updateError) throw updateError

            profile.value = data
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Profile update failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const fetchPreferences = async () => {
        if (!user.value) return

        try {
            const { data, error: fetchError } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', user.value.id)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
                throw fetchError
            }

            preferences.value = data || null

            // Create default preferences if none exist
            if (!data) {
                await createDefaultPreferences()
            }
        } catch (err) {
            console.error('Failed to fetch preferences:', err)
        }
    }

    const createDefaultPreferences = async () => {
        if (!user.value) return

        try {
            const defaultPrefs: Omit<UserPreferences, 'user_id'> = {
                volume: 0.7,
                auto_play_music: false,
                show_chat: true
            }

            const { data, error: createError } = await supabase
                .from('user_preferences')
                .insert({
                    user_id: user.value.id,
                    ...defaultPrefs
                })
                .select()
                .single()

            if (createError) throw createError
            preferences.value = data
        } catch (err) {
            console.error('Failed to create default preferences:', err)
        }
    }

    const updatePreferences = async (updates: Partial<Omit<UserPreferences, 'user_id'>>) => {
        if (!user.value) throw new Error('User not authenticated')

        loading.value = true
        error.value = null

        try {
            const { data, error: updateError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.value.id,
                    ...preferences.value,
                    ...updates
                })
                .select()
                .single()

            if (updateError) throw updateError

            preferences.value = data
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Preferences update failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const uploadAvatar = async (file: File) => {
        if (!user.value) throw new Error('User not authenticated')

        loading.value = true
        error.value = null

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `avatars/${user.value.id}.${fileExt}`

            // Upload to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Update profile with new avatar URL
            await updateProfile({ avatar_url: publicUrl })

            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Avatar upload failed'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    return {
        // State
        user: readonly(user),
        session: readonly(session),
        profile: readonly(profile),
        preferences: readonly(preferences),
        loading: readonly(loading),
        error: readonly(error),

        // Getters
        isAuthenticated,
        isAnonymous,
        username,
        avatarUrl,

        // Actions
        initialize,
        signUp,
        signIn,
        signInAnonymously,
        signOut,
        fetchProfile,
        updateProfile,
        fetchPreferences,
        updatePreferences,
        uploadAvatar
    }
})