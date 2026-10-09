<template>
  <div class="card-block">
    <el-table v-loading="loading" :data="users" style="width: 100%">
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="用户" min-width="160">
        <template #default="{ row }">
          <div class="user-cell">
            <avatar :name="row.nickname" :size="30" />
            <div>
              <router-link :to="`/user/${row.id}`" class="user-nickname">{{ row.nickname }}</router-link>
              <div class="user-username">@{{ row.username }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="角色" width="150">
        <template #default="{ row }">
          <el-select
            :model-value="row.role"
            size="small"
            :disabled="row.id === store.user?.id"
            @change="(role: string) => changeRole(row as AdminUser, role as 'user' | 'admin')"
          >
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="danger"
            plain
            size="small"
            :disabled="row.id === store.user?.id"
            @click="remove(row as AdminUser)"
          >
            删除
          </el-button>
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
import type { AdminUser } from "@/api/types";
import { useUserStore } from "@/stores/user";
import Avatar from "@/components/Avatar.vue";
import { formatDate } from "@/utils/format";

const store = useUserStore();
const users = ref<AdminUser[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const result = await adminApi.users(page.value, pageSize);
    users.value = result.data;
    total.value = result.total;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
};

const changeRole = async (row: AdminUser, role: "user" | "admin") => {
  try {
    await adminApi.updateUserRole(row.id, role);
    ElMessage.success(`已将 ${row.nickname} 设为${role === "admin" ? "管理员" : "普通用户"}`);
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
    load();
  }
};

const remove = async (row: AdminUser) => {
  await ElMessageBox.confirm(
    `确定删除用户 ${row.nickname}（@${row.username}）吗？其帖子和评论将一并删除。`,
    "删除确认",
    { type: "warning" }
  );
  try {
    await adminApi.removeUser(row.id);
    ElMessage.success("已删除");
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

onMounted(load);
</script>

<style scoped>
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-nickname {
  font-weight: 500;
}

.user-username {
  color: var(--forum-text-3);
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
