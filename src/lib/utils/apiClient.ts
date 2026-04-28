// lib/api/client.ts
import { ORIGIN } from "$lib/constants.js";
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

  private stripLeadingSlash(value: string): string {
    return value.startsWith("/") ? value.slice(1) : value;
  }

  private async handle<T>(res: Awaited<ReturnType<typeof ky>>): Promise<ApiResponse<T>> {
    if (res.ok) {
      const data = res.status !== 204 ? await res.json<T>() : null;
      return { ok: true, data: data as T, status: res.status, raw: res };
    }

    // Attempt to extract a server-side error message from the JSON body,
    // fall back to the HTTP status text when that isn't available.
    let error = res.statusText;
    try {
      const body = await res.json<{ message?: string; error?: string }>();
      error = body.message ?? body.error ?? error;
    } catch {
      // body was not JSON — keep statusText
    }

    return { ok: false, error, status: res.status, raw: res };
  }

  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await this.client.get(this.stripLeadingSlash(url.trim()), options);
    return this.handle<T>(res);
  }

  async post<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await this.client.post(this.stripLeadingSlash(url.trim()), options);
    return this.handle<T>(res);
  }

  async put<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await this.client.put(this.stripLeadingSlash(url.trim()), options);
    return this.handle<T>(res);
  }

  async patch<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await this.client.patch(this.stripLeadingSlash(url.trim()), options);
    return this.handle<T>(res);
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const res = await this.client.delete(this.stripLeadingSlash(url.trim()), options);
    return this.handle<T>(res);
  }
}

export { ApiClient };
export default new ApiClient();
