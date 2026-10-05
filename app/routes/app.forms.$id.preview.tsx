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
  return json({ form });
};

export default function FormPreviewPage() {
  const { form } = useLoaderData<typeof loader>();
  const fields = JSON.parse(form.fields || "[]") as FormField[];
  const styling = JSON.parse(form.styling || "{}") as Record<string, unknown>;
  const settings = JSON.parse(form.settings || "{}") as Record<string, unknown>;

  const bg = (styling.backgroundColor as string) || "#ffffff";
  const primary = (styling.primaryColor as string) || "#6366f1";
  const btnColor = (styling.buttonColor as string) || primary;
  const btnText = (styling.buttonText2 as string) || "Send Message";
  const radius = (styling.borderRadius as string) || "8px";
  const isDark = bg === "#111827" || bg?.includes("#0") || bg?.includes("#1");

  return (
    <Page
      title={`Preview: ${form.name}`}
      backAction={{ url: `/app/forms/${form.id}` }}
    >
      <Banner tone="info">
        <p>This is a preview of how your form will appear on the storefront. Form ID: <strong>{form.formId}</strong></p>
      </Banner>

      <div style={{ marginTop: "24px", maxWidth: "640px", margin: "24px auto" }}>
        <div
          style={{
            background: bg,
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
            fontFamily: (styling.fontFamily as string) || "Inter, sans-serif",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {fields.map((field) => (
              <div
                key={field.id}
                style={{
                  width: field.width === "half" ? "calc(50% - 8px)" : "100%",
                  minWidth: "140px",
                }}
              >
                {field.type !== "checkbox" && (
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: isDark ? "#f3f4f6" : "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    {field.label}
                    {field.required && <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>}
                  </label>
                )}
                {field.helpText && (
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: isDark ? "#9ca3af" : "#6b7280" }}>
                    {field.helpText}
                  </p>
                )}

                {["text", "name", "email", "phone", "number", "url", "subject"].includes(field.type) && (
                  <input
                    readOnly
                    placeholder={field.placeholder || field.label}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 14px",
                      border: `1.5px solid ${isDark ? "#374151" : "#d1d5db"}`,
                      borderRadius: radius,
                      fontSize: "15px",
                      background: isDark ? "#1f2937" : "#fff",
                      color: isDark ? "#f9fafb" : "#111827",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                )}

                {field.type === "textarea" && (
                  <textarea
                    readOnly
                    placeholder={field.placeholder || field.label}
                    rows={4}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 14px",
                      border: `1.5px solid ${isDark ? "#374151" : "#d1d5db"}`,
                      borderRadius: radius,
                      fontSize: "15px",
                      background: isDark ? "#1f2937" : "#fff",
                      color: isDark ? "#f9fafb" : "#111827",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                )}

                {field.type === "dropdown" && (
                  <select
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: `1.5px solid ${isDark ? "#374151" : "#d1d5db"}`,
                      borderRadius: radius,
                      fontSize: "15px",
                      background: isDark ? "#1f2937" : "#fff",
                      color: isDark ? "#f9fafb" : "#111827",
                      fontFamily: "inherit",
                    }}
                  >
                    <option>{field.placeholder || "Select..."}</option>
                    {(field.options || []).map((o: string) => <option key={o}>{o}</option>)}
                  </select>
                )}

                {field.type === "rating" && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    {"★★★★★".split("").map((s, i) => (
                      <span key={i} style={{ fontSize: "28px", color: primary, cursor: "pointer" }}>★</span>
                    ))}
                  </div>
                )}

                {field.type === "checkbox" && (
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: isDark ? "#f3f4f6" : "#374151", cursor: "pointer" }}>
                    <input type="checkbox" readOnly style={{ accentColor: primary, width: "16px", height: "16px" }} />
                    {field.placeholder || field.label}
                  </label>
                )}

                {field.type === "file" && (
                  <div style={{
                    border: `2px dashed ${isDark ? "#374151" : "#d1d5db"}`,
                    borderRadius: radius,
                    padding: "20px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: isDark ? "#9ca3af" : "#9ca3af",
                  }}>
                    Click to upload or drag and drop
                  </div>
                )}

                {field.type === "radio" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(field.options || []).map((opt: string) => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: isDark ? "#f3f4f6" : "#374151", cursor: "pointer" }}>
                        <input type="radio" readOnly name={field.fieldName} style={{ accentColor: primary }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Submit Button */}
            <div style={{ width: "100%", marginTop: "8px" }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "13px 24px",
                  background: btnColor === "gradient"
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : btnColor,
                  color: (styling.buttonText as string) || "#ffffff",
                  border: "none",
                  borderRadius: radius,
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "0.01em",
                }}
              >
                {btnText}
              </button>
            </div>
          </div>

          {/* Success Message Preview */}
          <div style={{
            marginTop: "20px",
            padding: "16px",
            background: "#ecfdf5",
            borderRadius: radius,
            border: "1px solid #a7f3d0",
            fontSize: "14px",
            color: "#065f46",
            display: "none",
          }}>
            {(settings.successMessage as string) || "Thank you! Your message has been received."}
          </div>
        </div>

        {/* Form ID */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>
            Use this Form ID to embed the form on your storefront:
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <code style={{
              background: "#f3f4f6", padding: "6px 16px", borderRadius: "6px",
              fontSize: "14px", fontWeight: 600, color: "#6366f1", fontFamily: "monospace",
            }}>
              {form.formId}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(form.formId); }}
              style={{
                padding: "6px 12px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
