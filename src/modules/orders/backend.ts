export async function springOrders(
  request: Request,
  path: string,
  body?: unknown,
) {
  const base = process.env.ORDER_SERVICE_URL;
  if (!base) return null;
  try {
    const method = request.method === "POST" ? "POST" : "GET";
    const upstream = await fetch(new URL("/v1/orders" + path, base), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") ?? "",
      },
      body: method === "POST" ? JSON.stringify(body) : undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    return Response.json(
      await upstream
        .json()
        .catch(() => ({ error: "Order service unavailable." })),
      {
        status: upstream.status,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch {
    return Response.json(
      { error: "Order service unavailable. Refresh and retry." },
      { status: 503 },
    );
  }
}
