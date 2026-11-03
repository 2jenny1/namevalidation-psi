import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <s-page heading="Name Validation PSI">
      <s-section heading="Setup">
        <s-paragraph>
          Collect first name, last name, date of birth, and province for logged-in
          customers who are missing a first name. Names are saved on the Customer
          record; DOB and province are saved as app-owned customer metafields.
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            Run <code>shopify app deploy</code> after code changes. Installing the
            app alone does not publish extensions until a version is released.
          </s-list-item>
          <s-list-item>
            Create storefront page <code>/pages/profile</code>, then Themes →
            Customize that page → Add block → Apps →{" "}
            <em>Verify profile popup</em>.
          </s-list-item>
          <s-list-item>
            Customer accounts → Customize → Profile → add{" "}
            <em>Name Validation Profile</em>. If first name is missing, it
            redirects to <code>/pages/profile</code> (with a Continue fallback).
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section heading="Data saved">
        <s-unordered-list>
          <s-list-item>
            Customer <code>firstName</code> / <code>lastName</code>
          </s-list-item>
          <s-list-item>
            Metafield <code>$app.date_of_birth</code> (date)
          </s-list-item>
          <s-list-item>
            Metafield <code>$app.province</code> (single line text)
          </s-list-item>
          <s-list-item>
            Province prefers cookie/cart attribute <code>location</code> (example:{" "}
            <code>Alberta</code>); otherwise the buyer selects it in the form.
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
