import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useSubmit,
  Link,
  useSearchParams,
} from "@remix-run/react";
import {
  Page,
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
  Select,
  Modal,
  FormLayout,
  TextField,
  Banner,
} from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "../shopify.server";
import {
  getOrCreateShop,
  getSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
  exportSubmissionsCSV,
  getForms,
} from "../services/forms.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get("page") || "1");
  const formFilter = url.searchParams.get("form") || undefined;
  const statusFilter = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const [submissionsData, forms] = await Promise.all([
    getSubmissions(shop.id, { formId: formFilter, status: statusFilter, search, page, limit: 25 }),
    getForms(shop.id),
  ]);

  return json({ shop, ...submissionsData, forms });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const body = await request.formData();
  const intent = body.get("intent") as string;

  if (intent === "updateStatus") {
    await updateSubmissionStatus(body.get("id") as string, shop.id, body.get("status") as string);
    return json({ success: true });
  }

  if (intent === "delete") {
    await deleteSubmission(body.get("id") as string, shop.id);
    return json({ success: true });
  }

  if (intent === "export") {
    const csv = await exportSubmissionsCSV(shop.id, {
      formId: body.get("formId") as string || undefined,
    });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-${Date.now()}.csv"`,
      },
    });
  }

  return json({ error: "Unknown" }, { status: 400 });
};

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, "success" | "info" | "warning" | "attention"> = {
    new: "attention",
    read: "info",
    replied: "success",
    archived: "warning",
  };
  return <Badge tone={tones[status] || "info"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

export default function SubmissionsPage() {
  const { submissions, total, page, limit, forms } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();

  const [queryValue, setQueryValue] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get("status") ? [searchParams.get("status")!] : []
  );
  const [formFilter, setFormFilter] = useState<string[]>(
    searchParams.get("form") ? [searchParams.get("form")!] : []
  );

  const applyFilters = (newParams: Record<string, string>) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([k, v]) => {
        if (v) updated.set(k, v);
        else updated.delete(k);
      });
      updated.set("page", "1");
      return updated;
    });
  };

  const handleSearch = (value: string) => {
    setQueryValue(value);
    applyFilters({ search: value });
  };

  const rows = submissions.map((s) => {
    const data = JSON.parse(s.data || "{}") as Record<string, string>;
    const name = data.name || data.Name || data["Full Name"] || "—";
    const email = data.email || data.Email || "—";

    return [
      <button
        key={s.id}
        onClick={() => navigate(`/app/submissions/${s.id}`)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
      >
        <Text as="span" variant="bodyMd" fontWeight="semibold">{name}</Text>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>{s.submissionId}</p>
      </button>,
      <span key={`email-${s.id}`} style={{ fontSize: "13px", color: "#6b7280" }}>{email}</span>,
      <span key={`form-${s.id}`} style={{ fontSize: "13px" }}>{s.form.name}</span>,
      <span key={`cat-${s.id}`} style={{ fontSize: "13px", color: "#9ca3af" }}>{s.category || "—"}</span>,
      <span key={`date-${s.id}`} style={{ fontSize: "13px", color: "#9ca3af" }}>
        {new Date(s.createdAt).toLocaleDateString()}
      </span>,
      <StatusBadge key={`status-${s.id}`} status={s.status} />,
      <InlineStack key={`actions-${s.id}`} gap="100">
        <Button size="micro" onClick={() => navigate(`/app/submissions/${s.id}`)}>View</Button>
        {s.status === "new" && (
          <Button size="micro" onClick={() => submit({ intent: "updateStatus", id: s.id, status: "read" }, { method: "post" })}>
            Mark Read
          </Button>
        )}
        <Button
          size="micro"
          tone="critical"
          onClick={() => {
            if (confirm("Delete this submission?")) {
              submit({ intent: "delete", id: s.id }, { method: "post" });
            }
          }}
        >
          Delete
        </Button>
      </InlineStack>,
    ];
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <Page
      title="Submissions"
      subtitle={`${total} total submission${total !== 1 ? "s" : ""}`}
      primaryAction={{
        content: "Export CSV",
        url: `/app/submissions/export?formId=${formFilter[0] || ""}`,
        external: true,
      }}
    >
      <Card>
        <BlockStack gap="400">
          <Filters
            queryValue={queryValue}
            queryPlaceholder="Search by name, email, or ID..."
            filters={[
              {
                key: "status",
                label: "Status",
                filter: (
                  <ChoiceList
                    title="Status"
                    titleHidden
                    choices={[
                      { label: "New", value: "new" },
                      { label: "Read", value: "read" },
                      { label: "Replied", value: "replied" },
                      { label: "Archived", value: "archived" },
                    ]}
                    selected={statusFilter}
                    onChange={(v) => { setStatusFilter(v); applyFilters({ status: v[0] || "" }); }}
                    allowMultiple={false}
                  />
                ),
                shortcut: true,
              },
              {
                key: "form",
                label: "Form",
                filter: (
                  <ChoiceList
                    title="Form"
                    titleHidden
                    choices={forms.map((f) => ({ label: f.name, value: f.id }))}
                    selected={formFilter}
                    onChange={(v) => { setFormFilter(v); applyFilters({ form: v[0] || "" }); }}
                    allowMultiple={false}
                  />
                ),
                shortcut: true,
              },
            ]}
            appliedFilters={[
              ...(statusFilter.length > 0 ? [{ key: "status", label: `Status: ${statusFilter[0]}`, onRemove: () => { setStatusFilter([]); applyFilters({ status: "" }); } }] : []),
              ...(formFilter.length > 0 ? [{ key: "form", label: `Form: ${forms.find(f => f.id === formFilter[0])?.name || formFilter[0]}`, onRemove: () => { setFormFilter([]); applyFilters({ form: "" }); } }] : []),
            ]}
            onQueryChange={handleSearch}
            onQueryClear={() => handleSearch("")}
            onClearAll={() => {
              setQueryValue(""); setStatusFilter([]); setFormFilter([]);
              setSearchParams({});
            }}
          />
          <Divider />
          {submissions.length === 0 ? (
            <EmptyState
              heading="No submissions yet"
              image=""
            >
              <p>Customer submissions will appear here after your form receives responses.</p>
            </EmptyState>
          ) : (
            <>
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text", "text", "text"]}
                headings={["Customer", "Email", "Form", "Category", "Date", "Status", "Actions"]}
                rows={rows}
              />
              {/* Pagination */}
              {totalPages > 1 && (
                <InlineStack align="center" gap="200">
                  <Button
                    disabled={page <= 1}
                    onClick={() => setSearchParams((prev) => { const u = new URLSearchParams(prev); u.set("page", String(page - 1)); return u; })}
                  >
                    Previous
                  </Button>
                  <Text as="span" variant="bodySm">Page {page} of {totalPages}</Text>
                  <Button
                    disabled={page >= totalPages}
                    onClick={() => setSearchParams((prev) => { const u = new URLSearchParams(prev); u.set("page", String(page + 1)); return u; })}
                  >
                    Next
                  </Button>
                </InlineStack>
              )}
            </>
          )}
        </BlockStack>
      </Card>
    </Page>
  );
}
