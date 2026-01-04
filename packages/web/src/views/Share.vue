<script lang="ts">
  import Plyr from 'plyr';
  import 'plyr/dist/plyr.css';

  interface ShareData {
    name: string;
    reference: string;
    files: Array<FileData>;
  }

  interface FileData {
    reference: string;
    fileName: string;
    contentType: string;
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
        authShareName: '',
        password: '',

        viewFile: null as FileData | null,
        mediaLoading: false,
        mediaLoadError: false,
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

              const data = await res.json();
              this.authShareName = data.name;
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
        if (this.authLoading) {
          return;
        }

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
      },

      getFileUrl(file: { reference: string; fileName: string }, download: boolean = false) {
        if (download) {
          return `/api/share/file?reference=${file.reference}&share=${this.reference}`;
        }
        return `/api/share/file/preview?reference=${file.reference}&share=${this.reference}`;
      },
      isViewableImage(file: FileData) {
        return file.contentType.startsWith('image/');
      },
      isViewableVideo(file: FileData) {
        return file.contentType.includes('video/mp4');
      },
      async openPreview(file: FileData) {
        this.viewFile = file;
        this.mediaLoadError = false;

        // Reset loading state for images
        if (this.isViewableImage(file)) {
          this.mediaLoading = true;
        }
        if (this.isViewableVideo(file)) {
          this.mediaLoading = true;
        }
        
        const dialog = this.$refs.fileDialog as HTMLDialogElement;
        if (dialog) {
          dialog.showModal();

          if (this.$refs.video) {
            const player = new Plyr(this.$refs.video as HTMLVideoElement, {
              controls: ['play-large', 'play', 'progress', 'current-time', 'settings', 'fullscreen'],
            });
            player.on('ready', () => {
              this.mediaLoading = false;
              player.play();
            });
          }
        }
      },
      onImageLoad() {
        this.mediaLoading = false;
      },
      onImageLoadError() {
        this.mediaLoading = false;
        this.mediaLoadError = true;
      },
      // Helper in case Plyr doesn't trigger correctly or for standard video tags
      onVideoLoad() {
        this.mediaLoading = false;
      },
      onVideoLoadError() {
        this.mediaLoading = false;
        this.mediaLoadError = true;
      },
      closePreview() {
        const dialog = this.$refs.fileDialog as HTMLDialogElement;
        if (dialog) {
          dialog.close();
        }
        this.viewFile = null;
        this.mediaLoading = false;
      },
      handleBackdropClick(event: MouseEvent) {
        if (event.target === this.$refs.fileDialog) {
          this.closePreview();
        }
      },
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
  <div v-else-if="needsAuth" class="flex flex-col items-center justify-center min-h-screen px-4">
    <h1 v-if="authShareName" class="text-3xl font-bold text-gray-800 mb-2 text-center">{{ authShareName }}</h1>
    <div class="max-w-full">
      <form @submit.prevent="submitAuth">
        <label for="password" class="sr-only">Password</label>
        <input v-model="password" class="w-64 max-w-full block border border-gray-300 rounded px-2 py-2" type="password" required placeholder="Password">
        <button class="mt-2 w-full block border border-gray-300 rounded-md px-2 py-2 bg-blue-500 text-white" type="submit">
          <div v-if="authLoading">Loading...</div>
          <div v-else class="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
          </div>
        </button>
        <div v-if="authError" class="text-red-500">
          {{ authErrorMessage }}
        </div>
      </form>
    </div>
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
        <button v-for="file in share.files" :key="file.reference" 
           class="w-full flex items-center px-6 py-2 hover:bg-gray-50 transition-colors text-left"
           @click="openPreview(file)"
        >
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
        </button>
      </div>
    </div>
  </div>

  <dialog 
    ref="fileDialog" 
    class="backdrop:bg-black/75 w-fit min-w-[50vw] h-screen max-w-[calc(100vw-1rem)] md:max-w-[90vw] rounded-lg shadow-2xl p-0"
    @close="viewFile = null"
    @click="handleBackdropClick"
  >
    <div v-if="viewFile" class="flex flex-col h-full">
      <div class="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <h3 class="font-bold text-lg truncate">{{ viewFile.fileName }}</h3>
        <button @click="closePreview" class="p-2 hover:bg-gray-100 rounded-full">
          <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        </button>
      </div>

      <div class="relative p-1 lg:p-6 flex-1 min-h-0 overflow-auto flex flex-col items-center justify-center xmin-h-[300px]">
        <div v-if="mediaLoading" class="absolute flex flex-col items-center justify-center z-20">
          <div>Loading...</div>
        </div>
        <template v-if="!mediaLoadError">
          <template v-if="isViewableImage(viewFile)">
            <img :src="getFileUrl(viewFile)" class="max-w-full max-h-full object-contain rounded-sm transition-opacity duration-300" :class="mediaLoading ? 'opacity-0' : 'opacity-100'" @load="onImageLoad">
          </template>
          
          <template v-else-if="isViewableVideo(viewFile)">
            <video 
              ref="video" 
              controls 
              :src="getFileUrl(viewFile)" 
              class="max-w-full max-h-full object-contain rounded-sm transition-opacity duration-300"
              :class="mediaLoading ? 'opacity-0' : 'opacity-100'"
              @loadeddata="onVideoLoad"
              @error="onVideoLoadError"
            ></video>
          </template>
        </template>
        <div v-else class="text-center py-12">
          <div class="bg-gray-200 p-6 rounded-full inline-block mb-4">
            <svg class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke-width="2"></path></svg>
          </div>
          <p class="text-gray-600 font-medium">No preview available</p>
        </div>
      </div>

      <div class="p-4 border-t flex justify-center gap-3 bg-white">
        <a :href="getFileUrl(viewFile, true)" 
            class="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
          Download
        </a>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
</style>
