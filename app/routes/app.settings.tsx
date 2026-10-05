import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Divider,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Tabs,
  Banner,
  Box,
} from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "../shopify.server";
import { getOrCreateShop, getSettings, updateSettings } from "../services/forms.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const settings = await getSettings(shop.id);
  return json({ shop, settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const body = await request.formData();

  await updateSettings(shop.id, {
    storeName: body.get("storeName") as string || undefined,
    notificationEmail: body.get("notificationEmail") as string || undefined,
    senderName: body.get("senderName") as string || undefined,
    replyToEmail: body.get("replyToEmail") as string || undefined,
    autoResponseEnabled: body.get("autoResponseEnabled") === "true",
    autoResponseSubject: body.get("autoResponseSubject") as string || undefined,
    autoResponseBody: body.get("autoResponseBody") as string || undefined,
    submissionRetentionDays: parseInt(body.get("submissionRetentionDays") as string || "365"),
    spamProtection: body.get("spamProtection") === "true",
    duplicateProtection: body.get("duplicateProtection") === "true",
    defaultDesign: body.get("defaultDesign") as string || undefined,
    defaultButtonText: body.get("defaultButtonText") as string || undefined,
    defaultSuccessMessage: body.get("defaultSuccessMessage") as string || undefined,
  });

  return json({ success: true, message: "Settings saved!" });
};

export default function SettingsPage() {
  const { shop, settings } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for all settings
  const [form, setForm] = useState({
    storeName: settings?.storeName || "",
    notificationEmail: settings?.notificationEmail || "",
    senderName: settings?.senderName || "Connect Form",
    replyToEmail: settings?.replyToEmail || "",
    autoResponseEnabled: settings?.autoResponseEnabled || false,
    autoResponseSubject: settings?.autoResponseSubject || "We received your message",
    autoResponseBody: settings?.autoResponseBody || "Thank you for contacting us. We have received your request and our team will get back to you shortly.",
    submissionRetentionDays: settings?.submissionRetentionDays || 365,
    spamProtection: settings?.spamProtection !== false,
    duplicateProtection: settings?.duplicateProtection || false,
    defaultDesign: settings?.defaultDesign || "classic",
    defaultButtonText: settings?.defaultButtonText || "Send Message",
    defaultSuccessMessage: settings?.defaultSuccessMessage || "Thank you! Your message has been received.",
  });

  const handleSave = () => {
    setIsSaving(true);
    submit(
      {
        ...form,
        autoResponseEnabled: String(form.autoResponseEnabled),
        spamProtection: String(form.spamProtection),
        duplicateProtection: String(form.duplicateProtection),
        submissionRetentionDays: String(form.submissionRetentionDays),
      },
      { method: "post" }
    );
    setTimeout(() => {
      setIsSaving(false);
      shopify.toast.show("Settings saved!");
    }, 1000);
  };

  const tabs = [
    { id: "general", content: "General" },
    { id: "submission", content: "Submissions" },
    { id: "defaults", content: "Form Defaults" },
    { id: "support", content: "Support" },
  ];

  return (
    <Page
      title="Settings"
      primaryAction={{
        content: isSaving ? "Saving..." : "Save Settings",
        onAction: handleSave,
        disabled: isSaving,
      }}
    >
      <Card padding="0">
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
        <div style={{ padding: "24px" }}>

          {/* ── General ──────────────────────────────────────────────────── */}
          {selectedTab === 0 && (
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">General Settings</Text>
              <FormLayout>
                <TextField
                  label="Store Name"
                  value={form.storeName}
                  onChange={(v) => setForm({ ...form, storeName: v })}
                  placeholder={shop.shopDomain}
                  helpText="Used in email templates and notifications"
                  autoComplete="off"
                />
              </FormLayout>
              <Divider />
              <Text as="h2" variant="headingMd">Plan</Text>
              <InlineStack gap="300" align="space-between">
                <div>
                  <Text as="p" variant="bodyMd">
                    Current plan: <strong>{shop.plan.toUpperCase()}</strong>
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Shop: {shop.shopDomain}
                  </Text>
                </div>
                <Button url="/app/billing">Manage Plan</Button>
              </InlineStack>
            </BlockStack>
          )}

          {/* ── Submissions ───────────────────────────────────────────────── */}
          {selectedTab === 1 && (
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Submission Settings</Text>
              <FormLayout>
                <Select
                  label="Submission Retention Period"
                  options={[
                    { label: "30 days", value: "30" },
                    { label: "90 days", value: "90" },
                    { label: "180 days", value: "180" },
                    { label: "1 year (365 days)", value: "365" },
                    { label: "Forever", value: "9999" },
                  ]}
                  value={String(form.submissionRetentionDays)}
                  onChange={(v) => setForm({ ...form, submissionRetentionDays: parseInt(v) })}
                  helpText="How long to keep submission records"
                />
              </FormLayout>

              <Divider />
              <Text as="h2" variant="headingMd">Spam Protection</Text>
              <FormLayout>
                <Checkbox
                  label="Enable honeypot spam protection"
                  checked={form.spamProtection}
                  onChange={(v) => setForm({ ...form, spamProtection: v })}
                  helpText="Adds a hidden field to catch automated spam bots. Highly recommended."
                />
                <Checkbox
                  label="Enable duplicate submission protection"
                  checked={form.duplicateProtection}
                  onChange={(v) => setForm({ ...form, duplicateProtection: v })}
                  helpText="Prevents the same email from submitting the same form within 24 hours."
                />
              </FormLayout>
            </BlockStack>
          )}

          {/* ── Form Defaults ─────────────────────────────────────────────── */}
          {selectedTab === 2 && (
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Form Defaults</Text>
              <Banner tone="info">
                <p>These defaults apply to all new forms. You can override them individually in each form's settings.</p>
              </Banner>
              <FormLayout>
                <Select
                  label="Default Design"
                  options={[
                    { label: "Classic Contact", value: "classic" },
                    { label: "Modern Minimal", value: "modern-minimal" },
                    { label: "Card Contact", value: "card-contact" },
                    { label: "Split Contact", value: "split-contact" },
                    { label: "Floating Label", value: "floating-label" },
                    { label: "Dark Contact", value: "dark-contact" },
                    { label: "Premium Gradient", value: "premium-gradient" },
                  ]}
                  value={form.defaultDesign}
                  onChange={(v) => setForm({ ...form, defaultDesign: v })}
                />
                <TextField
                  label="Default Button Text"
                  value={form.defaultButtonText}
                  onChange={(v) => setForm({ ...form, defaultButtonText: v })}
                  placeholder="Send Message"
                  autoComplete="off"
                />
                <TextField
                  label="Default Success Message"
                  value={form.defaultSuccessMessage}
                  onChange={(v) => setForm({ ...form, defaultSuccessMessage: v })}
                  placeholder="Thank you! Your message has been received."
                  multiline={2}
                  autoComplete="off"
                />
              </FormLayout>
            </BlockStack>
          )}

          {/* ── Support ───────────────────────────────────────────────────── */}
          {selectedTab === 2 && (
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Support</Text>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
              }}>
                {[
                  {
                    title: "Documentation",
                    desc: "Browse our guides and tutorials to get the most out of Connect Form.",
                    action: "View Docs",
                    url: "https://docs.connectform.app",
                    icon: "📖",
                  },
                  {
                    title: "Contact Support",
                    desc: "Reach out to our team for help with any issues or questions.",
                    action: "Contact Us",
                    url: "mailto:support@connectform.app",
                    icon: "💬",
                  },
                  {
                    title: "Feature Requests",
                    desc: "Have an idea for a new feature? We'd love to hear it.",
                    action: "Submit Request",
                    url: "https://feedback.connectform.app",
                    icon: "💡",
                  },
                  {
                    title: "Status Page",
                    desc: "Check the current status of Connect Form services.",
                    action: "View Status",
                    url: "https://status.connectform.app",
                    icon: "🟢",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      padding: "20px", border: "1px solid #e5e7eb", borderRadius: "12px",
                      background: "#fafafa",
                    }}
                  >
                    <p style={{ margin: "0 0 4px", fontSize: "24px" }}>{item.icon}</p>
                    <Text as="h3" variant="headingSm">{item.title}</Text>
                    <p style={{ margin: "8px 0 12px", fontSize: "13px", color: "#6b7280" }}>{item.desc}</p>
                    <Button url={item.url} external>{item.action}</Button>
                  </div>
                ))}
              </div>

              <Divider />
              <Text as="h2" variant="headingMd">About Connect Form</Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">Version: 1.0.0</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Connect Form is a lightweight, affordable, and easy-to-use form builder for Shopify merchants.
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  By installing this app, you agree to our Terms of Service and Privacy Policy.
                </Text>
              </BlockStack>
            </BlockStack>
          )}
        </div>
      </Card>
    </Page>
  );
}

