<script setup lang="ts">
import { ref, computed } from "vue";
import { useSupabase } from "../composables/useSupabase";
import { useUserStore } from "../stores/userStore";

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: "close"): void;
  (e: "success"): void;
}

const { isOpen } = defineProps<Props>();
const emit = defineEmits<Emits>();

const { signIn, signUp, signInAnonymously, loading, error } = useUserStore();
const { signInWithOAuth } = useSupabase();

// Form state
const isLoginMode = ref(true);
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const username = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Validation
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

const isValidPassword = computed(() => password.value.length >= 6);
const passwordsMatch = computed(() => password.value === confirmPassword.value);

const canSubmit = computed(() => {
  if (isLoginMode.value) {
    return isValidEmail.value && isValidPassword.value;
  } else {
    return (
      isValidEmail.value &&
      isValidPassword.value &&
      passwordsMatch.value &&
      username.value.trim().length >= 2
    );
  }
});

// Methods
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  clearForm();
};

const clearForm = () => {
  email.value = "";
  password.value = "";
  confirmPassword.value = "";
  username.value = "";
  showPassword.value = false;
  showConfirmPassword.value = false;
};

const closeModal = () => {
  clearForm();
  emit("close");
};

const handleSubmit = async () => {
  if (!canSubmit.value) return;

  try {
    let result;
    if (isLoginMode.value) {
      result = await signIn(email.value, password.value);
    } else {
      result = await signUp(email.value, password.value, username.value);
    }

    if (result && !result.error) {
      emit("success");
      closeModal();
    }
  } catch (err) {
    console.error("Authentication error:", err);
  }
};

const handleOAuthLogin = async (provider: "google" | "github" | "facebook") => {
  try {
    const result = await signInWithOAuth(provider);
    if (result && !result.error) {
      // OAuth will redirect, so we don't need to emit here
      closeModal();
    }
  } catch (err) {
    console.error(`${provider} login error:`, err);
  }
};

const handleGuestLogin = async () => {
  try {
    const result = await signInAnonymously();
    if (result && !result.error) {
      emit("success");
      closeModal();
    }
  } catch (err) {
    console.error("Guest login error:", err);
  }
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter" && canSubmit.value) {
    handleSubmit();
  }
  if (event.key === "Escape") {
    closeModal();
  }
};
</script>

<template>
  <!-- Modal Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <!-- Modal Card -->
    <div
      class="glass-panel rounded-3xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl w-full max-w-md transform transition-all duration-300"
      @keydown="handleKeyPress"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-white/80"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1 13.5 2.5 16.17 5.33 10.5 11H6.5C5.67 11 5 11.67 5 12.5S5.67 14 6.5 14H7.5L9.5 16H17.5C18.33 16 19 15.33 19 14.5C19 13.67 18.33 13 17.5 13H15L13 11H14.83L19.5 6.33L21 7.83V9H21Z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-white text-lg font-semibold">
                {{ isLoginMode ? "Welcome Back" : "Join Us" }}
              </h2>
              <p class="text-white/60 text-sm">
                {{
                  isLoginMode
                    ? "Sign in to your account"
                    : "Create your account"
                }}
              </p>
            </div>
          </div>
          <button
            @click="closeModal"
            class="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <svg
              class="w-4 h-4 text-white/80"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Form Content -->
      <div class="p-6 space-y-6">
        <!-- Error Message -->
        <div
          v-if="error"
          class="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-3"
        >
          <p class="text-red-200 text-sm">{{ error }}</p>
        </div>

        <!-- Form Fields -->
        <div class="space-y-4">
          <!-- Username (Sign Up Only) -->
          <div v-if="!isLoginMode" class="space-y-2">
            <label class="text-white/80 text-sm font-medium">Username</label>
            <div
              class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg"
            >
              <input
                v-model="username"
                type="text"
                placeholder="Enter username"
                class="w-full bg-transparent text-white placeholder-white/60 outline-none text-sm"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label class="text-white/80 text-sm font-medium">Email</label>
            <div
              class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg"
            >
              <input
                v-model="email"
                type="email"
                placeholder="Enter your email"
                class="w-full bg-transparent text-white placeholder-white/60 outline-none text-sm"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <label class="text-white/80 text-sm font-medium">Password</label>
            <div
              class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg flex items-center gap-2"
            >
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter password"
                class="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm"
                :disabled="loading"
              />
              <button
                @click="showPassword = !showPassword"
                class="p-1 rounded-lg hover:bg-white/10 transition-colors"
                type="button"
              >
                <svg
                  class="w-4 h-4 text-white/60"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    v-if="showPassword"
                    d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                  />
                  <path
                    v-else
                    d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm Password (Sign Up Only) -->
          <div v-if="!isLoginMode" class="space-y-2">
            <label class="text-white/80 text-sm font-medium"
              >Confirm Password</label
            >
            <div
              class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg flex items-center gap-2"
            >
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm password"
                class="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm"
                :disabled="loading"
              />
              <button
                @click="showConfirmPassword = !showConfirmPassword"
                class="p-1 rounded-lg hover:bg-white/10 transition-colors"
                type="button"
              >
                <svg
                  class="w-4 h-4 text-white/60"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    v-if="showConfirmPassword"
                    d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                  />
                  <path
                    v-else
                    d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                  />
                </svg>
              </button>
            </div>
            <p
              v-if="!passwordsMatch && confirmPassword"
              class="text-red-300 text-xs"
            >
              Passwords do not match
            </p>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          @click="handleSubmit"
          :disabled="!canSubmit || loading"
          class="w-full p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          <svg
            v-if="loading"
            class="w-4 h-4 text-white animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span class="text-white font-medium">
            {{
              loading ? "Please wait..." : isLoginMode ? "Sign In" : "Sign Up"
            }}
          </span>
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-4">
          <div class="flex-1 h-px bg-white/20"></div>
          <span class="text-white/60 text-sm">or continue with</span>
          <div class="flex-1 h-px bg-white/20"></div>
        </div>

        <!-- OAuth Buttons -->
        <div class="grid grid-cols-3 gap-3">
          <!-- Google -->
          <button
            @click="handleOAuthLogin('google')"
            :disabled="loading"
            class="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </button>

          <!-- GitHub -->
          <button
            @click="handleOAuthLogin('github')"
            :disabled="loading"
            class="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
          </button>

          <!-- Facebook -->
          <button
            @click="handleOAuthLogin('facebook')"
            :disabled="loading"
            class="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
          </button>
        </div>

        <!-- Guest Login -->
        <button
          @click="handleGuestLogin"
          :disabled="loading"
          class="w-full p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg
            class="w-4 h-4 text-white/60"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1 13.5 2.5 16.17 5.33 10.5 11H6.5C5.67 11 5 11.67 5 12.5S5.67 14 6.5 14H7.5L9.5 16H17.5C18.33 16 19 15.33 19 14.5C19 13.67 18.33 13 17.5 13H15L13 11H14.83L19.5 6.33L21 7.83V9H21Z"
            />
          </svg>
          <span class="text-white/80 text-sm">Continue as Guest</span>
        </button>

        <!-- Toggle Mode -->
        <div class="text-center">
          <button
            @click="toggleMode"
            class="text-white/80 hover:text-white text-sm transition-colors"
          >
            {{
              isLoginMode
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Glass panel base styling */
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Button hover effects */
.login-modal button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-modal button:active {
  transform: scale(0.95);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.glass-panel {
  animation: fadeIn 0.3s ease-out;
}

/* Input focus styling */
.login-modal input:focus {
  outline: none;
}

/* iOS-style text styling */
.login-modal h2 {
  font-weight: 600;
  letter-spacing: -0.02em;
}

.login-modal label {
  font-weight: 500;
  letter-spacing: -0.01em;
}

/* Loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* OAuth button hover effects */
.login-modal button:hover svg {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Modal overlay fade in */
@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fixed.inset-0 {
  animation: overlayFadeIn 0.2s ease-out;
}
</style>
