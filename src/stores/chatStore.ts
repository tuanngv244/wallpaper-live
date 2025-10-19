import { defineStore } from 'pinia'
import { ref, computed, readonly, watch } from 'vue'
import { useChat } from '../composables/useChat'
import type { ChatMessage } from '../composables/useChat'

export interface ChatSettings {
    showTimestamps: boolean
    maxMessages: number
    autoScroll: boolean
    soundEnabled: boolean
    showOnlineUsers: boolean
}

export const useChatStore = defineStore('chat', () => {
    const chatComposable = useChat()

    // State
    const messages = ref<ChatMessage[]>([])
    const onlineUsers = ref<string[]>([])
    const typingUsers = ref<string[]>([])
    const unreadCount = ref(0)
    const isVisible = ref(true)
    const settings = ref<ChatSettings>({
        showTimestamps: true,
        maxMessages: 100,
        autoScroll: true,
        soundEnabled: true,
        showOnlineUsers: true
    })
    const loading = ref(false)
    const error = ref<string | null>(null)
    const connected = ref(false)

    // Getters
    const hasMessages = computed(() => messages.value.length > 0)
    const hasUnreadMessages = computed(() => unreadCount.value > 0)
    const sortedMessages = computed(() =>
        [...messages.value].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
    )
    const latestMessage = computed(() =>
        messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
    )

    // Sync with composable state
    watch(() => chatComposable.messages.value, (newMessages) => {
        const previousCount = messages.value.length
        messages.value = [...newMessages]

        // Update unread count if chat is not visible
        if (!isVisible.value && newMessages.length > previousCount) {
            unreadCount.value += newMessages.length - previousCount
        }

        // Limit messages to prevent memory issues
        if (messages.value.length > settings.value.maxMessages) {
            messages.value = messages.value.slice(-settings.value.maxMessages)
        }
    })

    watch(() => chatComposable.connected.value, (isConnected) => {
        connected.value = isConnected
    })

    watch(() => chatComposable.loading.value, (isLoading) => {
        loading.value = isLoading
    })

    watch(() => chatComposable.error.value, (chatError) => {
        error.value = chatError
    })

    // Actions
    const initializeStore = async () => {
        loading.value = true
        error.value = null

        try {
            loadSettings()
            await fetchMessages()
            subscribeToChat()
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to initialize chat store'
        } finally {
            loading.value = false
        }
    }

    const fetchMessages = async (limit: number = 50) => {
        loading.value = true
        error.value = null

        try {
            const result = await chatComposable.fetchMessages(limit)

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            messages.value = [...(chatComposable.messages.value || [])]
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch messages'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }

    const sendMessage = async (content: string) => {
        if (!content.trim()) {
            return { success: false, error: 'Message cannot be empty' }
        }

        try {
            const result = await chatComposable.sendMessage(content.trim())

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            // Message will be added automatically via real-time subscription
            return { success: true, data: result.data, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to send message'
            return { success: false, error: error.value }
        }
    }

    const deleteMessage = async (messageId: string) => {
        try {
            const result = await chatComposable.deleteMessage(messageId)

            if (result.error) {
                error.value = result.error
                return { success: false, error: result.error }
            }

            // Remove from local state (should also be handled by real-time subscription)
            messages.value = messages.value.filter(m => m.id !== messageId)
            return { success: true, error: null }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to delete message'
            return { success: false, error: error.value }
        }
    }

    const subscribeToChat = () => {
        chatComposable.subscribeToChat()
    }

    const unsubscribeFromChat = () => {
        chatComposable.unsubscribeFromChat()
    }

    const clearMessages = () => {
        chatComposable.clearMessages()
        messages.value = []
    }

    const setVisibility = (visible: boolean) => {
        isVisible.value = visible

        // Clear unread count when chat becomes visible
        if (visible) {
            unreadCount.value = 0
        }
    }

    const markAsRead = () => {
        unreadCount.value = 0
    }

    const addTypingUser = (userId: string) => {
        if (!typingUsers.value.includes(userId)) {
            typingUsers.value.push(userId)
        }
    }

    const removeTypingUser = (userId: string) => {
        const index = typingUsers.value.indexOf(userId)
        if (index > -1) {
            typingUsers.value.splice(index, 1)
        }
    }

    const clearTypingUsers = () => {
        typingUsers.value = []
    }

    const addOnlineUser = (userId: string) => {
        if (!onlineUsers.value.includes(userId)) {
            onlineUsers.value.push(userId)
        }
    }

    const removeOnlineUser = (userId: string) => {
        const index = onlineUsers.value.indexOf(userId)
        if (index > -1) {
            onlineUsers.value.splice(index, 1)
        }
    }

    const updateOnlineUsers = (users: string[]) => {
        onlineUsers.value = [...users]
    }

    const getMessagesByUser = (userId: string) => {
        return chatComposable.getMessagesByUser(userId)
    }

    const searchMessages = (query: string) => {
        return chatComposable.searchMessages(query)
    }

    const getMessageById = (messageId: string) => {
        return messages.value.find(m => m.id === messageId) || null
    }

    const updateSettings = (newSettings: Partial<ChatSettings>) => {
        settings.value = { ...settings.value, ...newSettings }
        saveSettings()

        // Apply max messages limit if it changed
        if (newSettings.maxMessages && messages.value.length > newSettings.maxMessages) {
            messages.value = messages.value.slice(-newSettings.maxMessages)
        }
    }

    const resetSettings = () => {
        settings.value = {
            showTimestamps: true,
            maxMessages: 100,
            autoScroll: true,
            soundEnabled: true,
            showOnlineUsers: true
        }
        saveSettings()
    }

    // Persistence
    const saveSettings = () => {
        localStorage.setItem('chatSettings', JSON.stringify(settings.value))
    }

    const loadSettings = () => {
        try {
            const stored = localStorage.getItem('chatSettings')
            if (stored) {
                const savedSettings = JSON.parse(stored)
                settings.value = { ...settings.value, ...savedSettings }
            }
        } catch (err) {
            console.error('Failed to load chat settings:', err)
        }
    }

    // Utility functions
    const formatMessageTime = (timestamp: string): string => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffInHours < 1) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        }
    }

    const canDeleteMessage = (message: ChatMessage, currentUserId: string): boolean => {
        return message.user_id === currentUserId
    }

    const isSystemMessage = (message: ChatMessage): boolean => {
        return message.content.startsWith('System:') || message.user_id === 'system'
    }

    const getMentions = (content: string): string[] => {
        const mentionRegex = /@(\w+)/g
        const mentions: string[] = []
        let match

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1])
        }

        return mentions
    }

    const highlightMentions = (content: string): string => {
        return content.replace(/@(\w+)/g, '<span class="mention">@$1</span>')
    }

    return {
        // State
        messages: readonly(messages),
        onlineUsers: readonly(onlineUsers),
        typingUsers: readonly(typingUsers),
        unreadCount: readonly(unreadCount),
        isVisible: readonly(isVisible),
        settings: readonly(settings),
        loading: readonly(loading),
        error: readonly(error),
        connected: readonly(connected),

        // Getters
        hasMessages,
        hasUnreadMessages,
        sortedMessages,
        latestMessage,

        // Actions
        initializeStore,
        fetchMessages,
        sendMessage,
        deleteMessage,
        subscribeToChat,
        unsubscribeFromChat,
        clearMessages,
        setVisibility,
        markAsRead,
        addTypingUser,
        removeTypingUser,
        clearTypingUsers,
        addOnlineUser,
        removeOnlineUser,
        updateOnlineUsers,
        getMessagesByUser,
        searchMessages,
        getMessageById,
        updateSettings,
        resetSettings,

        // Utilities
        formatMessageTime,
        canDeleteMessage,
        isSystemMessage,
        getMentions,
        highlightMentions
    }
})