<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useUserStore } from "../stores/userStore";
import { useSupabase } from "../composables/useSupabase";
import LoginModal from "./LoginModal.vue";

const userStore = useUserStore();
const { signOut } = useSupabase();

// State
const showLoginModal = ref(false);
const showProfileDropdown = ref(false);

// Computed
const user = computed(() => userStore.user);
const isAuthenticated = computed(() => userStore.isAuthenticated);
const isAnonymous = computed(() => userStore.isAnonymous);
const userDisplayName = computed(() => {
  if (!user.value) return "Guest";
  if (userStore.username) return userStore.username;
  if (user.value.email) return user.value.email.split("@")[0];
  return "User";
});

const userAvatar = computed(() => {
  if (user.value?.user_metadata?.avatar_url)
    return user.value.user_metadata.avatar_url;
  if (userStore.avatarUrl) return userStore.avatarUrl;
  return null;
});

const userInitials = computed(() => {
  return userDisplayName.value.charAt(0).toUpperCase();
});

// Methods
const openLoginModal = () => {
  showLoginModal.value = true;
  showProfileDropdown.value = false;
};

const closeLoginModal = () => {
  showLoginModal.value = false;
};

const onLoginSuccess = () => {
  showLoginModal.value = false;
};

const toggleProfileDropdown = () => {
  showProfileDropdown.value = !showProfileDropdown.value;
};

const handleSignOut = async () => {
  await signOut();
  showProfileDropdown.value = false;
};

const upgradeAccount = () => {
  showProfileDropdown.value = false;
  showLoginModal.value = true;
};

// Close dropdown when clicking outside
const closeDropdownOnOutsideClick = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".profile-container")) {
    showProfileDropdown.value = false;
  }
};

// Add event listener for clicking outside
onMounted(() => {
  document.addEventListener("click", closeDropdownOnOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener("click", closeDropdownOnOutsideClick);
});
</script>

<template>
  <div class="profile-container absolute top-4 right-4 z-[2]">
    <!-- Before Login: Sign In/Sign Up Buttons -->
    <div
      v-if="!isAuthenticated"
      class="glass-panel rounded-3xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-4"
    >
      <div class="flex flex-col gap-3">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center"
          >
            <svg
              class="w-4 h-4 text-white/80"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1 13.5 2.5 16.17 5.33 10.5 11H6.5C5.67 11 5 11.67 5 12.5S5.67 14 6.5 14H7.5L9.5 16H17.5C18.33 16 19 15.33 19 14.5C19 13.67 18.33 13 17.5 13H15L13 11H14.83L19.5 6.33L21 7.83V9H21Z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-white text-sm font-semibold">Welcome!</h3>
            <p class="text-white/60 text-xs">Join the community</p>
          </div>
        </div>

        <!-- Sign In Button -->
        <button
          @click="openLoginModal"
          class="w-full p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <svg
            class="w-4 h-4 text-white/90"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M10 17V14H3V10H10V7L15 12L10 17Z" />
          </svg>
          <span class="text-white text-sm font-medium">Sign In</span>
        </button>

        <!-- Guest Login -->
        <button
          @click="openLoginModal"
          class="w-full p-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
        >
          <svg
            class="w-3 h-3 text-white/60"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1 13.5 2.5 16.17 5.33 10.5 11H6.5C5.67 11 5 11.67 5 12.5S5.67 14 6.5 14H7.5L9.5 16H17.5C18.33 16 19 15.33 19 14.5C19 13.67 18.33 13 17.5 13H15L13 11H14.83L19.5 6.33L21 7.83V9H21Z"
            />
          </svg>
          <span class="text-white/80 text-xs">Continue as Guest</span>
        </button>
      </div>
    </div>

    <!-- After Login: Profile Avatar & Info -->
    <div
      v-else
      class="glass-panel rounded-3xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-4 relative"
    >
      <!-- Profile Button -->
      <button
        @click="toggleProfileDropdown"
        class="w-full flex items-center gap-3 hover:bg-white/10 rounded-2xl p-2 transition-all duration-200 hover:scale-105"
      >
        <!-- Avatar -->
        <div
          class="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          <img
            v-if="userAvatar"
            :src="userAvatar"
            :alt="userDisplayName"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-white/90 text-sm font-semibold">
            {{ userInitials }}
          </span>
        </div>

        <!-- User Info -->
        <div class="flex-1 text-left">
          <h3 class="text-white text-sm font-semibold truncate">
            {{ userDisplayName }}
          </h3>
          <p class="text-white/60 text-xs truncate">
            {{ isAnonymous ? "Guest User" : user?.email || "Member" }}
          </p>
        </div>

        <!-- Dropdown Arrow -->
        <svg
          class="w-4 h-4 text-white/60 transition-transform duration-200"
          :class="{ 'rotate-180': showProfileDropdown }"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </button>

      <!-- Profile Dropdown -->
      <div
        v-if="showProfileDropdown"
        class="absolute top-full left-0 right-0 mt-2 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        <!-- Profile Info Section -->
        <div class="p-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="userAvatar"
                :src="userAvatar"
                :alt="userDisplayName"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-white/90 text-base font-semibold">
                {{ userInitials }}
              </span>
            </div>
            <div class="flex-1">
              <h4 class="text-white text-sm font-semibold">
                {{ userDisplayName }}
              </h4>
              <p class="text-white/60 text-xs">
                {{ user?.email || "Guest User" }}
              </p>
              <div class="flex items-center gap-1 mt-1">
                <div class="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                <span class="text-green-300 text-xs">{{
                  isAnonymous ? "Guest" : "Member"
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Menu Items -->
        <div class="p-2">
          <!-- Upgrade Account (for guests) -->
          <button
            v-if="isAnonymous"
            @click="upgradeAccount"
            class="w-full p-3 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center gap-3 text-left"
          >
            <svg
              class="w-4 h-4 text-amber-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
              />
            </svg>
            <div>
              <span class="text-white text-sm font-medium"
                >Upgrade Account</span
              >
              <p class="text-white/60 text-xs">Create your profile</p>
            </div>
          </button>

          <!-- Profile Settings -->
          <button
            v-else
            @click="showProfileDropdown = false"
            class="w-full p-3 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center gap-3 text-left"
          >
            <svg
              class="w-4 h-4 text-white/70"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM16 8H8C6.9 8 6 8.9 6 10V22H8V16H10V22H14V16H16V22H18V10C18 8.9 17.1 8 16 8Z"
              />
            </svg>
            <div>
              <span class="text-white text-sm">Profile Settings</span>
              <p class="text-white/60 text-xs">Edit your information</p>
            </div>
          </button>

          <!-- Preferences -->
          <button
            @click="showProfileDropdown = false"
            class="w-full p-3 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center gap-3 text-left"
          >
            <svg
              class="w-4 h-4 text-white/70"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19.14,12.94C19.18,12.64 19.2,12.33 19.2,12C19.2,11.68 19.18,11.36 19.14,11.06L20.77,9.8C20.9,9.69 20.93,9.5 20.85,9.36L19.35,6.64C19.27,6.5 19.1,6.44 18.95,6.5L17.03,7.24C16.66,6.95 16.26,6.71 15.84,6.53L15.56,4.5C15.53,4.33 15.38,4.2 15.2,4.2H12.2C12.02,4.2 11.87,4.33 11.84,4.5L11.56,6.53C11.14,6.71 10.74,6.95 10.37,7.24L8.45,6.5C8.3,6.44 8.13,6.5 8.05,6.64L6.55,9.36C6.47,9.5 6.5,9.69 6.63,9.8L8.26,11.06C8.22,11.36 8.2,11.68 8.2,12C8.2,12.33 8.22,12.64 8.26,12.94L6.63,14.2C6.5,14.31 6.47,14.5 6.55,14.64L8.05,17.36C8.13,17.5 8.3,17.56 8.45,17.5L10.37,16.76C10.74,17.05 11.14,17.29 11.56,17.47L11.84,19.5C11.87,19.67 12.02,19.8 12.2,19.8H15.2C15.38,19.8 15.53,19.67 15.56,19.5L15.84,17.47C16.26,17.29 16.66,17.05 17.03,16.76L18.95,17.5C19.1,17.56 19.27,17.5 19.35,17.36L20.85,14.64C20.93,14.5 20.9,14.31 20.77,14.2L19.14,12.94M13.7,16C11.76,16 10.2,14.44 10.2,12.5S11.76,9 13.7,9S17.2,10.56 17.2,12.5S15.64,16 13.7,16Z"
              />
            </svg>
            <div>
              <span class="text-white text-sm">Preferences</span>
              <p class="text-white/60 text-xs">App settings</p>
            </div>
          </button>

          <!-- Divider -->
          <div class="h-px bg-white/10 my-2"></div>

          <!-- Sign Out -->
          <button
            @click="handleSignOut"
            class="w-full p-3 rounded-xl hover:bg-red-500/20 transition-all duration-200 flex items-center gap-3 text-left"
          >
            <svg
              class="w-4 h-4 text-red-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"
              />
            </svg>
            <span class="text-red-300 text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <LoginModal
      :is-open="showLoginModal"
      @close="closeLoginModal"
      @success="onLoginSuccess"
    />
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
