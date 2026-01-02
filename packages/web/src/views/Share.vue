<script lang="ts">
  interface ShareData {
    name: string;
    reference: string;
    files: Array<{
      reference: string;
      fileName: string;
    }>;
  }

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
      const { reference } = this.$route.query;
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
        });
      this.loading = false;
    },
  }
</script>

<template>
  <div v-if="loading">
    Loading...
  </div>
  <div v-else-if="!share">
    Share not found
  </div>
  <div v-else>
    <h1>{{ share.name }}</h1>
    <ul>
      <li v-for="file in share.files" :key="file.reference">
        <a :href="`/api/share/file?reference=${file.reference}&share=${reference}`">{{ file.fileName }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
</style>
