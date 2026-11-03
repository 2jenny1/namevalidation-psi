const PROVINCES = new Set([
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
]);

export type VerifyCustomerInput = {
  customerId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  province: string;
};

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

export function validateVerifyInput(input: {
  firstName?: unknown;
  lastName?: unknown;
  dateOfBirth?: unknown;
  province?: unknown;
}) {
  const firstName = String(input.firstName ?? "").trim();
  const lastName = String(input.lastName ?? "").trim();
  const dateOfBirth = String(input.dateOfBirth ?? "").trim();
  const province = String(input.province ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "First name and last name are required." } as const;
  }
  if (!isValidDate(dateOfBirth)) {
    return { error: "Date of birth must be YYYY-MM-DD." } as const;
  }
  if (!PROVINCES.has(province)) {
    return { error: "Province is invalid." } as const;
  }

  return { firstName, lastName, dateOfBirth, province } as const;
}

export async function saveCustomerVerification(
  admin: AdminGraphql,
  input: VerifyCustomerInput,
) {
  const response = await admin.graphql(
    `#graphql
      mutation VerifyCustomerInformation(
        $customer: CustomerInput!
        $metafields: [MetafieldsSetInput!]!
      ) {
        customerUpdate(input: $customer) {
          customer {
            id
            firstName
            lastName
          }
          userErrors {
            field
            message
          }
        }
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        customer: {
          id: input.customerId,
          firstName: input.firstName,
          lastName: input.lastName,
        },
        metafields: [
          {
            ownerId: input.customerId,
            namespace: "$app",
            key: "date_of_birth",
            type: "date",
            value: input.dateOfBirth,
          },
          {
            ownerId: input.customerId,
            namespace: "$app",
            key: "province",
            type: "single_line_text_field",
            value: input.province,
          },
        ],
      },
    },
  );

  const json = await response.json();
  const customerErrors = json?.data?.customerUpdate?.userErrors ?? [];
  const metafieldErrors = json?.data?.metafieldsSet?.userErrors ?? [];
  const errors = [...customerErrors, ...metafieldErrors];

  if (errors.length > 0) {
    return {
      ok: false as const,
      error: errors.map((e: { message: string }) => e.message).join("; "),
    };
  }

  return { ok: true as const };
}
