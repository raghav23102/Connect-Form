import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useSubmit,
  Link,
} from "@remix-run/react";
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
  Divider,
  Filters,
  ChoiceList,
} from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "../shopify.server";
import {
  getOrCreateShop,
  getForms,
  duplicateForm,
  deleteForm,
  setFormStatus,
} from "../services/forms.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const forms = await getForms(shop.id);
  return json({ shop, forms });
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
        return json({ success: true });
      case "delete":
        await deleteForm(formId, shop.id);
        return json({ success: true });
      case "enable":
        await setFormStatus(formId, shop.id, "active");
        return json({ success: true });
      case "disable":
        await setFormStatus(formId, shop.id, "disabled");
        return json({ success: true });
      default:
        return json({ error: "Unknown" }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.startsWith("PLAN_LIMIT:")) {
      return json({ planError: msg.replace("PLAN_LIMIT: ", "") }, { status: 402 });
    }
    return json({ error: msg }, { status: 500 });
  }
};

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, "success" | "info" | "warning"> = {
    active: "success",
    draft: "info",
    disabled: "warning",
  };
  return <Badge tone={tones[status] || "info"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

const DESIGN_NAMES: Record<string, string> = {
  classic: "Classic",
  "modern-minimal": "Minimal",
  "split-contact": "Split",
  "card-contact": "Card",
  "floating-label": "Floating",
  "dark-contact": "Dark",
  "premium-gradient": "Gradient",
};

export default function FormsPage() {
  const { forms } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [queryValue, setQueryValue] = useState("");

  const handleAction = (intent: string, formId: string, formPublicId?: string) => {
    if (intent === "delete") {
      if (!confirm("Delete this form? This cannot be undone.")) return;
    }
    if (intent === "copyId" && formPublicId) {
      navigator.clipboard.writeText(formPublicId);
      shopify.toast.show("Form ID copied to clipboard!");
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

  // Filter forms
  const filtered = forms.filter((f) => {
    const matchesQuery = !queryValue || f.name.toLowerCase().includes(queryValue.toLowerCase()) || f.formId.toLowerCase().includes(queryValue.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(f.status);
    return matchesQuery && matchesStatus;
  });

  const rows = filtered.map((form) => [
    <div key={form.id}>
      <Link to={`/app/forms/${form.id}`} style={{ fontWeight: 600, color: "#111827", textDecoration: "none" }}>
        {form.name}
      </Link>
      {form.description && (
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>{form.description}</p>
      )}
    </div>,
    <div key={`id-${form.id}`}>
      <code style={{ fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: "4px" }}>
        {form.formId}
      </code>
    </div>,
    <Badge key={`design-${form.id}`}>{DESIGN_NAMES[form.design] || form.design}</Badge>,
    <StatusBadge key={`status-${form.id}`} status={form.status} />,
    <span key={`count-${form.id}`}>{form._count.submissions}</span>,
    <span key={`date-${form.id}`} style={{ color: "#9ca3af", fontSize: "13px" }}>
      {new Date(form.updatedAt).toLocaleDateString()}
    </span>,
    <InlineStack key={`actions-${form.id}`} gap="100" wrap>
      <Button size="micro" onClick={() => handleAction("edit", form.id)}>Edit</Button>
      <Button size="micro" onClick={() => handleAction("preview", form.id)}>Preview</Button>
      <Button size="micro" onClick={() => handleAction("duplicate", form.id)}>Duplicate</Button>
      <Button size="micro" onClick={() => handleAction("copyId", form.id, form.formId)}>Copy ID</Button>
      <Button
        size="micro"
        tone={form.status === "active" ? "critical" : undefined}
        onClick={() => handleAction(form.status === "active" ? "disable" : "enable", form.id)}
      >
        {form.status === "active" ? "Disable" : "Enable"}
      </Button>
      <Button size="micro" tone="critical" onClick={() => handleAction("delete", form.id)}>Delete</Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="Forms"
      subtitle={`${forms.length} total form${forms.length !== 1 ? "s" : ""}`}
      primaryAction={{
        content: "+ Create Form",
        onAction: () => navigate("/app/forms/new"),
      }}
    >
      <Card>
        <BlockStack gap="400">
          <Filters
            queryValue={queryValue}
            queryPlaceholder="Search forms..."
            filters={[
              {
                key: "status",
                label: "Status",
                filter: (
                  <ChoiceList
                    title="Status"
                    titleHidden
                    choices={[
                      { label: "Active", value: "active" },
                      { label: "Draft", value: "draft" },
                      { label: "Disabled", value: "disabled" },
                    ]}
                    selected={statusFilter}
                    onChange={setStatusFilter}
                    allowMultiple
                  />
                ),
                shortcut: true,
              },
            ]}
            appliedFilters={
              statusFilter.length > 0
                ? [{ key: "status", label: `Status: ${statusFilter.join(", ")}`, onRemove: () => setStatusFilter([]) }]
                : []
            }
            onQueryChange={setQueryValue}
            onQueryClear={() => setQueryValue("")}
            onClearAll={() => { setQueryValue(""); setStatusFilter([]); }}
          />
          <Divider />
          {filtered.length === 0 ? (
            <EmptyState
              heading={forms.length === 0 ? "Create your first form" : "No matching forms"}
              action={{ content: "Create Form", url: "/app/forms/new" }}
              image=""
            >
              {forms.length === 0 ? (
                <p>Build a beautiful contact form and start collecting customer inquiries.</p>
              ) : (
                <p>Try adjusting your search or filters.</p>
              )}
            </EmptyState>
          ) : (
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "numeric", "text", "text"]}
              headings={["Form", "Form ID", "Design", "Status", "Submissions", "Updated", "Actions"]}
              rows={rows}
              truncate
            />
          )}
        </BlockStack>
      </Card>
    </Page>
  );
}
