import { z } from "zod";
import { getRequestAuth } from "@/modules/identity/server-auth";
import { springOrders } from "@/modules/orders/backend";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const upstream = await springOrders(request, "");
  if (upstream) return upstream;
  const session = await getRequestAuth(request);
  if (!session.ok) return session.response;
  const { data, error } = await session.auth.client.rpc(
    "my_material_orders",
    {},
  );
  return Response.json(error ? { error: "Could not load orders." } : data, {
    status: error ? 503 : 200,
    headers,
  });
}
export async function POST(request: Request) {
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["Dealer confirmed", "Packed", "Dispatched", "Delivered"]),
      code: z.string().max(8).optional(),
    })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Invalid order update." },
      { status: 422, headers },
    );
  const { id, status, code } = parsed.data;
  const upstream = await springOrders(request, "/" + id + "/status", {
    status,
    code,
  });
  if (upstream) return upstream;
  const session = await getRequestAuth(request);
  if (!session.ok) return session.response;
  const { data, error } = await session.auth.client.rpc(
    "advance_material_order",
    { p_id: id, p_status: status, p_code: code ?? n¶»§q«^