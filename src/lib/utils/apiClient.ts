import { ORIGIN } from "$lib/constants";
import ky, { type Options } from "ky";

interface RequestOptions extends Partial<Options> {
  baseURL?: string;
}

class ApiClient {
  private client: typeof ky;

  constructor(options: RequestOptions = {}) {
    this.client = ky.create({
      prefixUrl: ORIGIN,
      timeout: 5000,
      retry: 2,
      throwHttpErrors: false,
      ...options,
    });
  }

  private removeleadingSlash(value: string): string {
    if (value[0] === "/") return value.slice(1);
    return value;
  }

  async get<T = any>(url: string, options?: RequestOptions) {
    return this.client.get<T>(this.removeleadingSlash(url.trim()), options);
  }

  async post<T = any>(url: string, options?: RequestOptions) {
    return this.client.post<T>(this.removeleadingSlash(url.trim()), { ...options });
  }

  async put<T = any>(url: string, options?: RequestOptions) {
    return this.client.put<T>(this.removeleadingSlash(url.trim()), { ...options });
  }

  async delete<T = any>(url: string, options?: RequestOptions) {
    return this.client.delete<T>(this.removeleadingSlash(url.trim()), options).json();
  }

  async patch<T = any>(url: string, options?: RequestOptions) {
    return this.client.patch(this.removeleadingSlash(url.trim()), { ...options }).json<T>();
  }
}

export { ApiClient };
export default new ApiClient();
