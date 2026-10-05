import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Badge,
  Divider,
  Modal,
  FormLayout,
  TextField,
  Banner,
  Box,
} from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "../shopify.server";
import {
  getOrCreateShop,
  getSubmission,
  updateSubmissionStatus,
  deleteSubmission,
} from "../services/forms.server";
import { prisma } from "../db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const submission = await getSubmission(params.id!, shop.id);
  if (!submission) throw new Response("Not found", { status: 404 });
  return json({ shop, submission });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const body = await request.formData();
  const intent = body.get("intent") as string;
  const submissionId = params.id!;

  if (intent === "updateStatus") {
    await updateSubmissionStatus(submissionId, shop.id, body.get("status") as string);
    return json({ success: true });
  }

  if (intent === "delete") {
    await deleteSubmission(submissionId, shop.id);
    return json({ success: true, deleted: true });
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

export default function SubmissionDetail() {
  const { submission } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const fields = JSON.parse(submission.data || "{}") as Record<string, string>;

  const handleStatusChange = (status: string) => {
    submit({ intent: "updateStatus", status }, { method: "post" });
  };

  const handleDelete = () => {
    if (confirm("Delete this submission? This cannot be undone.")) {
      submit({ intent: "delete" }, { method: "post" });
      navigate("/app/submissions");
    }
  };
  return (
    <Page
      title={`Submission ${submission.submissionId}`}
      subtitle={`Form: ${submission.form.name}`}
      backAction={{ url: "/app/submissions" }}
      secondaryActions={[
        {
          content: submission.status === "read" ? "Mark Unread" : "Mark Read",
          onAction: () => handleStatusChange(submission.status === "read" ? "new" : "read"),
        },
        {
          content: "Mark Replied",
          onAction: () => handleStatusChange("replied"),
        },
        {
          content: "Archive",
          onAction: () => handleStatusChange("archived"),
        },
        { content: "Delete", destructive: true, onAction: handleDelete },
      ]}
    >
      <BlockStack gap="500">
        {/* Meta */}
        <Card>
          <InlineStack gap="400" wrap>
            <div>
              <Text as="p" variant="bodySm" tone="subdued">Status</Text>
              <StatusBadge status={submission.status} />
            </div>
            <div>
              <Text as="p" variant="bodySm" tone="subdued">Submitted</Text>
              <Text as="p" variant="bodyMd">
                {new Date(submission.createdAt).toLocaleString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodySm" tone="subdued">Form</Text>
              <code style={{ fontSize: "12px", color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: "4px" }}>
                {submission.form.formId}
              </code>
            </div>
            {submission.category && (
              <div>
                <Text as="p" variant="bodySm" tone="subdued">Category</Text>
                <Badge>{submission.category}</Badge>
              </div>
            )}
          </InlineStack>
        </Card>

        {/* Submitted Fields */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Submission Details</Text>
            <Divider />
            <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
              {Object.entries(fields).map(([key, value], idx) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    padding: "12px 16px",
                    background: idx % 2 === 0 ? "#fff" : "#f9fafb",
                    borderBottom: "1px solid #f0f0f0",
                    gap: "16px",
                  }}
                >
                  <div style={{ width: "35%", fontWeight: 600, fontSize: "14px", color: "#374151", flexShrink: 0 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280", flex: 1, wordBreak: "break-word" }}>
                    {value || "—"}
                  </div>
                </div>
              ))}
            </div>

          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}


