<template>
  <div class="page-container" v-if="post">
    <div class="detail-grid">
      <main class="detail-main">
        <!-- 帖子正文 -->
        <article class="card-block">
          <!-- 作者可见的审核状态提示 -->
          <el-alert
            v-if="isMine && post.review_status !== 'approved'"
            class="review-tip"
            :type="post.review_status === 'pending' ? 'warning' : 'error'"
            :closable="false"
            show-icon
            :title="post.review_status === 'pending'
              ? '该帖子正在等待管理员审核，审核通过前仅自己可见'
              : '该帖子未通过审核，仅自己可见'"
          />

          <h1 class="detail-title">{{ post.title }}</h1>
          <div class="detail-meta">
            <router-link :to="`/user/${post.user_id}`" class="meta-author">
              <avatar :name="post.nickname" :size="28" />
              <span>{{ post.nickname }}</span>
            </router-link>
            <category-badge v-if="post.category_name" :id="post.category_id" :name="post.category_name" />
            <span>· {{ timeAgo(post.create_at) }}</span>
            <span class="meta-gap"></span>
            <span class="meta-stat"><el-icon><View /></el-icon>{{ formatCount(post.view_count) }}</span>
            <span class="meta-stat"><el-icon><ChatDotRound /></el-icon>{{ formatCount(post.comment_count) }}</span>
          </div>

          <p class="detail-content pre-text">{{ post.context }}</p>

          <!-- 操作区 -->
          <div class="detail-actions">
            <el-button
              :type="post.liked ? 'primary' : 'default'"
              :disabled="!store.isSignedIn"
              @click="toggleLike"
            >
              <el-icon><Star /></el-icon>&nbsp;{{ post.liked ? "已点赞" : "点赞" }} {{ formatCount(post.like_count) }}
            </el-button>

            <template v-if="isMine">
              <el-button @click="router.push(`/post/${post.id}/edit`)">
                <el-icon><EditPen /></el-icon>&nbsp;编辑
              </el-button>
              <el-button type="danger" plain @click="removePost">删除</el-button>
            </template>
          </div>
          <div v-if="!store.isSignedIn" class="like-tip">登录后即可点赞</div>
        </article>

        <comment-tree :post-id="post.id" :comments="comments" @refresh="loadComments" />
      </main>
    </div>
  </div>

  <div v-else class="page-container">
    <el-skeleton class="card-block" :rows="8" animated />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { postApi } from "@/api/post";
import { commentApi } from "@/api/comment";
import type { CommentItem, PostDetail } from "@/api/types";
import { useUserStore } from "@/stores/user";
import Avatar from "@/components/Avatar.vue";
import CategoryBadge from "@/components/CategoryBadge.vue";
import CommentTree from "@/components/CommentTree.vue";
import { formatCount, timeAgo } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const store = useUserStore();

const post = ref<PostDetail | null>(null);
const comments = ref<CommentItem[]>([]);
const likeBusy = ref(false);

const postId = computed(() => Number(route.params.id));
const isMine = computed(() => store.user?.id === post.value?.user_id);

const load = async () => {
  try {
    post.value = (await postApi.detail(postId.value)).data;
  } catch (e) {
    ElMessage.error((e as Error).message);
    router.replace("/");
  }
};

const loadComments = async () => {
  try {
    comments.value = (await commentApi.listByPost(postId.value)).data.comments;
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

const toggleLike = async () => {
  if (!post.value || likeBusy.value) return;
  likeBusy.value = true;
  try {
    const { data } = await postApi.like(post.value.id);
    post.value.liked = data.liked;
    post.value.like_count = data.like_count;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    likeBusy.value = false;
  }
};

const removePost = async () => {
  await ElMessageBox.confirm("删除后无法恢复，确定删除该帖子吗？", "删除确认", { type: "warning" });
  try {
    await postApi.remove(postId.value);
    ElMessage.success("帖子已删除");
    router.push("/");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

watch(postId, () => {
  if (route.name === "post-detail") {
    load();
    loadComments();
  }
});

onMounted(() => {
  load();
  loadComments();
});
</script>

<style scoped>
.detail-grid {
  max-width: 1560px;
  margin: 0 auto;
}

.review-tip {
  margin-bottom: 18px;
}

.detail-title {
  margin: 4px 0 18px;
  font-size: 28px;
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--forum-text-3);
  font-size: 13px;
  flex-wrap: wrap;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--forum-border);
}

.meta-author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--forum-text-2);
  font-weight: 500;
}

.meta-author:hover {
  color: var(--el-color-primary);
}

.meta-gap {
  flex: 1;
}

.meta-stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.detail-content {
  margin: 26px 0;
  font-size: 16px;
  line-height: 1.8;
  min-height: 60px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.like-tip {
  margin-top: 12px;
  color: var(--forum-text-3);
  font-size: 12px;
}
</style>
