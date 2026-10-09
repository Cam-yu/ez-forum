import { db } from "./db";

/**
 * Prisma 8 契约客户端的原生 SQL 出口。
 * 契约查询构建器只支持等值条件，模糊搜索 / 联表 / 分组统计走这里的原生 SQL。
 * 参数一律使用模板插值（自动参数化），严禁字符串拼接 SQL。
 */
type RawPlan = { build(): unknown };
type RawTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => {
  returnsRow(spec: Record<string, string | { codecId: string; nullable?: boolean }>): RawPlan;
  affectedCount(): RawPlan;
};

type Runtime = {
  query<T>(plan: unknown): Promise<T[]>;
  execute(plan: unknown): Promise<{ affectedRows: number }>;
};

// Prisma 8 RC 尚未导出这些方法的类型，等正式版发布后可移除断言
const rawTag = (db as unknown as { raw: { sql: RawTag } }).raw.sql;
const runtime = () => (db as unknown as { runtime(): Runtime }).runtime();

/** 执行查询并按声明的行类型返回结果 */
export const rawRows = async <T>(plan: unknown): Promise<T[]> => runtime().query(plan);

/** 执行写操作，返回受影响行数 */
export const rawExec = (plan: unknown) => runtime().execute(plan);

export const sql = rawTag;

// 常用列类型声明（原生查询返回行时必须逐列声明 codec）
export const INT = "pg/int4@1";
export const TEXT = "pg/text@1";
export const BOOL = "pg/bool@1";
export const TS = "pg/timestamp-string@1";
