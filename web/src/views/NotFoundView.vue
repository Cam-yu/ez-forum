<template>
  <div class="page-container nf-page">
    <div class="nf-code">404</div>
    <p class="nf-text">页面走丢了…</p>
    <el-button type="primary" @click="router.push('/')">回到首页</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<style scoped>
.nf-page {
  text-align: center;
  padding-top: 100px;
}

.nf-code {
  font-size: 96px;
  font-weight: 800;
  color: var(--el-color-primary);
  line-height: 1;
}

.nf-text {
  color: var(--forum-text-3);
  margin: 16px 0 28px;
}
</style>
