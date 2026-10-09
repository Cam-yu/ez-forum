<template>
  <div>
    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats?.user_count ?? "-" }}</div>
        <div class="stat-label">用户数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats?.post_count ?? "-" }}</div>
        <div class="stat-label">帖子数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats?.comment_count ?? "-" }}</div>
        <div class="stat-label">评论数</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-value">{{ stats?.pending_count ?? "-" }}</div>
        <div class="stat-label">待审核</div>
      </div>
    </div>

    <!-- 待审核快捷处理 -->
    <div class="card-block">
      <div class="panel-head">
        <h3 class="panel-title">待审核帖子</h3>
        <el-button text type="primary" @click="router.push('/admin/posts')">
          查看全部<el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <el-empty v-if="pendingPosts.length === 0" description="没有待审核的帖子" :image-size="60" />
      <div v-for="post in pendingPosts" :key="post.id" class="pending-item">
        <div class="pending-info">
          <router-link class="pending-title" :to="`/post/${post.id}`">{{ post.title }}</router-link>
          <span class="pending-meta">{{ post.nickname }} · {{ timeAgo(post.create_at) }}</span>
        </div>
        <div class="pending-actions">
          <el-button type="primary" size="small" @click="review(post.id, 'approved')">通过</el-button>
          <el-button size="small" type="danger" plain @click="review(post.id, 'rejected')">驳回</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { adminApi } from "@/api/admin";
import type { AdminPost, AdminStats } from "@/api/types";
import { timeAgo } from "@/utils/format";

const router = useRouter();
const stats = ref<AdminStats | null>(null);
const pendingPosts = ref<AdminPost[]>([]);

const load = async () => {
  try {
    const [statsResult, pendingResult] = await Promise.all([
      adminApi.stats(),
      adminApi.posts({ page: 1, pageSize: 5, status: "pending" }),
    ]);
    stats.value = statsResult.data;
    pendingPosts.value = pendingResult.data;
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

const review = async (id: number, status: "approved" | "rejected") => {
  try {
    await adminApi.reviewPost(id, status);
    ElMessage.success(status === "approved" ? "已通过审核" : "已驳回");
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

onMounted(load);
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--forum-card);
  border: 1px solid var(--forum-border);
  border-radius: var(--forum-radius);
  padding: 20px;
  text-align: center;
}

.stat-card.highlight .stat-value {
  color: var(--el-color-warning);
}

.stat-value {
  font-size: 30px;
  font-weight: 700;
}

.stat-label {
  color: var(--forum-text-3);
  font-size: 13px;
  margin-top: 4px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
}

.pending-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--forum-border);
}

.pending-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pending-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-meta {
  color: var(--forum-text-3);
  font-size: 12px;
}

.pending-actions {
  flex-shrink: 0;
}

@media (max-width: 860px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
