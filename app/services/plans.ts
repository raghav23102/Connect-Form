// Plan configuration — single source of truth for all plan limits
export const PLANS = {
  free: {
    id: "free",
    name: "FREE",
    price: 0,
    maxActiveForms: 1,
    maxSubmissionsPerMonth: 50,
    features: [
      "1 active form",
      "50 monthly submissions",
      "Basic templates",
      "Basic fields",
      "Form ID",
      "Basic email notification",
      "Submission management",
    ],
    allowConditionalLogic: false,
    allowFileUploads: false,
    allowMultipleRecipients: false,
    allowEmailRouting: false,
    allowForwardSubmission: false,
    allowAdvancedStyling: false,
    allowShopifyFlow: false,
    allowAutoResponse: false,
    allowExport: false,
    allowAllTemplates: false,
  },
  simple: {
    id: "simple",
    name: "SIMPLE",
    price: 2.0,
    maxActiveForms: 3,
    maxSubmissionsPerMonth: 500,
    features: [
      "Up to 3 active forms",
      "500 monthly submissions",
      "All basic templates",
      "Custom fields",
      "Custom labels",
      "Styling customization",
      "Email notifications",
      "Auto-response",
      "Export submissions",
    ],
    allowConditionalLogic: false,
    allowFileUploads: false,
    allowMultipleRecipients: false,
    allowEmailRouting: false,
    allowForwardSubmission: false,
    allowAdvancedStyling: true,
    allowShopifyFlow: false,
    allowAutoResponse: true,
    allowExport: true,
    allowAllTemplates: true,
  },
  pro: {
    id: "pro",
    name: "PRO",
    price: 4.99,
    maxActiveForms: 10,
    maxSubmissionsPerMonth: 2000,
    features: [
      "Up to 10 active forms",
      "2,000 monthly submissions",
      "All templates",
      "Conditional logic",
      "File uploads",
      "Multiple recipients",
      "Email routing",
      "Forward submission",
      "Advanced styling",
      "Advanced submission management",
      "Shopify Flow integration",
    ],
    allowConditionalLogic: true,
    allowFileUploads: true,
    allowMultipleRecipients: true,
    allowEmailRouting: true,
    allowForwardSubmission: true,
    allowAdvancedStyling: true,
    allowShopifyFlow: true,
    allowAutoResponse: true,
    allowExport: true,
    allowAllTemplates: true,
  },
  vip: {
    id: "vip",
    name: "VIP",
    price: 9.99,
    maxActiveForms: Infinity,
    maxSubmissionsPerMonth: Infinity,
    features: [
      "Unlimited forms",
      "Unlimited submissions",
      "All templates",
      "All fields",
      "Advanced conditional logic",
      "File uploads",
      "Email routing",
      "Multiple recipients",
      "Forwarding",
      "Shopify Flow",
      "Advanced automation",
      "Priority support",
    ],
    allowConditionalLogic: true,
    allowFileUploads: true,
    allowMultipleRecipients: true,
    allowEmailRouting: true,
    allowForwardSubmission: true,
    allowAdvancedStyling: true,
    allowShopifyFlow: true,
    allowAutoResponse: true,
    allowExport: true,
    allowAllTemplates: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

export function getPlan(planId: string): Plan {
  return PLANS[planId as PlanId] || PLANS.free;
}

export function canCreateForm(
  currentPlan: string,
  currentActiveForms: number
): boolean {
  const plan = getPlan(currentPlan);
  if (plan.maxActiveForms === Infinity) return true;
  return currentActiveForms < plan.maxActiveForms;
}

export function canReceiveSubmission(
  currentPlan: string,
  submissionsThisMonth: number
): boolean {
  const plan = getPlan(currentPlan);
  if (plan.maxSubmissionsPerMonth === Infinity) return true;
  return submissionsThisMonth < plan.maxSubmissionsPerMonth;
}
