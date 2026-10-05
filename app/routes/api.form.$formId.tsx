import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createSubmission } from "../services/forms.server";
import { prisma } from "../db.server";

// CORS headers for storefront requests
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const formId = params.formId;
  if (!formId) return json({ error: "Missing form ID" }, { status: 400, headers: CORS_HEADERS });

  const form = await prisma.form.findUnique({
    where: { formId },
    select: {
      formId: true, name: true, design: true,
      status: true, fields: true, styling: true,
      settings: true, logic: true,
    },
  });

  if (!form) return json({ error: "Form not found" }, { status: 404, headers: CORS_HEADERS });
  if (form.status !== "active") return json({ error: "Form is not active" }, { status: 403, headers: CORS_HEADERS });

  return json({
    form: {
      ...form,
      fields: JSON.parse(form.fields || "[]"),
      styling: JSON.parse(form.styling || "{}"),
      settings: JSON.parse(form.settings || "{}"),
      logic: JSON.parse(form.logic || "[]"),
    },
  }, { headers: CORS_HEADERS });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const formId = params.formId;
  if (!formId) return json({ error: "Missing form ID" }, { status: 400, headers: CORS_HEADERS });

  try {
    const contentType = request.headers.get("Content-Type") || "";
    let data: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      // Honeypot check
      if (formData.get("_hp_email")) {
        return json({ success: true }, { headers: CORS_HEADERS }); // Silent reject
      }
      formData.forEach((value, key) => {
        if (key !== "_hp_email") data[key] = value;
      });
    }

    const ipAddress = request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      "unknown";

    // Get shop domain from form
    const form = await prisma.form.findUnique({
      where: { formId },
      include: { shop: { include: { settings: true } } },
    });

    if (!form) return json({ error: "Form not found" }, { status: 404, headers: CORS_HEADERS });

    // Duplicate protection
    if (form.shop.settings?.duplicateProtection) {
      const email = data.email as string || "";
      if (email) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentSubmission = await prisma.submission.findFirst({
          where: {
            formId: form.id,
            createdAt: { gte: oneDayAgo },
            data: { contains: email },
          },
        });
        if (recentSubmission) {
          const formSettings = JSON.parse(form.settings || "{}") as Record<string, string>;
          return json({
            success: true,
            message: formSettings.successMessage || "Thank you! Your message has been received.",
          }, { headers: CORS_HEADERS });
        }
      }
    }

    const submission = await createSubmission(
      form.shop.shopDomain,
      formId,
      data,
      ipAddress
    );

    const formSettings = JSON.parse(form.settings || "{}") as Record<string, string>;
    return json({
      success: true,
      submissionId: submission.submissionId,
      message: formSettings.successMessage || "Thank you! Your message has been received.",
      redirectUrl: formSettings.submitAction === "redirect" ? formSettings.redirectUrl : undefined,
    }, { headers: CORS_HEADERS });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.startsWith("SUBMISSION_LIMIT")) {
      return json({ error: "This form is temporarily unavailable." }, { status: 429, headers: CORS_HEADERS });
    }
    console.error("[Form Submit Error]", err);
    return json({ error: "Something went wrong. Please try again." }, { status: 500, headers: CORS_HEADERS });
  }
};
