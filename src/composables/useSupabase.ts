import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'
import { ref, computed, readonly } from 'vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Authentication composable
export const useSupabase = () => {
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const isAuthenticated = computed(() => !!user.value)

    // Initialize auth state
    const initAuth = async () => {
        loading.value = true
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            session.value = currentSession
            user.value = currentSession?.user ?? null
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Authentication error'
        } finally {
            loading.value = false
        }
    }

    // Listen to auth changes
    const setupAuthListener = () => {
        supabase.auth.onAuthStateChange((event, currentSession) => {
            session.value = currentSession
            user.value = currentSession?.user ?? null

            if (event === 'SIGNED_OUT') {
                user.value = null
                session.value = null
            }
        })
    }

    // Sign up with email and password
    const signUp = async (email: string, password: string, username: string) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username
                    }
                }
            })

            if (authError) throw authError

            // Create user profile in users table
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .insert({
                        id: data.user.id,
                        username,
                        email,
                        avatar_url: null
                    })

                if (profileError) throw profileError
            }

            return { data, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (authError) throw authError
            return { data, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Sign out
    const signOut = async () => {
        loading.value = true
        error.value = null

        try {
            const { error: authError } = await supabase.auth.signOut()
            if (authError) throw authError
            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
            error.value = errorMessage
            return { error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Guest login (anonymous user)
    const signInAnonymously = async () => {
        loading.value = true
        error.value = null

        try {
            const { data, error: authError } = await supabase.auth.signInAnonymously()
            if (authError) throw authError

            // Create anonymous user profile
            if (data.user) {
                const guestUsername = `Guest_${data.user.id.slice(0, 8)}`
                await supabase
                    .from('users')
                    .upsert({
                        id: data.user.id,
                        username: guestUsername,
                        email: null,
                        avatar_url: null
                    })
            }

            return { data, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Anonymous sign in failed'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Sign in with OAuth providers
    const signInWithOAuth = async (provider: 'google' | 'github' | 'facebook') => {
        loading.value = true
        error.value = null

        try {
            const { data, error: authError } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (authError) throw authError
            return { data, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `${provider} sign in failed`
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    return {
        user: readonly(user),
        session: readonly(session),
        loading: readonly(loading),
        error: readonly(error),
        isAuthenticated,
        initAuth,
        setupAuthListener,
        signUp,
        signIn,
        signOut,
        signInAnonymously,
        signInWithOAuth
    }
}
