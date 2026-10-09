<template>
  <div class="page-container" v-if="store.user">
    <div class="settings-grid">
      <div class="card-block">
        <h3 class="section-title">账号资料</h3>
        <el-form :model="form" label-position="top" size="large">
          <el-form-item label="昵称">
            <el-input v-model="form.nickname" maxlength="20" show-word-limit />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
        </el-form>
      </div>

      <div class="card-block">
        <h3 class="section-title">会话</h3>
        <p class="hint">退出后需要重新登录才能发帖和评论。</p>
        <el-button @click="store.logout()">退出登录</el-button>
      </div>

      <div class="card-block danger-block">
        <h3 class="section-title danger">危险操作</h3>
        <p class="hint">注销账号后，你发布的帖子和评论将被一并删除，且无法恢复。</p>
        <el-button type="danger" plain @click="removeAccount">注销账号</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import { userApi } from "@/api/user";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const store = useUserStore();

const form = reactive({ nickname: "", username: "" });
const saving = ref(false);

onMounted(() => {
  form.nickname = store.user?.nickname ?? "";
  form.username = store.user?.username ?? "";
});

const save = async () => {
  saving.value = true;
  try {
    await userApi.update(store.user!.id, {
      nickname: form.nickname,
      username: form.username,
    });
    // 重新拉取，保证导航栏昵称同步
    await store.restore();
    ElMessage.success("资料已更新");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    saving.value = false;
  }
};

const removeAccount = async () => {
  await ElMessageBox.confirm(
    "注销后你的帖子和评论都会被删除，确定要注销账号吗？",
    "注销确认",
    { type: "error", confirmButtonText: "确认注销", confirmButtonClass: "el-button--danger" }
  );
  try {
    await userApi.remove(store.user!.id);
    ElMessage.success("账号已注销");
    store.clear();
    router.push("/");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};
</script>

<style scoped>
.settings-grid {
  max-width: 560px;
  margin: 0 auto;
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
}

.danger {
  color: var(--el-color-danger);
}

.hint {
  color: var(--forum-text-3);
  font-size: 13px;
  margin: 0 0 14px;
}
</style>
