import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

const CUSTOMER_API = 'shopify://customer-account/api/2026-10/graphql.json';
const PROFILE_PAGE_URL = 'https://flavourbeast.com/pages/profile';

export default async () => {
  render(<Extension />, document.body);
};

async function customerGraphql(query) {
  const response = await fetch(CUSTOMER_API, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query}),
  });
  return response.json();
}

function Extension() {
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function bootstrap() {
      try {
        const result = await customerGraphql(`
          query CustomerFirstName {
            customer {
              id
              firstName
            }
          }
        `);

        if (cancelled) return;

        const customer = result?.data?.customer;
        const missingFirst = Boolean(
          customer?.id &&
            !(customer.firstName && String(customer.firstName).trim()),
        );
        setNeedsVerification(missingFirst);

        if (missingFirst) {
          timer = setTimeout(() => {
            open(PROFILE_PAGE_URL, '_top');
          }, 50);
        }
      } catch (e) {
        // Fall through to the manual button UI.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (loading || !needsVerification) {
    return null;
  }

  return (
    <s-banner heading="Verify your information" tone="warning">
      <s-stack direction="block" gap="base">
        <s-text>
          Please confirm your name and details before continuing.
        </s-text>
        <s-button variant="primary" href={PROFILE_PAGE_URL}>
          Continue
        </s-button>
      </s-stack>
    </s-banner>
  );
}
