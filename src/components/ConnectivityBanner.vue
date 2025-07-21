<template>
  <VSnackbar
    v-model="isVisible"
    :color="bannerColor"
    :timeout="isOnline ? 5000 : -1"
    location="top"
    class="connectivity-banner"
  >
    <div class="d-flex align-center justify-space-between w-100">
      <span>{{ bannerMessage }}</span>
      <VBtn
        v-if="isOnline"
        variant="text"
        size="small"
        @click="handleSync"
      >
        Sync Now
      </VBtn>
    </div>
  </VSnackbar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const isOnline = ref(navigator.onLine)
const isVisible = ref(!navigator.onLine)

const bannerMessage = computed(() => {
  return isOnline.value 
    ? 'Back online. Click to sync.' 
    : 'You are offline'
})

const bannerColor = computed(() => {
  return isOnline.value ? 'success' : 'error'
})

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
  isVisible.value = true
  
  // Auto-hide after 5 seconds when coming back online
  if (isOnline.value) {
    setTimeout(() => {
      isVisible.value = false
    }, 5000)
  }
}

const handleSync = () => {
  // Emit event to parent component to handle sync logic
  window.dispatchEvent(new Event('sync-requested'))
  isVisible.value = false
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.connectivity-banner :deep(.v-snackbar__content) {
  width: 100%;
}
</style>
