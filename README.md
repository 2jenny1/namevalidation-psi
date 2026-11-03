# Name Validation PSI

Shopify app that asks logged-in customers missing a first name to verify:

- First / last name → Customer fields
- Date of birth → customer metafield `$app.date_of_birth`
- Province → customer metafield `$app.province` (or from cookie/cart attribute `location`)

## Important: Non-Plus vs Plus

Checkout UI extensions on the **information / shipping / payment** steps require **Shopify Plus**.

| Plan | What to use |
| --- | --- |
| **Non-Plus** | Theme app embed `Name validation gate` (auto popup, can read `location` cookie) |
| **Plus** | Checkout UI extension block + optional theme cookie→cart bridge |

Checkout UI extensions cannot read storefront cookies. The theme embed copies `location` into a cart attribute so the Plus checkout block can reuse it.

## Quick start

```bash
npm install
npm run dev
```

Then:

1. Install the app on a development store.
2. **Non-Plus:** Theme editor → App embeds → enable **Name validation gate**.
3. **Plus:** Checkout editor → add **Name Validation** → set **App backend URL** to the URL printed by `shopify app dev`.
4. In Partner Dashboard, request **Protected customer data** (level 2) for customer name fields.
5. For a published Plus checkout extension, approve **network access**.

## Cookie format

```
location=Alberta
```

If present, province is prefilled and the dropdown is locked. If missing, the buyer selects a province and it is saved to the metafield (and written back to the cart attribute).
