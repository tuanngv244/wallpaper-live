import { ref, readonly, onUnmounted } from 'vue'
import { supabase } from './useSupabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
    id: string
    user_id: string
    content: string
    created_at: string
    user?: {
        username: string
        avatar_url?: string
    }
}

export const useChat = () => {
    const messages = ref<ChatMessage[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const sending = ref(false)
    const connected = ref(false)

    let channel: RealtimeChannel | null = null

    // Fetch recent chat messages
    const fetchMessages = async (limit: number = 50) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select(`
          *,
          user:users(username, avatar_url)
        `)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (fetchError) throw fetchError

            // Reverse to show oldest first
            messages.value = (data || []).reverse()
            return { data, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            loading.value = false
        }
    }

    // Send a new message
    const sendMessage = async (content: string) => {
        if (!content.trim()) return { data: null, error: 'Message cannot be empty' }

        sending.value = true
        error.value = null

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User must be authenticated to send messages')

            const { data, error: sendError } = await supabase
                .from('messages')
                .insert({
                    user_id: user.id,
                    content: content.trim()
                })
                .select(`
          *,
          user:users(username, avatar_url)
        `)
                .single()

            if (sendError) throw sendError

            return { data, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
            error.value = errorMessage
            return { data: null, error: errorMessage }
        } finally {
            sending.value = false
        }
    }

    // Subscribe to real-time chat updates
    const subscribeToChat = () => {
        if (channel) return // Already subscribed

        channel = supabase
            .channel('chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    // Fetch the complete message with user data
                    const { data, error } = await supabase
                        .from('messages')
                        .select(`
              *,
              user:users(username, avatar_url)
            `)
                        .eq('id', payload.new.id)
                        .single()

                    if (!error && data) {
                        messages.value.push(data)

                        // Keep only the last 100 messages to prevent memory issues
                        if (messages.value.length > 100) {
                            messages.value = messages.value.slice(-100)
                        }
                    }
                }
            )
            .subscribe((status) => {
                connected.value = status === 'SUBSCRIBED'
                if (status === 'CHANNEL_ERROR') {
                    error.value = 'Failed to connect to chat'
                    connected.value = false
                }
            })
    }

    // Unsubscribe from real-time updates
    const unsubscribeFromChat = () => {
        if (channel) {
            supabase.removeChannel(channel)
            channel = null
            connected.value = false
        }
    }

    // Delete a message (only by the sender)
    const deleteMessage = async (messageId: string) => {
        error.value = null

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User must be authenticated')

            const { error: deleteError } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId)
                .eq('user_id', user.id)

            if (deleteError) throw deleteError

            // Remove from local messages
            messages.value = messages.value.filter(m => m.id !== messageId)

            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete message'
            error.value = errorMessage
            return { error: errorMessage }
        }
    }

    // Clear all messages locally (doesn't delete from database)
    const clearMessages = () => {
        messages.value = []
    }

    // Get messages from a specific user
    const getMessagesByUser = (userId: string) => {
        return messages.value.filter(message => message.user_id === userId)
    }

    // Search messages by content
    const searchMessages = (query: string) => {
        const lowercaseQuery = query.toLowerCase()
        return messages.value.filter(message =>
            message.content.toLowerCase().includes(lowercaseQuery) ||
            message.user?.username.toLowerCase().includes(lowercaseQuery)
        )
    }

    // Auto-cleanup on component unmount
    onUnmounted(() => {
        unsubscribeFromChat()
    })

    return {
        messages: readonly(messages),
        loading: readonly(loading),
        error: readonly(error),
        sending: readonly(sending),
        connected: readonly(connected),
        fetchMessages,
        sendMessage,
        subscribeToChat,
        unsubscribeFromChat,
        deleteMessage,
        clearMessages,
        getMessagesByUser,
        searchMessages
    }
}