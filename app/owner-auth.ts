import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";

async function configuredOwnerEmail() {
  const { env } = await import("cloudflare:workers");
  return ((env as unknown as { OWNER_EMAIL?: string }).OWNER_EMAIL ?? "").trim().toLowerCase();
}

export async function ownerPageAccess(returnTo: string) {
  const user = await requireChatGPTUser(returnTo);
  const ownerEmail = await configuredOwnerEmail();
  return { user, configured: Boolean(ownerEmail), authorized: Boolean(ownerEmail) && user.email.toLowerCase() === ownerEmail };
}

export async function ownerApiAccess() {
  const user = await getChatGPTUser();
  if (!user) return { ok: false as const, response: Response.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 }) };
  const ownerEmail = await configuredOwnerEmail();
  if (!ownerEmail || user.email.toLowerCase() !== ownerEmail) return { ok: false as const, response: Response.json({ error: "Bu işlem yalnızca AuraDigital sahibine açıktır." }, { status: 403 }) };
  return { ok: true as const, user };
}
