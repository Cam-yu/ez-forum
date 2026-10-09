<template>
  <article class="topic-row" @click="router.push(`/post/${post.id}`)">
    <avatar class="topic-avatar" :name="post.nickname" :size="46" />

    <div class="topic-main">
      <h3 class="topic-title link-title">{{ post.title }}</h3>
      <div class="topic-sub">
        <category-badge v-if="post.category_name" :id="post.category_id" :name="post.category_name" />
        <span class="topic-author">{{ post.nickname }}</span>
        <span v-if="excerpt" class="topic-excerpt">{{ excerpt }}</span>
      </div>
    </div>

    <div class="topic-stats">
      <div class="stat-col" :class="{ hot: post.comment_count > 0 }" title="回复">
        <span class="stat-num">{{ formatCount(post.comment_count) }}</span>
      </div>
      <div class="stat-col" title="浏览量">
        <span class="stat-num">{{ formatCount(post.view_count) }}</span>
      </div>
      <div class="stat-col" :title="post.create_at">
        <span class="stat-time">{{ timeAgo(post.create_at) }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { PostSummary } from "@/api/types";
import { formatCount, timeAgo } from "@/utils/format";
import Avatar from "./Avatar.vue";
import CategoryBadge from "./CategoryBadge.vue";

const props = defineProps<{ post: PostSummary }>();
const router = useRouter();

const excerpt = computed(() => (props.post.excerpt ?? "").replaceAll("\n", " ").trim());
</script>

<style scoped>
.topic-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--forum-border);
  cursor: pointer;
  transition: background 0.12s;
}

.topic-row:last-child {
  border-bottom: none;
}

.topic-row:hover {
  background: var(--forum-hover);
}

.topic-avatar {
  flex-shrink: 0;
}

.topic-main {
  flex: 1;
  min-width: 0;
}

.topic-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-sub {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.topic-author {
  color: var(--forum-text-2);
  font-size: 13px;
  flex-shrink: 0;
}

.topic-excerpt {
  color: var(--forum-text-3);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.stat-col {
  width: 84px;
  text-align: center;
}

.stat-num {
  font-size: 16px;
  font-weight: 600;
  color: var(--forum-text-2);
}

.stat-col.hot .stat-num {
  color: var(--el-color-primary);
  font-weight: 700;
}

.stat-time {
  font-size: 13px;
  color: var(--forum-text-3);
}

@media (max-width: 720px) {
  .topic-excerpt {
    display: none;
  }
  .stat-col:nth-child(2) {
    display: none;
  }
}
</style>
