export async function springOrders(
  request: Request,
  path: string,
  body?: unknown,
) {
  const base = process.env.ORDER_SERVICE_URL;
  if (!base) return null;
  try {
    const upstream = await fetch(new URL("/v1/orders" + path, base), {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") ?? "",
      },
      body: body ? JSON.stringify(body) : undefined,
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
