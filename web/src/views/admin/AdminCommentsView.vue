<template>
  <div class="card-block">
    <el-table v-loading="loading" :data="comments" style="width: 100%">
      <el-table-column label="评论内容" min-width="240">
        <template #default="{ row }">
          <span class="comment-text">{{ row.content }}</span>
        </template>
      </el-table-column>
      <el-table-column label="评论者" width="110">
        <template #default="{ row }">
          <router-link :to="`/user/${row.user_id}`">{{ row.nickname }}</router-link>
        </template>
      </el-table-column>
      <el-table-column label="所属帖子" min-width="180">
        <template #default="{ row }">
          <router-link class="post-link" :to="`/post/${row.post_id}`">{{ row.post_title }}</router-link>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="140">
        <template #default="{ row }">{{ timeAgo(row.create_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" plain size="small" @click="remove(row as AdminComment)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        hide-on-single-page
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { adminApi } from "@/api/admin";
import type { AdminComment } from "@/api/types";
import { timeAgo } from "@/utils/format";

const comments = ref<AdminComment[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const result = await adminApi.comments(page.value, pageSize);
    comments.value = result.data;
    total.value = result.total;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
};

const remove = async (row: AdminComment) => {
  await ElMessageBox.confirm("确定删除该评论吗？其下回复会一并删除。", "删除确认", { type: "warning" });
  try {
    await adminApi.removeComment(row.id);
    ElMessage.success("已删除");
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

onMounted(load);
</script>

<style scoped>
.comment-text {
  display: block;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-link {
  color: var(--forum-text-2);
}

.post-link:hover {
  color: var(--el-color-primary-dark-2);
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
