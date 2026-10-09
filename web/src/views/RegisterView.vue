<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">🦊 Elysia 论坛</div>
      <h2 class="auth-title">创建账号</h2>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @keyup.enter="submit">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="2-20 个字符" :prefix-icon="Postcard" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="5-20 位字母、数字或下划线" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="至少 8 位" :prefix-icon="Lock" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input v-model="form.confirm" type="password" show-password placeholder="再输入一次密码" :prefix-icon="Lock" />
        </el-form-item>
        <el-button class="auth-submit" type="primary" size="large" :loading="loading" @click="submit">
 注 册
        </el-button>
      </el-form>

      <div class="auth-foot">
        已有账号？
        <router-link class="auth-link" :to="{ name: 'login', query: route.query }">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { User, Lock, Postcard } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { userApi } from "@/api/user";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const store = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ nickname: "", username: "", password: "", confirm: "" });

const rules: FormRules = {
  nickname: [
    { required: true, message: "请输入昵称", trigger: "blur" },
    { min: 2, max: 20, message: "昵称需 2-20 个字符", trigger: "blur" },
  ],
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9_]{5,20}$/, message: "用户名需 5-20 位字母、数字或下划线", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 8, max: 72, message: "密码需 8-72 位", trigger: "blur" },
  ],
  confirm: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    {
      validator: (_rule, value: string, callback) =>
        value === form.password ? callback() : callback(new Error("两次输入的密码不一致")),
      trigger: "blur",
    },
  ],
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await userApi.register({
      nickname: form.nickname,
      username: form.username,
      password: form.password,
    });
    ElMessage.success("注册成功，已自动登录");
    await store.login(form.username, form.password);
    await router.push(String(route.query.redirect ?? "/"));
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--forum-card);
  border-radius: 6px;
  border: 1px solid var(--forum-border);
  padding: 36px 32px 28px;
  box-shadow: 0 8px 30px rgba(31, 35, 41, 0.06);
}

.auth-brand {
  text-align: center;
  font-size: 15px;
  color: var(--forum-text-3);
  margin-bottom: 6px;
}

.auth-title {
  text-align: center;
  margin: 0 0 24px;
  font-size: 24px;
}

.auth-submit {
  width: 100%;
  margin-top: 4px;
}

.auth-foot {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  color: var(--forum-text-3);
}

.auth-link {
  color: var(--el-color-primary-dark-2);
  font-weight: 600;
}
</style>
