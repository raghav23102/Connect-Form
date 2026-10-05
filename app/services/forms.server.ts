import { prisma } from "../db.server";
import { generateFormId, generateSubmissionId } from "./idGenerator.server";
import { getPlan, canCreateForm, canReceiveSubmission } from "./plans";
import { emailService } from "./email.server";

// ─── Shop Management ────────────────────────────────────────────────────────

export async function getOrCreateShop(shopDomain: string) {
  let shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: { settings: true },
  });

  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        shopDomain,
        plan: "free",
        subscriptionStatus: "active",
        settings: {
          create: {
            storeName: shopDomain.replace(".myshopify.com", ""),
            notificationEmail: "",
          },
        },
      },
      include: { settings: true },
    });
  }

  return shop;
}

// ─── Forms ───────────────────────────────────────────────────────────────────

export async function getForms(shopId: string) {
  const forms = await prisma.form.findMany({
    where: { shopId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { submissions: true } },
    },
  });
  return forms;
}

export async function getForm(formId: string, shopId: string) {
  return prisma.form.findFirst({
    where: { id: formId, shopId },
    include: {
      notificationRules: true,
      _count: { select: { submissions: true } },
    },
  });
}

export async function getFormByPublicId(publicFormId: string) {
  return prisma.form.findUnique({
    where: { formId: publicFormId },
  });
}

export async function createForm(
  shopId: string,
  shopPlan: string,
  data: {
    name: string;
    description?: string;
    design?: string;
    fields?: unknown[];
    styling?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  }
) {
  // Enforce plan limits
  const activeForms = await prisma.form.count({
    where: { shopId, status: "active" },
  });

  if (!canCreateForm(shopPlan, activeForms)) {
    const plan = getPlan(shopPlan);
    throw new Error(
      `PLAN_LIMIT: You've reached your ${plan.name} plan limit of ${plan.maxActiveForms} active form(s). Upgrade your plan to create more forms.`
    );
  }

  // Ensure unique form ID
  let uniqueFormId = generateFormId();
  let exists = await prisma.form.findUnique({ where: { formId: uniqueFormId } });
  while (exists) {
    uniqueFormId = generateFormId();
    exists = await prisma.form.findUnique({ where: { formId: uniqueFormId } });
  }

  return prisma.form.create({
    data: {
      shopId,
      formId: uniqueFormId,
      name: data.name,
      description: data.description,
      design: data.design || "classic",
      status: "draft",
      fields: JSON.stringify(data.fields || []),
      styling: JSON.stringify(data.styling || {}),
      settings: JSON.stringify(data.settings || {}),
    },
  });
}

export async function updateForm(
  formId: string,
  shopId: string,
  data: {
    name?: string;
    description?: string;
    design?: string;
    fields?: unknown[];
    styling?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    logic?: unknown[];
    status?: string;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.design !== undefined) updateData.design = data.design;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.fields !== undefined) updateData.fields = JSON.stringify(data.fields);
  if (data.styling !== undefined) updateData.styling = JSON.stringify(data.styling);
  if (data.settings !== undefined) updateData.settings = JSON.stringify(data.settings);
  if (data.logic !== undefined) updateData.logic = JSON.stringify(data.logic);

  return prisma.form.update({
    where: { id: formId, shopId },
    data: updateData,
  });
}

export async function duplicateForm(formId: string, shopId: string, shopPlan: string) {
  const original = await getForm(formId, shopId);
  if (!original) throw new Error("Form not found");

  // Check plan limits
  const activeForms = await prisma.form.count({
    where: { shopId, status: "active" },
  });

  if (!canCreateForm(shopPlan, activeForms)) {
    const plan = getPlan(shopPlan);
    throw new Error(
      `PLAN_LIMIT: You've reached your ${plan.name} plan limit. Upgrade to duplicate more forms.`
    );
  }

  // Generate unique ID for duplicate
  let uniqueFormId = generateFormId();
  let exists = await prisma.form.findUnique({ where: { formId: uniqueFormId } });
  while (exists) {
    uniqueFormId = generateFormId();
    exists = await prisma.form.findUnique({ where: { formId: uniqueFormId } });
  }

  const duplicate = await prisma.form.create({
    data: {
      shopId,
      formId: uniqueFormId,
      name: `${original.name} (Copy)`,
      description: original.description,
      design: original.design,
      status: "draft",
      fields: original.fields,
      styling: original.styling,
      settings: original.settings,
      logic: original.logic,
    },
  });

  // Duplicate notification rules
  const rules = await prisma.notificationRule.findMany({
    where: { formId: original.id },
  });

  for (const rule of rules) {
    await prisma.notificationRule.create({
      data: {
        formId: duplicate.id,
        name: rule.name,
        condition: rule.condition,
        recipient: rule.recipient,
        cc: rule.cc,
        bcc: rule.bcc,
        enabled: rule.enabled,
      },
    });
  }

  return duplicate;
}

export async function deleteForm(formId: string, shopId: string) {
  return prisma.form.delete({ where: { id: formId, shopId } });
}

export async function setFormStatus(
  formId: string,
  shopId: string,
  status: "active" | "disabled" | "draft"
) {
  return prisma.form.update({
    where: { id: formId, shopId },
    data: { status },
  });
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export async function getSubmissions(
  shopId: string,
  options: {
    formId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const { formId, status, search, page = 1, limit = 20, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { shopId };
  if (formId) where.formId = formId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
  }

  // Search across submission data
  const submissions = await prisma.submission.findMany({
    where,
    include: { form: { select: { name: true, formId: true } } },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  // Filter by search term after fetching (SQLite limitation)
  const filtered = search
    ? submissions.filter((s) => {
        const data = JSON.parse(s.data || "{}");
        const values = Object.values(data).join(" ").toLowerCase();
        return (
          values.includes(search.toLowerCase()) ||
          s.submissionId.toLowerCase().includes(search.toLowerCase())
        );
      })
    : submissions;

  const total = await prisma.submission.count({ where });

  return { submissions: filtered, total, page, limit };
}

export async function getSubmission(submissionId: string, shopId: string) {
  return prisma.submission.findFirst({
    where: { id: submissionId, shopId },
    include: {
      form: { select: { name: true, formId: true, settings: true } },
      emailLogs: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createSubmission(
  shopDomain: string,
  publicFormId: string,
  data: Record<string, unknown>,
  ipAddress?: string
) {
  const form = await prisma.form.findUnique({ where: { formId: publicFormId } });
  if (!form) throw new Error("Form not found");
  if (form.status !== "active") throw new Error("Form is not active");

  const shop = await prisma.shop.findUnique({ where: { id: form.shopId } });
  if (!shop) throw new Error("Shop not found");

  // Check submission limits for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const submissionsThisMonth = await prisma.submission.count({
    where: { shopId: shop.id, createdAt: { gte: startOfMonth } },
  });

  if (!canReceiveSubmission(shop.plan, submissionsThisMonth)) {
    throw new Error("SUBMISSION_LIMIT: This form is temporarily unavailable.");
  }

  const submissionId = generateSubmissionId(publicFormId);
  const category = (data.category as string) || (data.subject as string) || "";

  const submission = await prisma.submission.create({
    data: {
      shopId: shop.id,
      formId: form.id,
      submissionId,
      data: JSON.stringify(data),
      category,
      status: "new",
      ipAddress,
    },
  });

  // Fire & forget notifications
  processSubmissionNotifications(submission.id, shop.id).catch(console.error);

  return submission;
}

export async function updateSubmissionStatus(
  submissionId: string,
  shopId: string,
  status: string
) {
  return prisma.submission.update({
    where: { id: submissionId, shopId },
    data: { status },
  });
}

export async function deleteSubmission(submissionId: string, shopId: string) {
  return prisma.submission.delete({ where: { id: submissionId, shopId } });
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function processSubmissionNotifications(submissionId: string, shopId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      form: { include: { notificationRules: true } },
      shop: { include: { settings: true } },
    },
  });
  if (!submission) return;

  const submissionData = JSON.parse(submission.data || "{}") as Record<string, string>;
  const settings = submission.shop.settings;
  const formSettings = JSON.parse(submission.form.settings || "{}") as Record<string, unknown>;

  const submittedAt = new Date(submission.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Default notification email
  const notificationEmail =
    (formSettings.notificationEmail as string) ||
    settings?.notificationEmail ||
    "";

  if (notificationEmail) {
    const html = emailService.buildNotificationEmail({
      formName: submission.form.name,
      submissionId: submission.submissionId,
      submittedAt,
      fields: submissionData,
      storeName: settings?.storeName || undefined,
    });

    const ccEmails = (formSettings.cc as string) || "";
    const bccEmails = (formSettings.bcc as string) || "";

    const result = await emailService.send({
      to: notificationEmail,
      cc: ccEmails || undefined,
      bcc: bccEmails || undefined,
      subject: `New Form Submission — ${submission.form.name}`,
      html,
    });

    await prisma.emailLog.create({
      data: {
        shopId,
        submissionId,
        recipient: notificationEmail,
        type: "notification",
        status: result.success ? "sent" : "failed",
        error: result.error,
        sentAt: result.success ? new Date() : undefined,
      },
    });
  }

  // 2. Routing rules
  for (const rule of submission.form.notificationRules) {
    if (!rule.enabled) continue;
    const condition = JSON.parse(rule.condition || "{}") as Record<string, string>;
    let matches = true;

    if (condition.field && condition.value) {
      const fieldValue = submissionData[condition.field] || "";
      matches = fieldValue.toLowerCase() === condition.value.toLowerCase();
    }

    if (matches) {
      const html = emailService.buildNotificationEmail({
        formName: submission.form.name,
        submissionId: submission.submissionId,
        submittedAt,
        fields: submissionData,
        storeName: settings?.storeName || undefined,
      });

      const result = await emailService.send({
        to: rule.recipient,
        cc: rule.cc || undefined,
        bcc: rule.bcc || undefined,
        subject: `[Routed] New ${submission.form.name} Submission`,
        html,
      });

      await prisma.emailLog.create({
        data: {
          shopId,
          submissionId,
          recipient: rule.recipient,
          type: "routing",
          status: result.success ? "sent" : "failed",
          error: result.error,
          sentAt: result.success ? new Date() : undefined,
        },
      });
    }
  }

  // 3. Auto-response
  const autoResponseEnabled =
    (formSettings.autoResponseEnabled as boolean) ||
    settings?.autoResponseEnabled;
  const customerEmail =
    submissionData.email || submissionData.Email || submissionData["Email Address"] || "";

  if (autoResponseEnabled && customerEmail) {
    const subject =
      (formSettings.autoResponseSubject as string) ||
      settings?.autoResponseSubject ||
      "We received your message";
    const body =
      (formSettings.autoResponseBody as string) ||
      settings?.autoResponseBody ||
      "Thank you for contacting us.";

    const html = emailService.buildAutoResponseEmail({
      customerEmail,
      customerName: submissionData.name || submissionData.Name || undefined,
      storeName: settings?.storeName || undefined,
      subject,
      body,
      senderName: settings?.senderName,
      replyToEmail: settings?.replyToEmail || notificationEmail || undefined,
    });

    const result = await emailService.send({
      to: customerEmail,
      subject,
      html,
      replyTo: settings?.replyToEmail || notificationEmail || undefined,
    });

    await prisma.emailLog.create({
      data: {
        shopId,
        submissionId,
        recipient: customerEmail,
        type: "auto-response",
        status: result.success ? "sent" : "failed",
        error: result.error,
        sentAt: result.success ? new Date() : undefined,
      },
    });
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getDashboardStats(shopId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalForms, activeForms, totalSubmissions, thisMonthSubmissions] =
    await Promise.all([
      prisma.form.count({ where: { shopId } }),
      prisma.form.count({ where: { shopId, status: "active" } }),
      prisma.submission.count({ where: { shopId } }),
      prisma.submission.count({
        where: { shopId, createdAt: { gte: startOfMonth } },
      }),
    ]);

  return { totalForms, activeForms, totalSubmissions, thisMonthSubmissions };
}

export async function getRecentForms(shopId: string, limit = 5) {
  return prisma.form.findMany({
    where: { shopId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { _count: { select: { submissions: true } } },
  });
}

// ─── Notification Rules ───────────────────────────────────────────────────────

export async function getNotificationRules(formId: string) {
  return prisma.notificationRule.findMany({ where: { formId } });
}

export async function createNotificationRule(
  formId: string,
  data: {
    name?: string;
    condition?: Record<string, string>;
    recipient: string;
    cc?: string;
    bcc?: string;
  }
) {
  return prisma.notificationRule.create({
    data: {
      formId,
      name: data.name,
      condition: JSON.stringify(data.condition || {}),
      recipient: data.recipient,
      cc: data.cc,
      bcc: data.bcc,
    },
  });
}

export async function deleteNotificationRule(ruleId: string) {
  return prisma.notificationRule.delete({ where: { id: ruleId } });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(shopId: string) {
  return prisma.shopSettings.findUnique({ where: { shopId } });
}

export async function updateSettings(
  shopId: string,
  data: Partial<{
    storeName: string;
    notificationEmail: string;
    senderName: string;
    replyToEmail: string;
    autoResponseEnabled: boolean;
    autoResponseSubject: string;
    autoResponseBody: string;
    submissionRetentionDays: number;
    spamProtection: boolean;
    duplicateProtection: boolean;
    defaultDesign: string;
    defaultButtonText: string;
    defaultSuccessMessage: string;
  }>
) {
  return prisma.shopSettings.upsert({
    where: { shopId },
    create: { shopId, ...data },
    update: data,
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportSubmissionsCSV(
  shopId: string,
  options: { formId?: string; startDate?: Date; endDate?: Date; ids?: string[] } = {}
): Promise<string> {
  const where: Record<string, unknown> = { shopId };
  if (options.formId) where.formId = options.formId;
  if (options.ids?.length) where.id = { in: options.ids };
  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate)
      (where.createdAt as Record<string, unknown>).gte = options.startDate;
    if (options.endDate)
      (where.createdAt as Record<string, unknown>).lte = options.endDate;
  }

  const submissions = await prisma.submission.findMany({
    where,
    include: { form: { select: { name: true, formId: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!submissions.length) return "No submissions found";

  // Collect all unique field keys
  const allKeys = new Set<string>();
  const parsedData = submissions.map((s) => {
    const data = JSON.parse(s.data || "{}") as Record<string, string>;
    Object.keys(data).forEach((k) => allKeys.add(k));
    return { ...s, parsedData: data };
  });

  const headers = [
    "Submission ID",
    "Form",
    "Status",
    "Category",
    "Submitted At",
    ...Array.from(allKeys),
  ];

  const rows = parsedData.map((s) => {
    const base = [
      s.submissionId,
      s.form.name,
      s.status,
      s.category || "",
      new Date(s.createdAt).toISOString(),
    ];
    const fields = Array.from(allKeys).map((k) => s.parsedData[k] || "");
    return [...base, ...fields]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
