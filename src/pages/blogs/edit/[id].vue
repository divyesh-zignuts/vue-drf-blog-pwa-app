<script setup lang="ts">
import TipTapEditor from '@/components/editor/TipTapEditor.vue'
import { getHTTPGetResponse, getHTTPPutResponse } from '@/composables/useHTTPMethods'
import { ref, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addPendingOperation, getCachedBlog, cacheBlogs, getCachedBlogs } from '@/services/offlineDatabase'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css';

const route = useRoute()
const router = useRouter()
const blogId = Number(route.params.id)
const isOnline = ref(navigator.onLine)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

const formData = ref({
    id: blogId,
    title: '',
    description: '',
    content: '',
    seo_meta_tags: '',
    seo_description: '',
    is_active: false,
    isSynced: true
})

const isFormValid = ref(false)
const hasSubmitted = ref(false)
const isSubmitting = ref(false)
const isLoading = ref(true)
const error = ref('')

const validateContent = () => {
    const hasContent = formData.value.content && formData.value.content.trim() !== '' && formData.value.content !== '<p></p>'
    return hasContent
}

const fetchBlogData = async () => {
    try {
        isLoading.value = true;
        if (navigator.onLine) {
            isOnline.value = true;
            try {
                const response = await getHTTPGetResponse(`/blogs/${blogId}/`);
                let blogData = null;
                if (response && response.data) {
                    blogData = response.data;
                } else if (response && response.id) {
                    blogData = response;
                }
                if (blogData) {
                    formData.value = {
                        id: blogData.id,
                        title: blogData.title || '',
                        description: blogData.description || '',
                        content: blogData.content || '',
                        seo_meta_tags: blogData.seo_meta_tags || '',
                        seo_description: blogData.seo_description || '',
                        is_active: blogData.is_active || false,
                        isSynced: true
                    };
                    await cacheBlogs([blogData]);
                }
            } catch (apiError) {
                if (!navigator.onLine) {
                    isOnline.value = false;
                    const cachedBlog = await getCachedBlog(blogId);
                    if (cachedBlog) {
                        formData.value = {
                            ...cachedBlog,
                            isSynced: false // Mark as not synced if loaded from cache
                        };
                        showWarning('You are offline. Showing cached data.');
                    } else {
                        error.value = 'Cannot load blog data while offline. Please check your connection.';
                    }
                } else {
                    showError('Failed to fetch blog. Please try again.');
                }
            }
        } else {
            isOnline.value = false;
            const cachedBlog = await getCachedBlog(blogId);
            if (cachedBlog) {
                formData.value = {
                    ...cachedBlog,
                    isSynced: false // Mark as not synced if loaded from cache
                };
                showWarning('You are offline. Showing cached data.');
            } else {
                error.value = 'Cannot load blog data while offline. Please check your connection.';
            }
        }
    } catch (err) {
        if (isOnline.value) {
            const cachedBlog = await getCachedBlog(blogId);
            if (cachedBlog) {
                formData.value = {
                    ...cachedBlog,
                    isSynced: false
                };
                showWarning('Showing cached data due to network error.');
                return;
            }
        }
        error.value = 'Failed to load blog data. ' + (isOnline.value ? 'Please try again.' : 'You are currently offline.');
    } finally {
        isLoading.value = false;
    }
};

// Helper function to show error message
const showError = (message: string) => {
    toast.error(message, {
        theme: 'colored',
        autoClose: 5000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
    });
};

// Helper function to show success message
const showSuccess = (message: string) => {
    toast.success(message, {
        theme: 'colored',
        autoClose: 3000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
    });
};

// Helper function to show warning message
const showWarning = (message: string) => {
    toast.warning(message, {
        theme: 'colored',
        autoClose: 5000,
        hideProgressBar: false,
        position: 'top-right',
        pauseOnHover: true,
    });
};

const handleSubmit = async () => {
    hasSubmitted.value = true;
    if (!formData.value.title || !formData.value.description || !validateContent() ||
        !formData.value.seo_meta_tags || !formData.value.seo_description) {
        return;
    }
    isSubmitting.value = true;
    error.value = '';
    try {
        if (navigator.onLine) {
            isOnline.value = true;
            try {
                const response = await getHTTPPutResponse(
                    `/blogs/${blogId}/`, 
                    formData.value, 
                    true
                );
                if (response) {
                    const blogs = await getCachedBlogs();
                    const updatedBlogs = blogs.map(blog =>
                      blog.id === formData.value.id
                        ? { ...formData.value, isSynced: true, updated_at: new Date().toISOString() }
                        : blog
                    );
                    await cacheBlogs(updatedBlogs);
                    try {
                      await router.push({ name: 'blogs', query: { updated: '1' } });
                    } catch (navErr) {
                      // Navigation error
                    }
                }
            } catch (apiError) {
                if (!navigator.onLine) {
                    isOnline.value = false;
                    await addPendingOperation(
                        'UPDATE',
                        { 
                            ...formData.value,
                            updated_at: new Date().toISOString()
                        },
                        '/blogs/'
                    );
                    const blogs = await getCachedBlogs();
                    const updatedBlogs = blogs.map(blog =>
                      blog.id === formData.value.id
                        ? { ...formData.value, isSynced: false, updated_at: new Date().toISOString() }
                        : blog
                    );
                    await cacheBlogs(updatedBlogs);
                    showSuccess('Changes saved offline. They will be synced when you\'re back online.');
                    router.push({ name: 'blogs' });
                } else {
                    showError('Failed to update blog. Please try again.');
                }
            }
        } else {
            isOnline.value = false;
            await addPendingOperation(
                'UPDATE',
                { 
                    ...formData.value,
                    updated_at: new Date().toISOString()
                },
                '/blogs/'
            );
            const blogs = await getCachedBlogs();
            const updatedBlogs = blogs.map(blog =>
              blog.id === formData.value.id
                ? { ...formData.value, isSynced: false, updated_at: new Date().toISOString() }
                : blog
            );
            await cacheBlogs(updatedBlogs);
            showSuccess('Changes saved offline. They will be synced when you\'re back online.');
            router.push({ name: 'blogs' });
        }
    } catch (err) {
        if (isOnline.value) {
            error.value = 'Failed to update blog. Please try again.';
            showError(error.value);
        } else {
            error.value = 'Failed to save changes. Please check your connection and try again.';
            showError(error.value);
        }
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {
  updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  fetchBlogData();
});

onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});

watchEffect(() => {
  isOnline.value = navigator.onLine;
});
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Edit Blog Post</h1>
    </div>
    <VCard>
      <VCardText>
        <div v-if="!isOnline" class="flex items-center bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <span>Offline Mode</span>
        </div>
        <VForm v-else v-model="isFormValid" @submit.prevent="handleSubmit" :key="formData.id">
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
                :key="formData.id"
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
                label="SEO Description"
                :rules="[v => !!v || 'SEO Description is required']"
                required
                class="mb-4"
              />
              <VSwitch
                v-model="formData.is_active"
                label="Active Status"
                color="success"
                class="mt-2"
                hide-details
              />
            </VCol>

            <VCol cols="12" class="d-flex gap-4">
              <VBtn 
                type="submit" 
                color="primary" 
                :loading="isSubmitting"
                :disabled="!isFormValid || isSubmitting"
              >
                <VIcon start icon="tabler-edit" />
                Update Post
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
