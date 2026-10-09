/**
 * 单机内存滑动窗口限流。
 * 仅适用于单实例部署；多实例需换用 Redis 等共享存储。
 */
const buckets = new Map<string, number[]>();

/**
 * @returns true 表示放行，false 表示已超过阈值应拒绝
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);

  // 惰性清理，防止 Map 无限膨胀
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.length === 0 || now - v[v.length - 1] >= windowMs) buckets.delete(k);
    }
  }
  return true;
}

type IpSource = {
  server: { requestIP(request: Request): { address: string } | null } | null;
  request: Request;
};

/** 提取客户端 IP；取不到时退化为 "unknown" */
export const requestIp = ({ server, request }: IpSource) =>
  server?.requestIP(request)?.address ?? "unknown";
