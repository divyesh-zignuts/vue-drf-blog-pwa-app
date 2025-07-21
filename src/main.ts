import { createApp } from 'vue'

import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { registerSW } from 'virtual:pwa-register'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'


registerSW({ immediate: true })

// Create vue app
const app = createApp(App)

// Register plugins
registerPlugins(app)

// Mount vue app
app.mount('#app')
