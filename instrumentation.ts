export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const secret = process.env.AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error(
      "AUTH_SECRET is required in production. Set a long random string in your environment (see .env.example).",
    );
  }

  const weakSecrets = new Set([
    "change-me-to-a-long-random-string",
    "changeme",
    "secret",
    "your-secret-here",
  ]);
  if (secret && weakSecrets.has(secret.toLowerCase())) {
    throw new Error(
      "AUTH_SECRET is a known default value. Generate a unique secret (e.g. openssl rand -base64 32).",
    );
  }

  if (secret && secret.length < 32) {
    console.warn(
      "[liobiz] AUTH_SECRET should be at least 32 characters for secure session signing.",
    );
  }
}
