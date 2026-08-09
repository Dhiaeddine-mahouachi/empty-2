const REQUESTS_API = "https://auradigital.ink/api/quicksite/projects";

export async function POST(request: Request) {
  const body = await request.text();
  const response = await fetch(REQUESTS_API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return new Response(response.body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}
