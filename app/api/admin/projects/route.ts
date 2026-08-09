import { ownerApiAccess } from "../../../owner-auth";
import { listProjects } from "../../../../lib/projects-db";

export async function GET() {
  const access = await ownerApiAccess();
  if (!access.ok) return access.response;
  return Response.json({ projects: await listProjects() });
}
