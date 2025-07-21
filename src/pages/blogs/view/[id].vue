<script setup lang="ts">
import { getHTTPGetResponse } from '@/composables/useHTTPMethods'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const blogId = route.params.id
const blog = ref<any>(null)
const isLoading = ref(true)
const error = ref('')

const fetchBlogData = async () => {
    try {
        isLoading.value = true
        const response = await getHTTPGetResponse(`/blogs/${blogId}/`)
        if (response) {
            blog.value = {
                title: response.title || '',
                description: response.description || '',
                content: response.content || '',
                seo_meta_tags: response.seo_meta_tags || '',
                seo_description: response.seo_description || '',
                created_at: response.created_at || '',
                updated_at: response.updated_at || '',
                is_active: response.is_active || false
            }
        }
    } catch (err) {
        console.error('Error fetching blog data:', err)
        error.value = 'Failed to load blog. Please try again.'
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchBlogData()
})
</script>

<template>
    <div>
        <VCard>
            <VCardItem class="d-flex align-center justify-space-between">
                <VCardTitle>View Blog Post</VCardTitle>
                <VBtn
                    :to="`/blogs/edit/${blogId}`"
                    color="primary"
                    variant="tonal"
                    prepend-icon="tabler-edit"
                >
                    Edit
                </VBtn>
            </VCardItem>

            <VCardText>
                <VAlert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                >
                    {{ error }}
                </VAlert>

                <VProgressLinear
                    v-if="isLoading"
                    indeterminate
                    color="primary"
                    class="mb-4"
                />

                <div v-else-if="blog">
                    <h1 class="text-h4 mb-4">{{ blog.title }}</h1>
                    
                    <div class="text-body-2 text-medium-emphasis mb-6">
                        <span v-if="blog.created_at" class="me-4">
                            <VIcon icon="tabler-calendar" size="16" class="me-1" />
                            {{ new Date(blog.created_at).toLocaleDateString() }}
                        </span>
                        <span v-if="blog.updated_at && new Date(blog.updated_at) > new Date(blog.created_at)">
                            <VIcon icon="tabler-edit" size="16" class="me-1" />
                            Updated {{ new Date(blog.updated_at).toLocaleDateString() }}
                        </span>
                    </div>

                    <div class="mb-6">
                        <p class="text-body-1">{{ blog.description }}</p>
                    </div>

                    <div class="mb-6 d-flex align-center">
                        <VSwitch
                            :model-value="blog.is_active"
                            :label="blog.is_active ? 'Active' : 'Inactive'"
                            color="success"
                            readonly
                            hide-details
                            class="mt-0"
                        />
                    </div>

                    <VDivider class="my-6" />

                    <div class="blog-content" v-html="blog.content"></div>

                    <VDivider class="my-6" />

                    <div v-if="blog.seo_meta_tags" class="mt-6">
                        <h3 class="text-h6 mb-2">Tags</h3>
                        <div class="d-flex flex-wrap gap-2">
                            <VChip
                                v-for="(tag, index) in blog.seo_meta_tags.split(',').map(t => t.trim())"
                                :key="index"
                                size="small"
                                color="primary"
                                variant="outlined"
                            >
                                {{ tag }}
                            </VChip>
                        </div>
                    </div>
                </div>

                <div v-else class="text-center py-8">
                    <p>No blog post found</p>
                </div>
            </VCardText>
        </VCard>
    </div>
</template>

<style lang="scss" scoped>
.blog-content {
    line-height: 1.7;
    
    :deep(p) {
        margin-bottom: 1.5rem;
    }
    
    :deep(h2) {
        margin: 2rem 0 1rem;
        font-size: 1.5rem;
        font-weight: 600;
    }
    
    :deep(h3) {
        margin: 1.5rem 0 1rem;
        font-size: 1.3rem;
        font-weight: 500;
    }
    
    :deep(ul), :deep(ol) {
        margin: 1rem 0 1rem 2rem;
    }
    
    :deep(li) {
        margin-bottom: 0.5rem;
    }
    
    :deep(img) {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
        margin: 1.5rem 0;
    }
    
    :deep(a) {
        color: rgb(var(--v-theme-primary));
        text-decoration: none;
        
        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
