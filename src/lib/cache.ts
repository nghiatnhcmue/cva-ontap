/**
 * Hệ thống Caching Trong Bộ Nhớ (Server-Side In-Memory Cache)
 * Tối ưu hóa phản hồi cho 200 - 300 CCU đồng thời, tránh nghẽn I/O Database.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class ServerMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Lấy dữ liệu từ cache nếu còn hạn
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Lưu dữ liệu vào cache với thời gian sống TTL (mặc định 60 giây)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Xóa một hoặc nhiều key theo tiền tố (prefix)
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Helper: Trả về cache nếu có, nếu chưa thì gọi fetcher rồi lưu vào cache
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T> | T): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

// Khởi tạo Singleton Cache
export const serverCache = new ServerMemoryCache();

