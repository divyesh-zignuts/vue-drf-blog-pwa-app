<script setup lang="ts">
import TipTapEditor from '@/components/editor/TipTapEditor.vue'
import { getHTTPPostResponse } from '@/composables/useHTTPMethods'
import { ref, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { addPendingOperation, cacheBlogs, getCachedBlogs } from '@/services/offlineDatabase'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css';

const router = useRouter()
const isOnline = ref(navigator.onLine)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

const formData = ref({
    title: '',
    description: '',
    content: '',
    seo_meta_tags: '',
    seo_description: '',
    is_active: true,
    isSynced: false
})

const isFormValid = ref(false)
const hasSubmitted = ref(false)
const isSubmitting = ref(false)

// Handle network status changes
const handleNetworkChange = () => {
    isOnline.value = navigator.onLine
}

// Validate editor content
const validateContent = () => {
    const hasContent = formData.value.content && 
                      formData.value.content.trim() !== '' && 
                      formData.value.content !== '<p></p>'
    return hasContent
}

// Handle form submission
const handleSubmit = async () => {
    hasSubmitted.value = true

    // Validate all required fields
    if (!formData.value.title || !formData.value.description || 
        !validateContent() || !formData.value.seo_meta_tags || 
        !formData.value.seo_description) {
        return
    }

    isSubmitting.value = true

    try {
        if (navigator.onLine) {
            isOnline.value = true;
            try {
                const response = await getHTTPPostResponse(
                    "/blogs/", 
                    formData.value, 
                    true
                )
                if (response) {
                    // Cache the new blog locally
                    const blogs = await getCachedBlogs();
                    await cacheBlogs([
                      ...blogs,
                      {
                        ...formData.value,
                        isSynced: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }
                    ]);
                    router.push({ name: 'blogs', query: { updated: '1' } })
                }
            } catch (apiError) {
                if (!navigator.onLine) {
                    isOnline.value = false;
                    await addPendingOperation(
                        'CREATE',
                        { 
                            ...formData.value,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        },
                        '/blogs/'
                    )
                    // Cache the new blog locally
                    const blogs = await getCachedBlogs();
                    await cacheBlogs([
                      ...blogs,
                      {
                        ...formData.value,
                        isSynced: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }
                    ]);
                    toast.success('Blog post saved offline. It will be published when you\'re back online.')
                    router.push({ name: 'blogs' })
                } else {
                    toast.error('Failed to add blog. Please try again.', {
                        theme: 'colored',
                        autoClose: 3000,
                        hideProgressBar: false,
                        position: 'top-right',
                        pauseOnHover: true,
                    });
                }
            }
        } else {
            isOnline.value = false;
            // Queue for sync when online
            await addPendingOperation(
                'CREATE',
                { 
                    ...formData.value,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                '/blogs/'
            )
            // Cache the new blog locally
            const blogs = await getCachedBlogs();
            await cacheBlogs([
              ...blogs,
              {
                ...formData.value,
                isSynced: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
            toast.success('Blog post saved offline. It will be published when you\'re back online.')
            router.push({ name: 'blogs' })
        }
    } catch (error) {
        showError('Failed to save blog post. Please try again.')
    } finally {
        isSubmitting.value = false
    }
}

// Show success notification
const showSuccess = (message: string) => {
    toast.success(message, {
        theme: 'colored',
        autoClose: 3000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
    })
}

// Show error notification
const showError = (message: string) => {
    toast.error(message, {
        theme: 'colored',
        autoClose: 5000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
    })
}

// Set up event listeners
onMounted(() => {
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
});

// Clean up event listeners
onBeforeUnmount(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
});

watchEffect(() => {
  isOnline.value = navigator.onLine;
});
</script>

<template>
    <div>
        <VCard>
            <VCardItem class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                    <VCardTitle>Add New Blog Post</VCardTitle>
                    <VChip
                        v-if="!isOnline"
                        color="warning"
                        size="small"
                        class="ml-4"
                    >
                        <VIcon icon="tabler-wifi-off" size="16" class="mr-1" />
                        Offline Mode
                    </VChip>
                </div>
                <VBtn 
                    color="secondary" 
                    variant="tonal" 
                    :to="{ name: 'blogs' }"
                    :disabled="isSubmitting"
                >
                    <VIcon start icon="tabler-arrow-left" />
                    Back to List
                </VBtn>
            </VCardItem>

            <VCardText>
                <VAlert
                    v-if="!isOnline"
                    type="warning"
                    variant="tonal"
                    class="mb-4"
                >
                    You are currently offline. Your blog post will be saved locally and synced when you're back online.
                </VAlert>

                <VForm v-model="isFormValid" @submit.prevent="handleSubmit">
                    <VRow>
                        <VCol cols="12">
                            <VTextField 
                                v-model="formData.title" 
                                label="Title"
                                :rules="[v => !!v || 'Title is required']" 
                                required 
                            />
                        </VCol>

                        <VCol cols="12">
                            <VTextarea 
                                v-model="formData.description" 
                                label="Description" 
                                rows="3"
                                :rules="[v => !!v || 'Description is required']" 
                                required 
                            />
                        </VCol>

                        <VCol cols="12">
                            <VLabel class="mb-2">Content <span class="text-error">*</span></VLabel>
                            <TipTapEditor 
                                v-model="formData.content"
                                placeholder="Start writing your blog post here..." 
                            />
                            <div v-if="hasSubmitted && !validateContent()" class="text-error text-caption mt-1">
                                Content is required
                            </div>
                        </VCol>

                        <VCol cols="12" md="6">
                            <VTextField 
                                v-model="formData.seo_meta_tags" 
                                label="SEO Meta Tags" 
                                hint="Enter tags separated by commas (e.g., tag1, tag2, tag3)"
                                :rules="[v => !!v || 'SEO Meta Tags are required']" 
                                required 
                            />
                        </VCol>

                        <VCol cols="12" md="6">
                            <VTextField 
                                v-model="formData.seo_description" 
                                label="SEO Meta Description"
                                :rules="[v => !!v || 'SEO Meta Description is required']" 
                                required 
                            />
                        </VCol>

                        <VCol cols="12" class="d-flex gap-4">
                            <VBtn 
                                type="submit" 
                                color="primary" 
                                :loading="isSubmitting"
                                :disabled="!isFormValid || isSubmitting"
                                :prepend-icon="!isOnline ? 'tabler-device-floppy' : 'tabler-send'"
                            >
                                {{ isOnline ? 'Publish Post' : 'Save Offline' }}
                            </VBtn>

                            <VBtn 
                                color="secondary" 
                                variant="tonal" 
                                :to="{ name: 'blogs' }" 
                                :disabled="isSubmitting"
                            >
                                <VIcon start icon="tabler-x" />
                                Cancel
                            </VBtn>
                        </VCol>
                    </VRow>
                </VForm>
            </VCardText>
        </VCard>
    </div>
</template>

<style lang="scss" scoped></style>
