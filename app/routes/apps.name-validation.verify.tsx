import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  saveCustomerVerification,
  validateVerifyInput,
} from "../services/verify-customer.server";

const ACCOUNT_PROFILE_URL =
  "https://shopify.com/60496937017/account/profile";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.appProxy(request);
  return Response.json({ ok: true });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

  if (!loggedInCustomerId) {
    return Response.json(
      { error: "Customer must be logged in." },
      { status: 401 },
    );
  }

  if (!admin || !session) {
    return Response.json(
      { error: "App is not installed on this shop." },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, unknown> = {};
  if (contentType.includes("application/json")) {
    body = await request.json().catch(() => ({}));
  } else {
    const form = await request.formData();
    body = Object.fromEntries(form.entries());
  }

  const validated = validateVerifyInput(body);
  if ("error" in validated) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const customerId = `gid://shopify/Customer/${loggedInCustomerId}`;
  const result = await saveCustomerVerification(admin, {
    customerId,
    ...validated,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 422 });
  }

  // Client redirects to Customer Accounts; app-proxy Location redirects
  // often leave the browser stuck on /apps/name-validation/verify.
  return Response.json({ ok: true, redirectTo: ACCOUNT_PROFILE_URL });
};
