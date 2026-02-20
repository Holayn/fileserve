<script lang="ts">
  import videojs from 'video.js';
  import 'video.js/dist/video-js.css';

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
        player: null as any,
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
      if (this.player) {
        this.player.dispose();
      }
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
        return `/api/share/file/view?reference=${file.reference}&share=${this.reference}`;
      },
      isImage(file: FileData) {
        return file.contentType.startsWith('image/');
      },
      isVideo(file: FileData) {
        return file.contentType.includes('video/mp4');
      },
      async openPreview(file: FileData) {
        this.viewFile = file;
        this.mediaLoadError = false;

        if (this.isImage(file) || this.isVideo(file)) {
          this.mediaLoading = true;
        }
        
        const dialog = this.$refs.fileDialog as any;
        if (dialog) {
          dialog.show();
          await this.$nextTick();
          if (this.$refs.video && this.isVideo(this.viewFile)) {
            // Fetch headers only to check what the server is sending
            const videoUrl = this.getFileUrl(this.viewFile);
            const response = await fetch(videoUrl, { method: 'HEAD' });
            const contentType = response.headers.get('Content-Type');

            let type = 'video/mp4';
            if (contentType?.includes('mpegurl') || contentType?.includes('mpegURL')) {
              type = 'application/x-mpegURL';
            }

            this.player = videojs(this.$refs.video as HTMLVideoElement, {
              controls: true,
              autoplay: true,
              preload: 'auto',
              responsive: true,
              fluid: true,
              sources: [
                {
                  src: videoUrl,
                  type,
                }
              ]
            });

            this.player.ready(() => {
              this.player.one('canplay', () => {
                this.mediaLoading = false;
              });
              this.player.one('error', () => {
                this.mediaLoading = false;
                this.mediaLoadError = true;
              });
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
        const dialog = this.$refs.fileDialog as any;
        if (dialog) {
          dialog.hide();
        }
      },
      onDialogAfterHide() {
        if (this.player) {
          this.player.dispose();
          this.player = null;
        }
        this.viewFile = null;
        this.mediaLoading = false;
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
    <h1 v-if="authShareName" class="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2 text-center">{{ authShareName }}</h1>
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
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">{{ share.name }}</h1>
      <p class="text-gray-600 dark:text-gray-400">{{ share.files.length }} {{ share.files.length === 1 ? 'file' : 'files' }}</p>
    </div>
    
    <div v-if="share.files.length" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <button v-for="file in share.files" :key="file.reference" 
           class="w-full flex items-center px-6 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
           @click="openPreview(file)"
        >
          <div class="flex-shrink-0 mr-4 text-blue-500">
            <div v-if="isImage(file)">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5L16 10 4 20"/></svg>
            </div>
            <div v-else-if="isVideo(file)">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
            </div>
            <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <span class="text-blue-600 font-medium block break-words">
              {{ file.fileName }}
            </span>
          </div>
          <div>
            <a class="block border border-gray-200 dark:border-gray-600 rounded-full p-1 text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500" :href="`/api/share/file?reference=${file.reference}&share=${reference}&download=true`" @click.stop="">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
            </a>
          </div>
        </button>
      </div>
    </div>
  </div>

  <sl-dialog
    ref="fileDialog"
    :label="viewFile ? viewFile.fileName : ''"
    style="--width: 100%; --body-spacing: 0; --footer-spacing: 8px 0 16px 0;"
    @sl-after-hide="onDialogAfterHide"
  >
    <div v-if="viewFile" class="relative p-1 lg:p-6 overflow-hidden flex flex-col items-center justify-center dark:bg-gray-800 min-h-6">
      <div v-if="mediaLoading" class="absolute flex flex-col items-center justify-center z-20">
        <div>Loading...</div>
      </div>
      <template v-if="!mediaLoadError">
        <template v-if="isImage(viewFile)">
          <img 
            :src="getFileUrl(viewFile)" 
            class="max-w-full object-contain rounded-sm transition-opacity duration-300" 
            style="max-height: calc(90dvh - 16rem);"
            :class="mediaLoading ? 'opacity-0' : 'opacity-100'" 
            @load="onImageLoad" 
            @error="onImageLoadError"
          >
        </template>
        
        <template v-else-if="isVideo(viewFile)">
          <video 
            ref="video" 
            class="video-js vjs-default-skin h-full w-full max-w-full max-h-full object-contain rounded-sm transition-opacity duration-300"
            style="max-height: calc(90dvh - 16rem);"
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

    <div v-if="viewFile" slot="footer" class="flex justify-center gap-3">
      <a :href="getFileUrl(viewFile, true)"
          class="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2">
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
        Download
      </a>
    </div>
  </sl-dialog>
</template>

<style>
  @media (prefers-color-scheme: dark) {
    sl-dialog {
      --sl-panel-background-color: #1f2937;
    }
  }
</style>
