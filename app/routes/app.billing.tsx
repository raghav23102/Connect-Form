import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Badge,
  Divider,
  Banner,
  List,
  Box,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import { getOrCreateShop } from "../services/forms.server";
import { PLANS, getPlan } from "../services/plans";

import { prisma } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const url = new URL(request.url);
  const planParam = url.searchParams.get("plan");
  const success = url.searchParams.get("success");

  if (planParam && success === "1") {
    try {
      const planName = getPlan(planParam).name;
      const { hasActivePayment } = await billing.check({
        plans: [planName],
        isTest: true,
      });

      if (hasActivePayment) {
        if (shop.plan !== planParam) {
          await prisma.shop.update({ where: { id: shop.id }, data: { plan: planParam } });
          await prisma.subscription.create({
            data: { shopId: shop.id, plan: planParam, status: "active" },
          });
        }
        // Don't redirect, just fall through so we preserve Shopify's URL params!
      }
    } catch (err) {
      console.error("Failed to verify billing", err);
    }
  }
  const currentPlan = getPlan(shop.plan);
  const subscription = await prisma.subscription.findFirst({
    where: { shopId: shop.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return json({ shop, currentPlan, subscription });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const body = await request.formData();
  const planId = body.get("planId") as string;

  if (planId === "free") {
    // Downgrade to free — cancel existing subscription
    await prisma.shop.update({ where: { id: shop.id }, data: { plan: "free" } });
    await prisma.subscription.updateMany({
      where: { shopId: shop.id, status: "active" },
      data: { status: "cancelled" },
    });
    return json({ success: true, message: "Downgraded to Free plan." });
  }

  const plan = getPlan(planId);
  if (plan.price === 0) return json({ error: "Invalid plan" }, { status: 400 });

  try {
    const url = new URL(request.url);
    const returnUrl = `https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app/billing?plan=${planId}&success=1`;
    
    await billing.request({
      plan: plan.name,
      isTest: true,
      returnUrl: returnUrl,
    });
  } catch (err: any) {
    if (err instanceof Response) {
      throw err; // Let Remix handle the redirect response
    }
    console.error("Billing request error:", err);
    return json({ error: err.message || String(err) }, { status: 500 });
  }

  return null;
};

const PLAN_ORDER = ["free", "simple", "pro", "vip"] as const;

const PLAN_COLORS: Record<string, string> = {
  free: "#6b7280",
  simple: "#0ea5e9",
  pro: "#6366f1",
  vip: "#7c3aed",
};

const PLAN_GRADIENTS: Record<string, string> = {
  free: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
  simple: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
  pro: "linear-gradient(135deg, #eef2ff, #ddd6fe)",
  vip: "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
};

export default function BillingPage() {
  const { shop, currentPlan, subscription } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: boolean; message?: string }>();
  const submit = useSubmit();

  const handleUpgrade = (planId: string) => {
    if (planId === shop.plan) return;
    submit({ planId }, { method: "post" });
  };

  return (
    <Page
      title="Billing & Plans"
      subtitle="Choose the plan that's right for your store"
    >
      <BlockStack gap="600">
        {actionData?.error && (
          <Banner tone="critical" title="Billing Error">
            <p>{actionData.error}</p>
          </Banner>
        )}
        {actionData?.success && actionData?.message && (
          <Banner tone="success">
            <p>{actionData.message}</p>
          </Banner>
        )}
        {/* Current Plan Banner */}
        <Banner tone={shop.plan === "free" ? "info" : "success"}>
          <p>
            You are currently on the <strong>{currentPlan.name}</strong> plan.
            {shop.plan === "free" && " Upgrade to unlock more forms and features."}
            {subscription?.renewalDate && ` Renews: ${typeof subscription.renewalDate === "string" ? subscription.renewalDate.split("T")[0] : new Date(subscription.renewalDate).toISOString().split("T")[0]}`}
          </p>
        </Banner>

        {/* Pricing Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = shop.plan === planId;
            const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(shop.plan as typeof planId);
            const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(shop.plan as typeof planId);
            const color = PLAN_COLORS[planId];

            return (
              <div
                key={planId}
                style={{
                  border: isCurrent ? `2px solid ${color}` : "2px solid #e5e7eb",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow: isCurrent ? `0 4px 16px ${color}33` : "0 1px 4px rgba(0,0,0,0.06)",
                  position: "relative",
                }}
              >
                {/* Header */}
                <div style={{ background: PLAN_GRADIENTS[planId], padding: "24px 20px" }}>
                  {isCurrent && (
                    <div style={{
                      position: "absolute", top: "12px", right: "12px",
                      background: color, color: "#fff", fontSize: "11px",
                      fontWeight: 700, padding: "2px 10px", borderRadius: "999px",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      Current
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {plan.name}
                  </p>
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>
                      {plan.price === 0 ? "Free" : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && <span style={{ fontSize: "14px", color: "#6b7280" }}>/month</span>}
                  </div>
                </div>

                {/* Features */}
                <div style={{ padding: "20px" }}>
                  <BlockStack gap="200">
                    {plan.features.map((feature, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ color: color, flexShrink: 0, fontWeight: 700, fontSize: "14px" }}>✓</span>
                        <span style={{ fontSize: "13px", color: "#374151" }}>{feature}</span>
                      </div>
                    ))}
                  </BlockStack>

                  <Box paddingBlockStart="400">
                    {isCurrent ? (
                      <Button disabled fullWidth>Current Plan</Button>
                    ) : isUpgrade ? (
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => handleUpgrade(planId)}
                        tone="success"
                      >
                        Upgrade to {plan.name}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        onClick={() => {
                          if (confirm(`Downgrade to ${plan.name} plan? You may lose access to some features.`)) {
                            handleUpgrade(planId);
                          }
                        }}
                      >
                        Downgrade to {plan.name}
                      </Button>
                    )}
                  </Box>
                </div>
              </div>
            );
          })}
        </div>

        {/* Plan Limits Comparison */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Plan Comparison</Text>
            <Divider />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>Feature</th>
                    {PLAN_ORDER.map((p) => (
                      <th key={p} style={{ padding: "10px 16px", textAlign: "center", fontWeight: 600, color: PLAN_COLORS[p], borderBottom: "1px solid #e5e7eb" }}>
                        {PLANS[p].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Active Forms", values: ["1", "3", "10", "Unlimited"] },
                    { label: "Monthly Submissions", values: ["50", "500", "2,000", "Unlimited"] },
                    { label: "Templates", values: ["Basic (1)", "Simple (4)", "Pro (9)", "All (12)"] },
                    { label: "Conditional Logic", values: ["✗", "✗", "✓", "✓"] },
                    { label: "File Uploads", values: ["✗", "✗", "✓", "✓"] },
                    { label: "Multiple Recipients", values: ["✗", "✗", "✓", "✓"] },
                    { label: "Email Routing", values: ["✗", "✗", "✓", "✓"] },
                    { label: "Auto-Response", values: ["✗", "✓", "✓", "✓"] },
                    { label: "Export CSV", values: ["✗", "✓", "✓", "✓"] },
                    { label: "Shopify Flow", values: ["✗", "✗", "✓", "✓"] },
                    { label: "Priority Support", values: ["✗", "✗", "✗", "✓"] },
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={{ padding: "10px 16px", color: "#374151", borderBottom: "1px solid #f0f0f0" }}>{row.label}</td>
                      {row.values.map((v, j) => (
                        <td key={j} style={{
                          padding: "10px 16px", textAlign: "center", borderBottom: "1px solid #f0f0f0",
                          color: v === "✓" ? "#10b981" : v === "✗" ? "#d1d5db" : "#374151",
                          fontWeight: v === "✓" || v === "✗" ? 700 : 400,
                        }}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BlockStack>
        </Card>

        {/* FAQ */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Frequently Asked Questions</Text>
            <Divider />
            {[
              { q: "Can I change plans at any time?", a: "Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the end of your billing cycle." },
              { q: "What happens to my forms if I downgrade?", a: "Your forms will remain saved, but forms exceeding your plan's limit will be disabled. You can re-enable them after upgrading." },
              { q: "Is there a free trial?", a: "The Free plan is free forever. Paid plans are billed monthly with no long-term commitment." },
              { q: "What payment methods are accepted?", a: "Payments are processed through Shopify Billing, which accepts all major credit cards." },
            ].map((faq, i) => (
              <div key={i} style={{ paddingBottom: "12px" }}>
                <Text as="p" variant="bodyMd" fontWeight="semibold">{faq.q}</Text>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>{faq.a}</p>
              </div>
            ))}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

