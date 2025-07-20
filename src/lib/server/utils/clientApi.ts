import ky, { type Options } from "ky";
import { env } from "$env/dynamic/private";

const clientApiBaseUrl = env.clientAPIOrigin as
  | "https://client-api.supportmail.dev/dashboard"
  | "http://localhost:3000/dashboard";

interface RequestOptions extends Partial<Options> {
  baseURL?: string;
}

class ClientApiClient {
  private client: typeof ky;

  constructor(options: RequestOptions = {}) {
    this.client = ky.create({
      prefixUrl: clientApiBaseUrl,
      timeout: 5000,
      retry: 2,
      throwHttpErrors: false,
      headers: {
        Authorization: `Bearer ${env.clientAPIToken}`,
      },
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

export { ClientApiClient, clientApiBaseUrl };
export default new ClientApiClient();
