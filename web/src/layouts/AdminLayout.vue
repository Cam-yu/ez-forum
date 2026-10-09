<template>
  <div class="page-container">
    <div class="admin-header">
      <h2>管理后台</h2>
      <el-button text @click="router.push('/')">
        <el-icon><Back /></el-icon>&nbsp;返回论坛
      </el-button>
    </div>
    <div class="admin-body">
      <aside class="admin-side">
        <router-link to="/admin" class="admin-link" exact-active-class="active">
          <el-icon><Odometer /></el-icon> 概览
        </router-link>
        <router-link to="/admin/posts" class="admin-link" active-class="active">
          <el-icon><Document /></el-icon> 帖子管理
        </router-link>
        <router-link to="/admin/comments" class="admin-link" active-class="active">
          <el-icon><ChatDotRound /></el-icon> 评论管理
        </router-link>
        <router-link to="/admin/users" class="admin-link" active-class="active">
          <el-icon><User /></el-icon> 用户管理
        </router-link>
        <router-link to="/admin/categories" class="admin-link" active-class="active">
          <el-icon><Collection /></el-icon> 板块管理
        </router-link>
      </aside>
      <main class="admin-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<style scoped>
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.admin-header h2 {
  margin: 0;
  font-size: 22px;
}

.admin-body {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.admin-side {
  width: 160px;
  flex-shrink: 0;
  background: var(--forum-card);
  border-radius: var(--forum-radius);
  border: 1px solid var(--forum-border);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 2px;
  color: var(--forum-text-2);
  font-size: 14px;
}

.admin-link:hover {
  background: var(--forum-hover);
}

.admin-link.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.admin-main {
  flex: 1;
  min-width: 0;
}
</style>
