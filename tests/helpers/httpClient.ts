// Cookie-jar aware HTTP client for API-level integration tests.
//
// The IOKEEP API is cookie-authenticated: `POST /auth/login` sets two HttpOnly
// cookies (`access_token` + `refresh_token`). The route guard
// (`checkAccessToken`) reads both cookies straight off the request, so an
// integration client has to capture every Set-Cookie the server sends and
// replay them on subsequent requests — i.e. behave like a browser cookie jar.
//
// Node's `fetch` (undici) exposes the multiple Set-Cookie headers via
// `Headers#getSetCookie()`, which we parse here.

export type JsonBody = Record<string, unknown>;

export interface RequestOptions {
  body?: JsonBody;
  headers?: Record<string, string>;
  /** Set to false to omit the cookie jar for this request. */
  cookies?: boolean;
}

export class HttpClient {
  private readonly cookies = new Map<string, string>();

  constructor(private readonly baseUrl: string) {}

  /** Read the current value of a captured cookie (e.g. the refresh token). */
  getCookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  private absorbSetCookies(res: Response): void {
    for (const raw of res.headers.getSetCookie()) {
      const first = raw.split(";")[0];
      const eq = first.indexOf("=");
      if (eq === -1) continue;

      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();

      if (value === "") {
        // Express `clearCookie` emits an empty value with a past Expires.
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  private cookieHeader(): string {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  async request(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const headers: Record<string, string> = { ...(options.headers ?? {}) };

    if (options.cookies !== false && this.cookies.size > 0) {
      headers["Cookie"] = this.cookieHeader();
    }

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    this.absorbSetCookies(res);
    return res;
  }

  get(path: string, options?: RequestOptions): Promise<Response> {
    return this.request("GET", path, options);
  }

  post(path: string, body?: JsonBody, options?: RequestOptions): Promise<Response> {
    return this.request("POST", path, { ...options, body });
  }

  patch(path: string, body?: JsonBody, options?: RequestOptions): Promise<Response> {
    return this.request("PATCH", path, { ...options, body });
  }

  del(path: string, options?: RequestOptions): Promise<Response> {
    return this.request("DELETE", path, options);
  }
}
