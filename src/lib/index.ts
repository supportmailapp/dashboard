import { redirect } from "@sveltejs/kit";

type RedirectStatus = 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308;

export function redirectToLoginWithError({
  status = 302,
  errKey,
  description,
}: {
  errKey?: string;
  description?: string;
  status?: RedirectStatus;
}): never {
  return redirect(
    status,
    "/login?error=" +
      (errKey || "unknown") +
      (description ? `&error_description=${encodeURIComponent(description)}` : ""),
  );
}

export function getNextPathFromGuildPath(pathname: string) {
  const match = pathname.replace(/^\/-\/\d+/, "").match(/^(\/[^/]+)?/);
  if (match) {
    return match[1] || "/";
  }
  return "/";
}
