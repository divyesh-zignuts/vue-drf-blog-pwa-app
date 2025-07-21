<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'
import PWAInstallPrompt from './components/PWAInstallPrompt.vue'
import ConnectivityBanner from './components/ConnectivityBanner.vue'

const { global } = useTheme()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()
const appKey = ref(0)

// Handle sync when coming back online
const handleSync = () => {
  // Force refresh the current route to sync data
  appKey.value++
  
  // Additional sync logic can be added here if needed
  console.log('Syncing application data...')
}

// Check if the app is launched in standalone mode
onMounted(() => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('Launched as PWA')
    configStore.isPWA = true
  }
  
  // Listen for sync requests from ConnectivityBanner
  window.addEventListener('sync-requested', handleSync)
})

onBeforeUnmount(() => {
  window.removeEventListener('sync-requested', handleSync)
})
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      
      <PWAInstallPrompt />
      <ConnectivityBanner @sync-requested="handleSync" />
      
      <RouterView :key="appKey" />

      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>
