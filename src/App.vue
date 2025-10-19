<script setup lang="ts">
import { onMounted } from "vue";
import { useUserStore } from "./stores/userStore";

const userStore = useUserStore();

onMounted(async () => {
  await userStore.initialize();
});
</script>

<template>
  <div id="app" class="bg-white w-screen h-screen overflow-hidden">
    <router-view />
  </div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
