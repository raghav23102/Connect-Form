import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Badge,
  DataTable,
  EmptyState,
  Banner,
  Box,
  Divider,
  Icon,
  Tooltip,
} from "@shopify/polaris";
import {
  FormsIcon,
  EmailIcon,
  DataTableIcon,
  ChartVerticalIcon,
} from "@shopify/polaris-icons";

import { authenticate } from "../shopify.server";
import {
  getOrCreateShop,
  getDashboardStats,
  getRecentForms,
  duplicateForm,
  deleteForm,
  setFormStatus,
} from "../services/forms.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const [stats, recentForms] = await Promise.all([
    getDashboardStats(shop.id),
    getRecentForms(shop.id, 5),
  ]);
  return json({ 
    shop, 
    stats, 
    recentForms: recentForms.map(f => ({ ...f, formattedDate: new Date(f.updatedAt).toLocaleDateString("en-US") })),
    currentMonth: new Date().toLocaleString("en-US", { month: "long" }) 
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const formId = formData.get("formId") as string;

  try {
    switch (intent) {
      case "duplicate":
        await duplicateForm(formId, shop.id, shop.plan);
        return json({ success: true, message: "Form duplicated successfully!" });
      case "delete":
        await deleteForm(formId, shop.id);
        return json({ success: true, message: "Form deleted." });
      case "enable":
        await setFormStatus(formId, shop.id, "active");
        return json({ success: true, message: "Form enabled." });
      case "disable":
        await setFormStatus(formId, shop.id, "disabled");
        return json({ success: true, message: "Form disabled." });
      default:
        return json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Something went wrong.";
    if (msg.startsWith("PLAN_LIMIT:")) {
      return json({ planError: msg.replace("PLAN_LIMIT: ", "") }, { status: 402 });
    }
    return json({ error: msg }, { status: 500 });
  }
};

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 500,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "32px",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p
              style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "info" | "warning" | "critical"> = {
    active: "success",
    draft: "info",
    disabled: "warning",
  };
  return <Badge tone={map[status] || "info"}>{status}</Badge>;
}

function DesignBadge({ design }: { design: string }) {
  const names: Record<string, string> = {
    classic: "Classic",
    "modern-minimal": "Minimal",
    "split-contact": "Split",
    "card-contact": "Card",
    "floating-label": "Floating",
    "dark-contact": "Dark",
    "premium-gradient": "Gradient",
  };
  return <Badge>{names[design] || design}</Badge>;
}

export default function Dashboard() {
  const { shop, stats, recentForms, currentMonth } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const handleAction = (
    intent: string,
    formId: string,
    _name: string
  ) => {
    if (intent === "delete") {
      if (!confirm(`Delete this form? This cannot be undone.`)) return;
    }
    if (intent === "copyId") {
      const form = recentForms.find((f) => f.id === formId);
      if (form) {
        navigator.clipboard.writeText(form.formId);
        shopify.toast.show("Form ID copied!");
      }
      return;
    }
    if (intent === "edit") {
      navigate(`/app/forms/${formId}`);
      return;
    }
    if (intent === "preview") {
      navigate(`/app/forms/${formId}/preview`);
      return;
    }
    submit({ intent, formId }, { method: "post" });
  };

  const rows = recentForms.map((form) => [
    <Link key={form.id} to={`/app/forms/${form.id}`} style={{ fontWeight: 600, color: "#111827", textDecoration: "none" }}>
      {form.name}
    </Link>,
    <code key={`id-${form.id}`} style={{ fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>
      {form.formId}
    </code>,
    <DesignBadge key={`design-${form.id}`} design={form.design} />,
    <StatusBadge key={`status-${form.id}`} status={form.status} />,
    <span key={`count-${form.id}`}>{form._count.submissions}</span>,
    <span key={`date-${form.id}`} style={{ color: "#9ca3af", fontSize: "13px" }}>
      {form.formattedDate}
    </span>,
    <InlineStack key={`actions-${form.id}`} gap="100">
      <Button size="micro" onClick={() => handleAction("edit", form.id, form.name)}>Edit</Button>
      <Button size="micro" onClick={() => handleAction("preview", form.id, form.name)}>Preview</Button>
      <Button size="micro" onClick={() => handleAction("duplicate", form.id, form.name)}>Duplicate</Button>
      <Button size="micro" onClick={() => handleAction("copyId", form.id, form.name)}>Copy ID</Button>
      <Button
        size="micro"
        tone={form.status === "active" ? "critical" : undefined}
        onClick={() =>
          handleAction(
            form.status === "active" ? "disable" : "enable",
            form.id,
            form.name
          )
        }
      >
        {form.status === "active" ? "Disable" : "Enable"}
      </Button>
      <Button size="micro" tone="critical" onClick={() => handleAction("delete", form.id, form.name)}>Delete</Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="Dashboard"
      subtitle={`Welcome to Connect Form — ${shop.shopDomain}`}
      primaryAction={{
        content: "Create Form",
        onAction: () => navigate("/app/forms/new"),
      }}
    >
      <BlockStack gap="600">
        {/* Plan Banner */}
        {shop.plan === "free" && (
          <Banner
            title="You're on the Free plan"
            action={{ content: "Upgrade Plan", url: "/app/billing" }}
            tone="info"
          >
            <p>Create up to 1 active form and receive 50 submissions/month. Upgrade for more.</p>
          </Banner>
        )}

        {/* Stats Cards */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <StatCard
            title="Total Forms"
            value={stats.totalForms}
            icon={<Icon source={FormsIcon} tone="base" />}
            color="#eef2ff"
            subtitle="All time"
          />
          <StatCard
            title="Active Forms"
            value={stats.activeForms}
            icon={<Icon source={ChartVerticalIcon} tone="base" />}
            color="#ecfdf5"
            subtitle="Currently live"
          />
          <StatCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            icon={<Icon source={EmailIcon} tone="base" />}
            color="#fff7ed"
            subtitle="All time"
          />
          <StatCard
            title="This Month"
            value={stats.thisMonthSubmissions}
            icon={<Icon source={DataTableIcon} tone="base" />}
            color="#fdf4ff"
            subtitle={currentMonth}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Quick Actions</Text>
            <InlineStack gap="300" wrap>
              <Button variant="primary" onClick={() => navigate("/app/forms/new")}>
                + Create Form
              </Button>
              <Button onClick={() => navigate("/app/forms")}>View Forms</Button>
              <Button onClick={() => navigate("/app/submissions")}>View Submissions</Button>
              <Button onClick={() => navigate("/app/billing")}>Billing</Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Recent Forms */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between">
              <Text as="h2" variant="headingMd">Recent Forms</Text>
              <Button variant="plain" url="/app/forms">View all</Button>
            </InlineStack>
            <Divider />
            {recentForms.length === 0 ? (
              <EmptyState
                heading="No forms yet"
                action={{ content: "Create Form", url: "/app/forms/new" }}
                image=""
              >
                <p>Build a beautiful contact form and start collecting customer inquiries.</p>
              </EmptyState>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "numeric", "text", "text"]}
                headings={["Form Name", "Form ID", "Design", "Status", "Submissions", "Updated", "Actions"]}
                rows={rows}
                truncate
              />
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
