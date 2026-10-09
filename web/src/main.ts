import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as Icons from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import App from "./App.vue";
import router from "./router";
import { useUserStore } from "./stores/user";
import { useThemeStore } from "./stores/theme";
import "./styles/main.css";

const app = createApp(App);

for (const [name, component] of Object.entries(Icons)) {
  app.component(name, component);
}

app.use(createPinia());
app.use(router);
app.use(ElementPlus, { locale: zhCn });

// 401 时由 http 层触发，统一清除本地登录态
useUserStore().bindUnauthorized();

// 恢复上次选择的主题（默认深色）
useThemeStore().init();

app.mount("#app");
