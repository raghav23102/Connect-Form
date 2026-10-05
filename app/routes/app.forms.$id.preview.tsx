import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Banner, Button, InlineStack } from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import { getOrCreateShop, getForm } from "../services/forms.server";
import type { FormField } from "../services/templates";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const form = await getForm(params.id!, shop.id);
  if (!form) throw new Response("Not found", { status: 404 });
  return json({ form, shop });
};

export default function FormPreviewPage() {
  const { form, shop } = useLoaderData<typeof loader>();
  const proxyUrl = "https://" + shop.shopDomain + "/apps/connect-form?formId=" + form.formId;

  return (
    <Page title={"Preview: " + form.name} backAction={{ url: "/app/forms/" + form.id }}>
      <Banner tone="info">
        <p>This is a live preview of how your form will appear on your Shopify Storefront. Form ID: <strong>{form.formId}</strong></p>
      </Banner>

      <div style={{ marginTop: "24px", maxWidth: "800px", margin: "24px auto", background: "#f9fafb", padding: "16px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
        <div style={{ width: "100%", height: "700px", overflow: "hidden", borderRadius: "8px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <iframe 
            src={proxyUrl} 
            title="Form Preview"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      </div>
    </Page>
  );
}
