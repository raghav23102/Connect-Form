import { useState, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, Form, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Badge,
  Box,
  Divider,
  Banner,
  Modal,
  Tabs,
  TextField,
  Select,
  Checkbox,
  FormLayout,
  Tag,
  Icon,
} from "@shopify/polaris";
import { DragHandleIcon, DeleteIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from "@shopify/polaris-icons";

import { authenticate } from "../shopify.server";
import {
  getOrCreateShop,
  createForm,
  getForm,
  updateForm,
  getNotificationRules,
  createNotificationRule,
  deleteNotificationRule,
} from "../services/forms.server";
import { FORM_TEMPLATES, getTemplate } from "../services/templates";
import type { FormField } from "../services/templates";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  if (params.id === "new") {
    return json({ shop, form: null, isNew: true, notificationRules: [] });
  }

  const form = await getForm(params.id!, shop.id);
  if (!form) throw new Response("Form not found", { status: 404 });
  const notificationRules = await getNotificationRules(form.id);

  return json({ shop, form, isNew: false, notificationRules });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const body = await request.formData();
  const intent = body.get("intent") as string;

  try {
    if (intent === "create") {
      const form = await createForm(shop.id, shop.plan, {
        name: body.get("name") as string,
        description: body.get("description") as string || undefined,
        design: body.get("design") as string,
        fields: JSON.parse(body.get("fields") as string || "[]"),
        styling: JSON.parse(body.get("styling") as string || "{}"),
        settings: JSON.parse(body.get("settings") as string || "{}"),
      });
      return redirect(`/app/forms/${form.id}?created=1`);
    }

    if (intent === "update") {
      await updateForm(params.id!, shop.id, {
        name: body.get("name") as string,
        description: body.get("description") as string || undefined,
        design: body.get("design") as string,
        fields: JSON.parse(body.get("fields") as string || "[]"),
        styling: JSON.parse(body.get("styling") as string || "{}"),
        settings: JSON.parse(body.get("settings") as string || "{}"),
        logic: JSON.parse(body.get("logic") as string || "[]"),
        status: body.get("status") as string,
      });
      return json({ success: true, message: "Form saved!" });
    }

    if (intent === "addRule") {
      await createNotificationRule(params.id!, {
        name: body.get("ruleName") as string || undefined,
        recipient: body.get("recipient") as string,
        cc: body.get("cc") as string || undefined,
        bcc: body.get("bcc") as string || undefined,
        condition: JSON.parse(body.get("condition") as string || "{}"),
      });
      return json({ success: true });
    }

    if (intent === "deleteRule") {
      await deleteNotificationRule(body.get("ruleId") as string);
      return json({ success: true });
    }

    return json({ error: "Unknown intent" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.startsWith("PLAN_LIMIT:")) {
      return json({ planError: msg.replace("PLAN_LIMIT: ", "") }, { status: 402 });
    }
    return json({ error: msg }, { status: 500 });
  }
};

// ─── FIELD TYPES ────────────────────────────────────────────────────────────

const FIELD_TYPES = {
  basic: [
    { type: "text", label: "Text" },
    { type: "name", label: "Name" },
    { type: "email", label: "Email" },
    { type: "phone", label: "Phone" },
    { type: "number", label: "Number" },
    { type: "textarea", label: "Textarea" },
    { type: "subject", label: "Subject" },
  ],
  choice: [
    { type: "dropdown", label: "Dropdown" },
    { type: "radio", label: "Radio" },
    { type: "checkbox", label: "Checkbox" },
  ],
  advanced: [
    { type: "date", label: "Date" },
    { type: "time", label: "Time" },
    { type: "file", label: "File Upload" },
    { type: "url", label: "URL" },
    { type: "rating", label: "Rating" },
  ],
};

const DEFAULT_FIELD_ICON: Record<string, string> = {
  text: "T", name: "N", email: "@", phone: "📞", number: "#",
  textarea: "¶", subject: "S", dropdown: "▾", radio: "◉",
  checkbox: "☑", date: "📅", time: "⏰", file: "📎", url: "🔗", rating: "⭐",
};

function FieldTypeButton({ fieldType, label, onAdd }: { fieldType: string; label: string; onAdd: (type: string) => void }) {
  return (
    <button
      onClick={() => onAdd(fieldType)}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 12px", background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: "6px", cursor: "pointer", width: "100%", textAlign: "left",
        fontSize: "13px", fontWeight: 500, color: "#374151",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0f4ff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366f1"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; }}
    >
      <span style={{ width: "24px", height: "24px", background: "#eef2ff", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>
        {DEFAULT_FIELD_ICON[fieldType] || "F"}
      </span>
      {label}
    </button>
  );
}

function FieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: FormField;
  onChange: (updated: FormField) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ background: "#fff", border: "2px solid #6366f1", borderRadius: "8px", padding: "16px", marginBottom: "8px" }}>
      <InlineStack align="space-between">
        <Text as="span" variant="bodyMd" fontWeight="semibold">{field.label || field.type}</Text>
        <Button size="micro" tone="critical" icon={DeleteIcon} onClick={onDelete}>Remove</Button>
      </InlineStack>
      <div style={{ marginTop: "12px" }}>
        <FormLayout>
          <FormLayout.Group>
            <TextField
              label="Label"
              value={field.label}
              onChange={(v) => onChange({ ...field, label: v })}
              autoComplete="off"
            />
            <TextField
              label="Field Name"
              value={field.fieldName}
              onChange={(v) => onChange({ ...field, fieldName: v.replace(/\s+/g, "_").toLowerCase() })}
              autoComplete="off"
              helpText="Internal identifier"
            />
          </FormLayout.Group>
          <FormLayout.Group>
            <TextField
              label="Placeholder"
              value={field.placeholder || ""}
              onChange={(v) => onChange({ ...field, placeholder: v })}
              autoComplete="off"
            />
            <TextField
              label="Help Text"
              value={field.helpText || ""}
              onChange={(v) => onChange({ ...field, helpText: v })}
              autoComplete="off"
            />
          </FormLayout.Group>
          <InlineStack gap="400">
            <Checkbox
              label="Required"
              checked={field.required}
              onChange={(v) => onChange({ ...field, required: v })}
            />
            <Select
              label="Width"
              options={[{ label: "Full Width", value: "full" }, { label: "Half Width", value: "half" }]}
              value={field.width || "full"}
              onChange={(v) => onChange({ ...field, width: v as "full" | "half" })}
            />
          </InlineStack>
          {["dropdown", "radio", "checkbox"].includes(field.type) && (
            <div>
              <Text as="p" variant="bodyMd" fontWeight="semibold">Options</Text>
              <BlockStack gap="200">
                {(field.options || []).map((opt, i) => (
                  <InlineStack key={i} gap="200">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label=""
                        labelHidden
                        value={opt}
                        onChange={(v) => {
                          const newOpts = [...(field.options || [])];
                          newOpts[i] = v;
                          onChange({ ...field, options: newOpts });
                        }}
                        autoComplete="off"
                        placeholder={`Option ${i + 1}`}
                      />
                    </div>
                    <Button
                      size="micro"
                      tone="critical"
                      onClick={() => onChange({ ...field, options: (field.options || []).filter((_, j) => j !== i) })}
                    >
                      ×
                    </Button>
                  </InlineStack>
                ))}
                <Button
                  size="micro"
                  icon={PlusIcon}
                  onClick={() => onChange({ ...field, options: [...(field.options || []), ""] })}
                >
                  Add Option
                </Button>
              </BlockStack>
            </div>
          )}
        </FormLayout>
      </div>
    </div>
  );
}

function FormPreview({ fields, styling }: { fields: FormField[]; styling: Record<string, unknown> }) {
  const bg = (styling.backgroundColor as string) || "#fff";
  const primary = (styling.primaryColor as string) || "#6366f1";
  const btnText = (styling.buttonText2 as string) || "Send Message";
  const radius = (styling.borderRadius as string) || "8px";
  const isDark = bg === "#111827" || bg?.includes("dark");

  return (
    <div style={{ background: bg, padding: "24px", borderRadius: "12px", minHeight: "400px" }}>
      {fields.length === 0 ? (
        <div style={{ textAlign: "center", color: isDark ? "#9ca3af" : "#d1d5db", padding: "60px 20px" }}>
          <p style={{ fontSize: "14px" }}>← Add fields from the left panel</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {fields.map((field) => (
            <div key={field.id} style={{ width: field.width === "half" ? "calc(50% - 6px)" : "100%", minWidth: "140px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: isDark ? "#f3f4f6" : "#374151", marginBottom: "4px" }}>
                {field.label}{field.required && <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>}
              </label>
              {field.helpText && <p style={{ margin: "0 0 4px", fontSize: "11px", color: isDark ? "#9ca3af" : "#6b7280" }}>{field.helpText}</p>}
              {["text", "name", "email", "phone", "number", "url", "subject"].includes(field.type) && (
                <input readOnly placeholder={field.placeholder || field.label} style={{
                  width: "100%", boxSizing: "border-box", padding: "8px 12px",
                  border: `1px solid ${isDark ? "#374151" : "#d1d5db"}`,
                  borderRadius: radius, fontSize: "14px",
                  background: isDark ? "#1f2937" : "#fff",
                  color: isDark ? "#f9fafb" : "#111827", outline: "none",
                }} />
              )}
              {field.type === "textarea" && (
                <textarea readOnly placeholder={field.placeholder || field.label} rows={3} style={{
                  width: "100%", boxSizing: "border-box", padding: "8px 12px",
                  border: `1px solid ${isDark ? "#374151" : "#d1d5db"}`,
                  borderRadius: radius, fontSize: "14px", resize: "vertical",
                  background: isDark ? "#1f2937" : "#fff",
                  color: isDark ? "#f9fafb" : "#111827",
                }} />
              )}
              {field.type === "dropdown" && (
                <select style={{
                  width: "100%", padding: "8px 12px",
                  border: `1px solid ${isDark ? "#374151" : "#d1d5db"}`,
                  borderRadius: radius, fontSize: "14px",
                  background: isDark ? "#1f2937" : "#fff",
                  color: isDark ? "#f9fafb" : "#111827",
                }}>
                  <option>{field.placeholder || "Select..."}</option>
                  {(field.options || []).map((o) => <option key={o}>{o}</option>)}
                </select>
              )}
              {field.type === "rating" && (
                <div style={{ display: "flex", gap: "4px" }}>
                  {"★★★★★".split("").map((_, i) => (
                    <span key={i} style={{ fontSize: "24px", color: primary, cursor: "pointer" }}>★</span>
                  ))}
                </div>
              )}
              {field.type === "checkbox" && (
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: isDark ? "#f3f4f6" : "#374151" }}>
                  <input type="checkbox" readOnly style={{ accentColor: primary }} />
                  {field.placeholder || field.label}
                </label>
              )}
              {field.type === "file" && (
                <div style={{ border: `2px dashed ${isDark ? "#374151" : "#d1d5db"}`, borderRadius: radius, padding: "16px", textAlign: "center", fontSize: "13px", color: isDark ? "#9ca3af" : "#9ca3af" }}>
                  Click to upload or drag and drop
                </div>
              )}
            </div>
          ))}
          <div style={{ width: "100%" }}>
            <button style={{
              padding: "10px 24px",
              background: (styling.buttonColor as string) === "gradient"
                ? "linear-gradient(135deg,#667eea,#764ba2)"
                : (styling.buttonColor as string) || primary,
              color: "#fff",
              border: "none", borderRadius: radius, fontWeight: 600,
              fontSize: "14px", cursor: "pointer", width: "100%",
            }}>
              {btnText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: generate unique field ID
function uid() {
  return "f" + Math.random().toString(36).slice(2, 8);
}

function makeField(type: string): FormField {
  const defaults: Record<string, Partial<FormField>> = {
    name: { label: "Name", fieldName: "name", placeholder: "Your name" },
    email: { label: "Email", fieldName: "email", placeholder: "your@email.com" },
    phone: { label: "Phone", fieldName: "phone", placeholder: "+1 (555) 000-0000" },
    textarea: { label: "Message", fieldName: "message", placeholder: "Your message..." },
    dropdown: { label: "Select", fieldName: "select", options: ["Option 1", "Option 2", "Option 3"] },
    radio: { label: "Choose", fieldName: "choice", options: ["Option 1", "Option 2"] },
    checkbox: { label: "Check this", fieldName: "checkbox", placeholder: "I agree" },
    rating: { label: "Rating", fieldName: "rating" },
    file: { label: "Attachment", fieldName: "file" },
    date: { label: "Date", fieldName: "date" },
    time: { label: "Time", fieldName: "time" },
    url: { label: "Website URL", fieldName: "url", placeholder: "https://" },
    number: { label: "Number", fieldName: "number", placeholder: "0" },
    subject: { label: "Subject", fieldName: "subject", placeholder: "Subject" },
    text: { label: "Text", fieldName: "text", placeholder: "Enter text" },
  };
  return { id: uid(), type, label: "", fieldName: "", required: false, width: "full", ...(defaults[type] || {}) };
}

export default function FormEditor() {
  const { shop, form, isNew, notificationRules } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  // ─── Step state (new form wizard) ────────────────────────────────────────
  const [step, setStep] = useState(isNew ? 0 : 1); // 0=template, 1=builder, 2=styling, 3=settings
  const [selectedTab, setSelectedTab] = useState(0);

  // ─── Form state ──────────────────────────────────────────────────────────
  const initialFields = form ? JSON.parse(form.fields || "[]") as FormField[] : [];
  const initialStyling = form ? JSON.parse(form.styling || "{}") : {};
  const initialSettings = form ? JSON.parse(form.settings || "{}") : {};

  const [name, setName] = useState(form?.name || "");
  const [description, setDescription] = useState(form?.description || "");
  const [design, setDesign] = useState(form?.design || "classic");
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [styling, setStyling] = useState<Record<string, unknown>>(initialStyling);
  const [settings, setSettings] = useState<Record<string, unknown>>(initialSettings);
  const [status, setStatus] = useState(form?.status || "active");
  const [logic, setLogic] = useState<unknown[]>(form ? JSON.parse(form.logic || "[]") : []);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const navigation = useNavigation();
  const actionData = useActionData<{ success?: boolean; message?: string }>();
  const isSaving = navigation.state === "submitting" || navigation.state === "loading";
  const [templateSearch, setTemplateSearch] = useState("");

  // ─── New rule modal ───────────────────────────────────────────────────────
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleData, setRuleData] = useState({ recipient: "", cc: "", bcc: "", name: "" });

  const selectTemplate = (templateId: string) => {
    const tpl = getTemplate(templateId);
    if (!tpl) return;
    setDesign(tpl.design);
    setFields(tpl.fields.map((f) => ({ ...f, id: uid() })));
    setStyling(tpl.defaultStyling);
    setSettings(tpl.defaultSettings);
    if (!name) setName(tpl.name);
    setStep(1);
  };

  const addField = (type: string) => {
    setFields([...fields, makeField(type)]);
  };

  const updateField = (id: string, updated: FormField) => {
    setFields(fields.map((f) => (f.id === id ? updated : f)));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
      setFields(newFields);
    }
  };

  const handleSave = () => {
    submit(
      {
        intent: isNew ? "create" : "update",
        name,
        description,
        design,
        fields: JSON.stringify(fields),
        styling: JSON.stringify(styling),
        settings: JSON.stringify(settings),
        logic: JSON.stringify(logic),
        status,
      },
      { method: "post" }
    );
  };

  // ─── Template Selection (Step 0) ─────────────────────────────────────────
  if (step === 0) {
    return (
      <Page
        title="Choose a Template"
        subtitle="Select a design to start building your form"
        backAction={{ onAction: () => navigate("/app/forms") }}
      >
        <div style={{ marginBottom: "24px", display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <TextField
              label="Form Name"
              value={name}
              onChange={setName}
              placeholder="e.g. Contact Us"
              autoComplete="off"
            />
          </div>
          <div style={{ flex: 1 }}>
            <TextField
              label="Search Templates"
              value={templateSearch}
              onChange={setTemplateSearch}
              placeholder="Search by name, category..."
              autoComplete="off"
              clearButton
              onClearButtonClick={() => setTemplateSearch("")}
            />
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px",
        }}>
          {FORM_TEMPLATES.filter(tpl => 
            !templateSearch || 
            tpl.name.toLowerCase().includes(templateSearch.toLowerCase()) || 
            tpl.category.toLowerCase().includes(templateSearch.toLowerCase()) ||
            tpl.description.toLowerCase().includes(templateSearch.toLowerCase())
          ).map((tpl) => {
            const PLAN_LEVELS: Record<string, number> = { free: 0, simple: 1, pro: 2, vip: 3 };
            const reqLevel = PLAN_LEVELS[tpl.plan || "free"] || 0;
            const shopLevel = PLAN_LEVELS[shop.plan] || 0;
            const locked = reqLevel > shopLevel;
            
            return (
              <div
                key={tpl.id}
                onClick={() => {
                  if (locked) {
                    navigate("/app/billing");
                    return;
                  }
                  selectTemplate(tpl.id);
                }}
                style={{
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: "#fff",
                  position: "relative",
                  opacity: locked ? 0.8 : 1,
                }}
                onMouseEnter={e => {
                  if (locked) return;
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#6366f1";
                  el.style.boxShadow = "0 4px 12px rgba(99,102,241,0.15)";
                }}
                onMouseLeave={e => {
                  if (locked) return;
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#e5e7eb";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Plan Badge */}
                {(tpl.plan && tpl.plan !== "free") && (
                  <div style={{
                    position: "absolute", top: "12px", right: "12px",
                    background: tpl.plan === "vip" ? "linear-gradient(135deg,#f59e0b,#ef4444)" : 
                               tpl.plan === "pro" ? "linear-gradient(135deg,#667eea,#764ba2)" :
                               "linear-gradient(135deg,#38bdf8,#3b82f6)",
                    color: "white", fontSize: "10px", fontWeight: "bold",
                    padding: "2px 8px", borderRadius: "10px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    zIndex: 10
                  }}>
                    {tpl.plan.toUpperCase()}
                  </div>
                )}
                {/* Thumbnail Image */}
                <div style={{
                  height: "120px", borderRadius: "8px", marginBottom: "12px",
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#f8fafc", filter: locked ? "grayscale(100%) opacity(0.8)" : "none",
                  border: "1px solid #e5e7eb"
                }}>
                  <img 
                    src={`/thumbnails/${tpl.thumbnail}.svg`} 
                    alt={`${tpl.name} preview`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x200/f8fafc/64748b?text=${encodeURIComponent(tpl.name)}`;
                    }}
                  />
                </div>
                
                <InlineStack align="space-between">
                  <Badge tone="info">{tpl.category}</Badge>
                  {locked && <Badge tone="critical">Upgrade to Unlock</Badge>}
                </InlineStack>
                
                <p style={{ margin: "8px 0 4px", fontWeight: 600, fontSize: "15px", color: "#111827" }}>{tpl.name}</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{tpl.description}</p>
              </div>
            );
          })}
        </div>
        <Box paddingBlockStart="400">
          <Button onClick={() => { setDesign("classic"); setStep(1); }}>
            Start with Blank Form →
          </Button>
        </Box>
      </Page>
    );
  }

  // ─── Main Editor (Steps 1-3 as Tabs) ─────────────────────────────────────
  const tabs = [
    { id: "builder", content: "Form Builder" },
    { id: "styling", content: "Styling" },
    { id: "settings", content: "Settings" },
    { id: "logic", content: "Conditional Logic" },
  ];

  return (
    <Page
      title={isNew ? "New Form" : `Edit: ${form?.name}`}
      subtitle={form ? `ID: ${form.formId}` : ""}
      backAction={{ onAction: () => navigate("/app/forms") }}
      primaryAction={{
        content: isSaving ? "Saving..." : "Save Form",
        onAction: handleSave,
        disabled: !name || isSaving,
      }}
      secondaryActions={[
        {
          content: status === "active" ? "Disable" : "Publish",
          onAction: () => setStatus(status === "active" ? "disabled" : "active"),
        },
      ]}
    >
      <BlockStack gap="400">
        {/* Form Name */}
        <Card>
          <FormLayout>
            <FormLayout.Group>
              <TextField label="Form Name" value={name} onChange={setName} autoComplete="off" requiredIndicator />
              <TextField label="Description (optional)" value={description} onChange={setDescription} autoComplete="off" />
            </FormLayout.Group>
            {form && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <code style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>
                  {form.formId}
                </code>
                <Button
                  size="micro"
                  onClick={() => { navigator.clipboard.writeText(form.formId); shopify.toast.show("Form ID copied!"); }}
                >
                  Copy ID
                </Button>
                <Badge tone={status === "active" ? "success" : status === "disabled" ? "warning" : "info"}>
                  {status}
                </Badge>
              </div>
            )}
          </FormLayout>
        </Card>

        {/* Editor Tabs */}
        <Card padding="0">
          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
          <div style={{ padding: "20px" }}>

            {/* ── Tab 0: Builder ───────────────────────────────────────────── */}
            {selectedTab === 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 300px", gap: "16px", minHeight: "500px" }}>

                {/* Left: Field Types */}
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">Basic Fields</Text>
                  <BlockStack gap="100">
                    {FIELD_TYPES.basic.map((ft) => (
                      <FieldTypeButton key={ft.type} fieldType={ft.type} label={ft.label} onAdd={addField} />
                    ))}
                  </BlockStack>
                  <Box paddingBlockStart="300">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">Choice Fields</Text>
                  </Box>
                  <BlockStack gap="100">
                    {FIELD_TYPES.choice.map((ft) => (
                      <FieldTypeButton key={ft.type} fieldType={ft.type} label={ft.label} onAdd={addField} />
                    ))}
                  </BlockStack>
                  <Box paddingBlockStart="300">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">Advanced Fields</Text>
                  </Box>
                  <BlockStack gap="100">
                    {FIELD_TYPES.advanced.map((ft) => (
                      <FieldTypeButton key={ft.type} fieldType={ft.type} label={ft.label} onAdd={addField} />
                    ))}
                  </BlockStack>
                </div>

                {/* Center: Preview */}
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold" tone="subdued">Live Preview</Text>
                  <Box paddingBlockStart="200">
                    <FormPreview fields={fields} styling={styling} />
                  </Box>
                  {fields.length > 0 && (
                    <Box paddingBlockStart="300">
                      <Text as="p" variant="bodySm" tone="subdued">Click a field in the right panel to edit it</Text>
                    </Box>
                  )}
                </div>

                {/* Right: Field Editor */}
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">Fields ({fields.length})</Text>
                  <Box paddingBlockStart="200">
                    {fields.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed #e5e7eb", borderRadius: "8px" }}>
                        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Add fields from the left panel</p>
                      </div>
                    ) : (
                      <BlockStack gap="200">
                        {fields.map((field, index) =>
                          selectedField === field.id ? (
                            <FieldEditor
                              key={field.id}
                              field={field}
                              onChange={(updated) => updateField(field.id, updated)}
                              onDelete={() => deleteField(field.id)}
                            />
                          ) : (
                            <div
                              key={field.id}
                              onClick={() => setSelectedField(field.id)}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "10px 12px", background: "#fff",
                                border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer",
                              }}
                            >
                              <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                                {field.label || field.type} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                              </span>
                              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                <span style={{ fontSize: "11px", color: "#9ca3af", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", marginRight: "8px" }}>{field.type}</span>
                                <Button size="micro" icon={ArrowUpIcon} disabled={index === 0} onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }} />
                                <Button size="micro" icon={ArrowDownIcon} disabled={index === fields.length - 1} onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }} />
                              </div>
                            </div>
                          )
                        )}
                      </BlockStack>
                    )}
                  </Box>
                </div>
              </div>
            )}

            {/* ── Tab 1: Styling ───────────────────────────────────────────── */}
            {selectedTab === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingSm">Colors</Text>
                  <FormLayout>
                    {[
                      { key: "primaryColor", label: "Primary Color" },
                      { key: "buttonColor", label: "Button Color" },
                      { key: "backgroundColor", label: "Background" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <Text as="p" variant="bodySm">{label}</Text>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                          <input
                            type="color"
                            value={(styling[key] as string) || "#6366f1"}
                            onChange={(e) => setStyling({ ...styling, [key]: e.target.value })}
                            style={{ width: "40px", height: "32px", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer" }}
                          />
                          <TextField
                            label=""
                            labelHidden
                            value={(styling[key] as string) || ""}
                            onChange={(v) => setStyling({ ...styling, [key]: v })}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    ))}
                  </FormLayout>

                  <Divider />
                  <Text as="h3" variant="headingSm">Layout</Text>
                  <FormLayout>
                    <Select
                      label="Border Radius"
                      options={[
                        { label: "None (0px)", value: "0px" },
                        { label: "Small (4px)", value: "4px" },
                        { label: "Medium (8px)", value: "8px" },
                        { label: "Large (12px)", value: "12px" },
                        { label: "Extra Large (16px)", value: "16px" },
                        { label: "Full (9999px)", value: "9999px" },
                      ]}
                      value={(styling.borderRadius as string) || "8px"}
                      onChange={(v) => setStyling({ ...styling, borderRadius: v })}
                    />
                    <Select
                      label="Font Family"
                      options={[
                        { label: "Inter (Default)", value: "Inter, sans-serif" },
                        { label: "System Default", value: "-apple-system, sans-serif" },
                        { label: "Roboto", value: "Roboto, sans-serif" },
                        { label: "Georgia (Serif)", value: "Georgia, serif" },
                      ]}
                      value={(styling.fontFamily as string) || "Inter, sans-serif"}
                      onChange={(v) => setStyling({ ...styling, fontFamily: v })}
                    />
                  </FormLayout>

                  <Divider />
                  <Text as="h3" variant="headingSm">Button</Text>
                  <TextField
                    label="Button Text"
                    value={(styling.buttonText2 as string) || "Send Message"}
                    onChange={(v) => setStyling({ ...styling, buttonText2: v })}
                    autoComplete="off"
                  />
                </BlockStack>

                {/* Live preview */}
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold" tone="subdued">Live Preview</Text>
                  <Box paddingBlockStart="200">
                    <FormPreview fields={fields} styling={styling} />
                  </Box>
                </div>
              </div>
            )}

            {/* ── Tab 2: Settings ──────────────────────────────────────────── */}
            {selectedTab === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingSm">Submission Settings</Text>
                  <FormLayout>
                    <Select
                      label="After Submit"
                      options={[
                        { label: "Show Success Message", value: "message" },
                        { label: "Redirect to URL", value: "redirect" },
                      ]}
                      value={(settings.submitAction as string) || "message"}
                      onChange={(v) => setSettings({ ...settings, submitAction: v })}
                    />
                    {(settings.submitAction as string) !== "redirect" ? (
                      <TextField
                        label="Success Message"
                        value={(settings.successMessage as string) || "Thank you! Your message has been received."}
                        onChange={(v) => setSettings({ ...settings, successMessage: v })}
                        multiline={3}
                        autoComplete="off"
                      />
                    ) : (
                      <TextField
                        label="Redirect URL"
                        value={(settings.redirectUrl as string) || ""}
                        onChange={(v) => setSettings({ ...settings, redirectUrl: v })}
                        placeholder="https://your-store.com/thank-you"
                        autoComplete="off"
                      />
                    )}
                    <Checkbox
                      label="Enable duplicate submission protection"
                      checked={!!(settings.duplicateProtection)}
                      onChange={(v) => setSettings({ ...settings, duplicateProtection: v })}
                      helpText="Prevents the same email from submitting within 24 hours"
                    />
                    <Checkbox
                      label="Enable spam protection (honeypot)"
                      checked={(settings.spamProtection as boolean) !== false}
                      onChange={(v) => setSettings({ ...settings, spamProtection: v })}
                    />
                  </FormLayout>
                </BlockStack>

                {/* Right: Flow Config */}
                {!isNew && (
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingSm">Shopify Flow</Text>
                    <Banner tone="info">
                      <p>Connect Form fires a <strong>Form Submitted</strong> trigger in Shopify Flow after each submission.</p>
                      <p>Configure Flow automations in <strong>Shopify Admin → Flow</strong>.</p>
                    </Banner>
                  </BlockStack>
                )}
              </div>
            )}

            {/* ── Tab 3: Conditional Logic ─────────────────────────────────── */}
            {selectedTab === 3 && (
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingSm">Conditional Logic</Text>
                  <Button
                    size="micro"
                    onClick={() => setLogic([...logic as unknown[], {
                      id: uid(),
                      ifField: fields[0]?.fieldName || "",
                      operator: "is",
                      value: "",
                      action: "show",
                      targetField: fields[1]?.fieldName || "",
                    }])}
                  >
                    + Add Rule
                  </Button>
                </InlineStack>
                {(logic as Array<{id: string; ifField: string; operator: string; value: string; action: string; targetField: string}>).length === 0 ? (
                  <div style={{ padding: "40px", border: "2px dashed #e5e7eb", borderRadius: "8px", textAlign: "center" }}>
                    <p style={{ color: "#9ca3af", margin: 0 }}>No conditional logic rules yet.</p>
                    <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0" }}>
                      Rules let you show/hide fields based on other field values.
                    </p>
                  </div>
                ) : (
                  <BlockStack gap="300">
                    {(logic as Array<{id: string; ifField: string; operator: string; value: string; action: string; targetField: string}>).map((rule, idx) => (
                      <div key={rule.id} style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb" }}>
                        <InlineStack align="space-between">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">Rule {idx + 1}</Text>
                          <Button
                            size="micro"
                            tone="critical"
                            onClick={() => setLogic((logic as unknown[]).filter((_, i) => i !== idx))}
                          >
                            Delete
                          </Button>
                        </InlineStack>
                        <div style={{ marginTop: "12px" }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600 }}>IF</span>
                            <select
                              value={rule.ifField}
                              onChange={(e) => {
                                const updated = [...logic as unknown[]] as typeof logic;
                                (updated[idx] as typeof rule).ifField = e.target.value;
                                setLogic(updated);
                              }}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px" }}
                            >
                              {fields.map((f) => <option key={f.fieldName} value={f.fieldName}>{f.label}</option>)}
                            </select>
                            <select
                              value={rule.operator}
                              onChange={(e) => {
                                const updated = [...logic as unknown[]] as typeof logic;
                                (updated[idx] as typeof rule).operator = e.target.value;
                                setLogic(updated);
                              }}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px" }}
                            >
                              <option value="is">is</option>
                              <option value="is_not">is not</option>
                              <option value="contains">contains</option>
                            </select>
                            <input
                              type="text"
                              value={rule.value}
                              onChange={(e) => {
                                const updated = [...logic as unknown[]] as typeof logic;
                                (updated[idx] as typeof rule).value = e.target.value;
                                setLogic(updated);
                              }}
                              placeholder="value"
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px", minWidth: "80px" }}
                            />
                            <span style={{ fontSize: "13px", fontWeight: 600 }}>THEN</span>
                            <select
                              value={rule.action}
                              onChange={(e) => {
                                const updated = [...logic as unknown[]] as typeof logic;
                                (updated[idx] as typeof rule).action = e.target.value;
                                setLogic(updated);
                              }}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px" }}
                            >
                              <option value="show">SHOW</option>
                              <option value="hide">HIDE</option>
                              <option value="require">REQUIRE</option>
                            </select>
                            <select
                              value={rule.targetField}
                              onChange={(e) => {
                                const updated = [...logic as unknown[]] as typeof logic;
                                (updated[idx] as typeof rule).targetField = e.target.value;
                                setLogic(updated);
                              }}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px" }}
                            >
                              {fields.map((f) => <option key={f.fieldName} value={f.fieldName}>{f.label}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            )}
          </div>
        </Card>
      </BlockStack>

    </Page>
  );
}


