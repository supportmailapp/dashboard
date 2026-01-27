import ky, { type Options } from "ky";
import { env } from "$env/dynamic/private";

interface RequestOptions extends Partial<Options> {
  baseURL?: string;
}

/**
 * Client for the internal Client API.
 */
class ClientApiClient {
  private client: typeof ky;

  constructor(options: RequestOptions = {}) {
    this.client = ky.create({
      prefixUrl: "http://localhost:3000/dash", // when hosted on the same server, we can just use localhost
      timeout: 5000,
      retry: 2,
      throwHttpErrors: false,
      headers: {
        Authorization: `Bearer ${env.CLIENT_API_TOKEN}`,
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

export const ClientApiRoutes = {
  ticketSetup: () => `ticket-setup` as const,
  /**
   * Used to update the forum tags for categories.
   */
  syncTags: () => `categories` as const,
};

export { ClientApiClient };
export default new ClientApiClient();
