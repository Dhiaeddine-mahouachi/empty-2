import type { ProjectRecord } from "./project";

const API_BASE = "https://auradigital.ink/api/quicksite";

async function readProject(path: string) {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("QuickSite request service is unavailable.");
  const payload = await response.json() as { project?: ProjectRecord };
  return payload.project ?? null;
}

export async function getProjectById(id: string) {
  return readProject(`/projects/${encodeURIComponent(id)}`);
}

export async function getProjectBySlug(slug: string) {
  return readProject(`/sites/${encodeURIComponent(slug)}`);
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return [];
}
