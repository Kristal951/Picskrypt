export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const USERNAME_RE = /^[a-z0-9][a-z0-9_]*$/;
const PLACEHOLDER_RE = /^user_[0-9a-f]{8}$/;

const RESERVED = new Set([
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "about",
  "create",
  "delete",
  "edit",
  "explore",
  "help",
  "login",
  "logout",
  "me",
  "null",
  "onboarding",
  "picskrypt",
  "pictures",
  "privacy",
  "profile",
  "root",
  "search",
  "settings",
  "signin",
  "signup",
  "support",
  "terms",
  "undefined",
  "upload",
  "user",
  "users",
  "www",
]);

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/^@/, "");
}

export function validateUsername(input: string): {
  username: string;
  error: string | null;
} {
  const username = normalizeUsername(input);

  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return {
      username,
      error: `Use ${USERNAME_MIN} to ${USERNAME_MAX} characters.`,
    };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      username,
      error:
        "Use lowercase letters, numbers and underscores. Start with a letter or number.",
    };
  }
  if (RESERVED.has(username) || PLACEHOLDER_RE.test(username)) {
    return { username, error: "That username isn't available." };
  }
  return { username, error: null };
}

export function isPlaceholderUsername(u?: string | null): boolean {
  return !!u && PLACEHOLDER_RE.test(u);
}

export function suggestUsername(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, USERNAME_MAX);
}
