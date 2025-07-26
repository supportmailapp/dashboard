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

  async get<T>(url: string, options?: RequestOptions) {
    return this.client.get<T>(this.removeleadingSlash(url.trim()), options);
  }

  async post<T>(url: string, options?: RequestOptions) {
    return this.client.post<T>(this.removeleadingSlash(url.trim()), { ...options });
  }

  async put<T>(url: string, options?: RequestOptions) {
    return this.client.put<T>(this.removeleadingSlash(url.trim()), { ...options });
  }

  async delete<T>(url: string, options?: RequestOptions) {
    return this.client.delete<T>(this.removeleadingSlash(url.trim()), options);
  }

  async patch<T>(url: string, options?: RequestOptions) {
    return this.client.patch<T>(this.removeleadingSlash(url.trim()), { ...options });
  }
}

export { ApiClient };
export default new ApiClient();
