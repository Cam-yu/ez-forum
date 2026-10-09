<template>
  <div class="comment-block card-block">
    <h3 class="section-title">评论 ({{ comments.length }})</h3>

    <!-- 输入框 -->
    <template v-if="store.isSignedIn">
      <div class="comment-editor">
        <el-input
          v-model="draft"
          type="textarea"
          :rows="3"
          maxlength="1000"
          show-word-limit
          :placeholder="replyTo ? `回复 @${replyTo.nickname}：` : '友善评论，理性讨论…'"
        />
        <div class="editor-actions">
          <el-button v-if="replyTo" text size="small" @click="cancelReply">取消回复</el-button>
          <el-button type="primary" :loading="submitting" @click="submit">发布</el-button>
        </div>
      </div>
    </template>
    <el-alert v-else class="login-tip" type="info" :closable="false" show-icon>
      <template #title>
        <router-link class="login-link" :to="{ name: 'login', query: { redirect: route.fullPath } }">登录</router-link>
        后参与评论
      </template>
    </el-alert>

    <!-- 两级评论列表 -->
    <div v-if="roots.length === 0" class="empty-tip">还没有评论，来抢沙发～</div>
    <div v-for="root in roots" :key="root.id" class="comment-item">
      <div class="comment-head">
        <avatar :name="root.nickname" :size="32" />
        <span class="comment-nickname">{{ root.nickname }}</span>
        <span class="comment-time">{{ timeAgo(root.create_at) }}</span>
      </div>
      <p class="comment-content pre-text">{{ root.content }}</p>
      <div class="comment-actions">
        <el-button v-if="store.isSignedIn" text size="small" @click="startReply(root)">回复</el-button>
        <el-button v-if="root.can_delete" text size="small" type="danger" @click="remove(root)">删除</el-button>
      </div>

      <div v-if="childrenOf(root.id).length" class="replies">
        <div v-for="reply in childrenOf(root.id)" :key="reply.id" class="reply-item">
          <div class="comment-head">
            <avatar :name="reply.nickname" :size="26" />
            <span class="comment-nickname">{{ reply.nickname }}</span>
            <span class="comment-time">{{ timeAgo(reply.create_at) }}</span>
          </div>
          <p class="comment-content pre-text">{{ reply.content }}</p>
          <div class="comment-actions">
            <el-button v-if="store.isSignedIn" text size="small" @click="startReply(root, reply)">回复</el-button>
            <el-button v-if="reply.can_delete" text size="small" type="danger" @click="remove(reply)">删除</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { commentApi } from "@/api/comment";
import type { CommentItem } from "@/api/types";
import { useUserStore } from "@/stores/user";
import Avatar from "./Avatar.vue";
import { timeAgo } from "@/utils/format";

const props = defineProps<{ postId: number; comments: CommentItem[] }>();
const emit = defineEmits<{ refresh: [] }>();

const store = useUserStore();
const route = useRoute();

const draft = ref("");
const replyTo = ref<CommentItem | null>(null);
const replyParent = ref<CommentItem | null>(null);
const submitting = ref(false);

// 一级评论与其回复
const roots = computed(() => props.comments.filter((c) => c.parent_id === null));
const childrenOf = (rootId: number) => props.comments.filter((c) => c.parent_id === rootId);

const startReply = (root: CommentItem, target?: CommentItem) => {
  replyParent.value = root;
  replyTo.value = target ?? root;
};

const cancelReply = () => {
  replyTo.value = null;
  replyParent.value = null;
};

const submit = async () => {
  const content = draft.value.trim();
  if (!content) {
    ElMessage.warning("评论内容不能为空");
    return;
  }
  submitting.value = true;
  try {
    await commentApi.create(props.postId, {
      content,
      ...(replyParent.value ? { parent_id: replyParent.value.id } : {}),
    });
    ElMessage.success(replyParent.value ? "回复成功" : "评论成功");
    draft.value = "";
    cancelReply();
    emit("refresh");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    submitting.value = false;
  }
};

const remove = async (comment: CommentItem) => {
  await ElMessageBox.confirm("确定删除这条评论吗？", "删除确认", { type: "warning" });
  try {
    await commentApi.remove(comment.id);
    ElMessage.success("已删除");
    emit("refresh");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};
</script>

<style scoped>
.section-title {
  margin: 0 0 16px;
  font-size: 16px;
}

.comment-editor {
  margin-bottom: 20px;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.login-tip {
  margin-bottom: 20px;
}

.login-link {
  color: var(--el-color-primary-dark-2);
  font-weight: 600;
}

.empty-tip {
  text-align: center;
  color: var(--forum-text-3);
  padding: 24px 0;
  font-size: 14px;
}

.comment-item {
  padding: 18px 0;
  border-top: 1px solid var(--forum-border);
}

.comment-item:first-of-type {
  border-top: none;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-nickname {
  font-weight: 600;
  font-size: 14px;
}

.comment-time {
  color: var(--forum-text-3);
  font-size: 12px;
}

.comment-content {
  margin: 0 0 8px;
  font-size: 15px;
}

.comment-actions {
  display: flex;
  gap: 4px;
}

.replies {
  margin-left: 44px;
  background: var(--forum-hover);
  border-radius: 2px;
  padding: 6px 18px;
}

.reply-item {
  padding: 12px 0;
  border-top: 1px dashed var(--forum-border);
}

.reply-item:first-child {
  border-top: none;
}
</style>
