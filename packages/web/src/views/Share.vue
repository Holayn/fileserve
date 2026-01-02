<script lang="ts">
  interface ShareData {
    name: string;
    reference: string;
    files: Array<{
      reference: string;
      fileName: string;
    }>;
  }

  const originalTitle = document.title;

  export default {
    name: 'Share',
    data() {
      return {
        reference: '',
        share: null as ShareData | null,
        loading: true,
      };
    },
    created() {
      const { share: reference } = this.$route.query;
      this.reference = reference as string;
    },
    async mounted() {
      if (!this.reference) {
        this.loading = false;
        return;
      }
      await fetch(`/api/share?reference=${this.reference}`)
        .then((response) => response.json())
        .then((data) => {
          this.share = data;
          if (data.name) {
            document.title = `${data.name} - ${originalTitle}`;
          }
        });
      this.loading = false;
    },
    beforeDestroy() {
      document.title = originalTitle;
    },
  }
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center min-h-screen">
    <div class="text-gray-500">Loading...</div>
  </div>
  <div v-else-if="!share" class="flex items-center justify-center min-h-screen">
    <div class="text-red-500">Share not found</div>
  </div>
  <div v-else class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ share.name }}</h1>
      <p class="text-gray-600">{{ share.files.length }} {{ share.files.length === 1 ? 'file' : 'files' }}</p>
    </div>
    
    <div class="bg-white rounded-lg shadow-md border border-gray-200">
      <div class="divide-y divide-gray-200">
        <a v-for="file in share.files" :key="file.reference" 
           :href="`/api/share/file?reference=${file.reference}&share=${reference}`"
           class="flex items-center px-6 py-2 hover:bg-gray-50 transition-colors block">
          <div class="flex-shrink-0 mr-4">
            <svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <span class="text-blue-600 hover:text-blue-800 font-medium block break-words">
              {{ file.fileName }}
            </span>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
