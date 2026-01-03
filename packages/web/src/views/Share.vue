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
        loadingShare: false,
        loadShareError: false,
        needsAuth: false,
        authError: false,
        authLoading: false,
        authErrorMessage: '',
        password: '',
      };
    },
    created() {
      const { share: reference } = this.$route.query;
      this.reference = reference as string;
    },
    mounted() {
      this.loadShare();
    },
    beforeDestroy() {
      document.title = originalTitle;
    },
    methods: {
      async loadShare() {
        this.loadShareError = false;
        this.needsAuth = false;

        if (!this.reference) {
          this.loadingShare = false;
          return;
        }

        this.loadingShare = true;

        try {
          const res = await fetch(`/api/share?reference=${this.reference}`);
          if (res.ok) {
            const data = await res.json();
            this.share = data;
            if (data.name) {
              document.title = `${data.name} - ${originalTitle}`;
            }
          } else {
            if (res.status === 401) {
              this.needsAuth = true;
            } else {
              this.loadShareError = true;
            }
          }
        } catch (error) {
          this.loadShareError = true;
        } finally {
          this.loadingShare = false;
        }
      },
      async submitAuth() {
        this.authLoading = true;
        this.authError = false;
        this.authErrorMessage = '';

        try {
          const res = await fetch(`/api/share/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reference: this.reference, password: this.password }),
          });
          if (res.ok) {
            this.needsAuth = false;
            this.loadShare();
          } else {
            this.authError = true;

            if (res.status === 401) {
              this.authErrorMessage = 'Invalid password';
            } else {
              this.authErrorMessage = 'Failed to authenticate';
            }
          }
        } catch (error) {
          this.authError = true;
          this.authErrorMessage = 'Failed to authenticate';
        } finally {
          this.authLoading = false;
        }
      }
    }
  }
</script>

<template>
  <div v-if="loadingShare" class="flex items-center justify-center min-h-screen">
    <div class="text-gray-500">Loading...</div>
  </div>
  <div v-else-if="loadShareError" class="flex items-center justify-center min-h-screen">
    <div class="text-red-500">Error loading files</div>
  </div>
  <div v-else-if="needsAuth" class="flex items-center justify-center min-h-screen">
    <form @submit.prevent="submitAuth">
      <label for="password">Password</label>
      <input v-model="password" class="w-64 block border border-gray-300 rounded px-2 py-1" type="password" required>
      <button class="mt-2 w-full block border border-gray-300 rounded px-2 py-1 bg-blue-500 text-white" type="submit">
        {{ authLoading ? 'loading...' : 'Submit' }}
      </button>
      <div v-if="authError" class="text-red-500">
        {{ authErrorMessage }}
      </div>
    </form>
  </div>
  <div v-else-if="!share" class="flex items-center justify-center min-h-screen">
    <div>Share not found</div>
  </div>
  <div v-else class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ share.name }}</h1>
      <p class="text-gray-600">{{ share.files.length }} {{ share.files.length === 1 ? 'file' : 'files' }}</p>
    </div>
    
    <div v-if="share.files.length" class="bg-white rounded-lg shadow-md border border-gray-200">
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
          <div>
            <a class="block border border-gray-200 rounded-full p-1 hover:bg-gray-200" :href="`/api/share/file?reference=${file.reference}&share=${reference}&download=true`">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
            </a>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
