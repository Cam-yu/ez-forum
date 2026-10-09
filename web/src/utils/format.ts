/** 后端时间字符串（UTC）转 Date；兼容 "2026-10-09 12:00:00.xxx+00" 等格式 */
const parseDbTime = (value: string): Date => {
  let text = value.trim().replace(" ", "T");
  // 去掉数据库附带的 +00 形式时区，统一按 UTC 解析
  text = text.replace(/[+]\d{2}$/, "").replace(/[+]\d{2}:\d{2}$/, "");
  if (!/(Z|[+]\d{2}:\d{2})$/.test(text)) text += "Z";
  return new Date(text);
};

/** 相对时间：刚刚 / N分钟前 / N小时前 / N天前 / 日期 */
export const timeAgo = (value: string): string => {
  const date = parseDbTime(value);
  if (Number.isNaN(date.getTime())) return value;

  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  return formatDate(value);
};

/** 本地日期时间 YYYY-MM-DD HH:mm */
export const formatDate = (value: string): string => {
  const date = parseDbTime(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** 数字缩写：1.2万 */
export const formatCount = (n: number): string =>
  n >= 10_000 ? `${(n / 10_000).toFixed(1)}万` : String(n);

/** 由昵称生成稳定的头像底色 */
export const avatarColor = (name: string): string => {
  const palette = ["#1f7bf6", "#ff7043", "#7e57c2", "#26a69a", "#66bb6a", "#ec407a", "#ffa726", "#5c6bc0"];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return palette[Math.abs(hash) % palette.length];
};

// 板块徽章色板（Discourse 彩色圆点风格）
const CATEGORY_PALETTE = [
  "#f77b1c", "#2f54eb", "#52c41a", "#eb2f96",
  "#13c2c2", "#faad14", "#722ed1", "#1677ff",
  "#fa541c", "#237804",
];

/** 由板块 ID 生成稳定的徽章颜色 */
export const categoryColor = (id: number | null | undefined): string => {
  if (!id) return "#8a8d91";
  return CATEGORY_PALETTE[Math.abs(id) % CATEGORY_PALETTE.length];
};
