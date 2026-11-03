import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate, unauthenticated } from "../shopify.server";
import {
  saveCustomerVerification,
  validateVerifyInput,
} from "../services/verify-customer.server";

// Respond to CORS preflight from checkout UI extensions
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.checkout(request);
  return new Response(null, { status: 204 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);

  const shop = sessionToken.dest;
  const sub = sessionToken.sub;

  if (!sub) {
    return cors(
      Response.json(
        { error: "Customer must be logged in to verify information." },
        { status: 401 },
      ),
    );
  }

  const customerId = sub.startsWith("gid://")
    ? sub
    : `gid://shopify/Customer/${sub}`;

  const body = await request.json().catch(() => ({}));
  const validated = validateVerifyInput(body);
  if ("error" in validated) {
    return cors(Response.json({ error: validated.error }, { status: 400 }));
  }

  const { admin } = await unauthenticated.admin(shop);
  const result = await saveCustomerVerification(admin, {
    customerId,
    ...validated,
  });

  if (!result.ok) {
    return cors(Response.json({ error: result.error }, { status: 422 }));
  }

  return cors(Response.json({ ok: true }));
};
