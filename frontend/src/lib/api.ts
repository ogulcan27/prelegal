/** JSON calls to the backend; the session cookie goes along automatically (same origin). */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Sends `body` as JSON (POST when given, else GET); returns the parsed reply. Throws ApiError on a non-2xx status.
 * A 401 outside /api/auth/ means the session has ended, so the browser also goes to the sign-in page.
 */
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // A full page load on purpose: it drops all state of the ended session. Not a component, so no router here.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (response.status === 401 && !path.startsWith("/api/auth/")) window.location.assign("/");
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
  return response.status === 204 ? (undefined as T) : response.json();
}

/** FastAPI puts a text `detail` on errors raised by the app, and a list of problems on validation errors. */
async function errorMessage(response: Response): Promise<string> {
  const detail = await response.json().then((data) => data?.detail, () => undefined);
  return typeof detail === "string" ? detail : `Request failed (${response.status})`;
}
