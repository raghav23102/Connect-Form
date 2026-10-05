export interface FormField {
  id: string;
  type: string;
  label: string;
  fieldName: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  validation?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  width?: "full" | "half";
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  design: string;
  category: string;
  thumbnail: string;
  fields: FormField[];
  defaultStyling: Record<string, unknown>;
  defaultSettings: Record<string, unknown>;
  plan?: 'free' | 'simple' | 'pro' | 'vip';
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "classic",
    name: "Classic Contact",
    description: "A timeless contact form with all essential fields",
    design: "classic",
    category: "Contact",
    thumbnail: "classic",
    plan: "free",
    fields: [
      { id: "f1", type: "name", label: "Name", fieldName: "name", placeholder: "Your full name", required: true, width: "full" },
      { id: "f2", type: "email", label: "Email", fieldName: "email", placeholder: "your@email.com", required: true, width: "full" },
      { id: "f3", type: "phone", label: "Phone", fieldName: "phone", placeholder: "+1 (555) 000-0000", required: false, width: "half" },
      { id: "f4", type: "text", label: "Subject", fieldName: "subject", placeholder: "How can we help?", required: true, width: "half" },
      { id: "f5", type: "textarea", label: "Message", fieldName: "message", placeholder: "Tell us more...", required: true, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#6366f1",
      buttonColor: "#6366f1",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send Message",
    },
    defaultSettings: {
      successMessage: "Thank you! Your message has been received.",
      redirectUrl: "",
      submitAction: "message",
    },
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Clean and minimal with generous white space",
    design: "modern-minimal",
    category: "Contact",
    thumbnail: "modern-minimal",
    plan: "simple",
    fields: [
      { id: "f1", type: "name", label: "Full Name", fieldName: "name", placeholder: "John Doe", required: true, width: "full" },
      { id: "f2", type: "email", label: "Email Address", fieldName: "email", placeholder: "john@example.com", required: true, width: "full" },
      { id: "f3", type: "textarea", label: "Message", fieldName: "message", placeholder: "What's on your mind?", required: true, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#0f172a",
      buttonColor: "#0f172a",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "4px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send →",
    },
    defaultSettings: {
      successMessage: "Message sent. We'll be in touch.",
      submitAction: "message",
    },
  },
  {
    id: "split-contact",
    name: "Split Contact",
    description: "Contact info on left, form on right — great for landing pages",
    design: "split-contact",
    category: "Contact",
    thumbnail: "split-contact",
    plan: "simple",
    fields: [
      { id: "f1", type: "name", label: "Name", fieldName: "name", placeholder: "Your name", required: true, width: "half" },
      { id: "f2", type: "email", label: "Email", fieldName: "email", placeholder: "Email address", required: true, width: "half" },
      { id: "f3", type: "text", label: "Subject", fieldName: "subject", placeholder: "Subject", required: false, width: "full" },
      { id: "f4", type: "textarea", label: "Message", fieldName: "message", placeholder: "Your message...", required: true, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#6366f1",
      buttonColor: "#6366f1",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send Message",
      sidebarColor: "#6366f1",
    },
    defaultSettings: {
      successMessage: "Thank you for reaching out!",
      submitAction: "message",
    },
  },
  {
    id: "card-contact",
    name: "Card Contact",
    description: "Modern card design with subtle shadow and rounded corners",
    design: "card-contact",
    category: "Contact",
    thumbnail: "card-contact",
    plan: "simple",
    fields: [
      { id: "f1", type: "name", label: "Name", fieldName: "name", placeholder: "Your name", required: true, width: "half" },
      { id: "f2", type: "email", label: "Email", fieldName: "email", placeholder: "Email address", required: true, width: "half" },
      { id: "f3", type: "text", label: "Subject", fieldName: "subject", placeholder: "How can we help?", required: false, width: "full" },
      { id: "f4", type: "textarea", label: "Message", fieldName: "message", placeholder: "Message...", required: true, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#8b5cf6",
      buttonColor: "#8b5cf6",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send Message",
    },
    defaultSettings: {
      successMessage: "Thank you! We'll get back to you soon.",
      submitAction: "message",
    },
  },
  {
    id: "floating-label",
    name: "Floating Label",
    description: "Modern floating label animation for a premium feel",
    design: "floating-label",
    category: "Contact",
    thumbnail: "floating-label",
    plan: "pro",
    fields: [
      { id: "f1", type: "name", label: "Full Name", fieldName: "name", placeholder: "Full Name", required: true, width: "full" },
      { id: "f2", type: "email", label: "Email Address", fieldName: "email", placeholder: "Email Address", required: true, width: "full" },
      { id: "f3", type: "phone", label: "Phone Number", fieldName: "phone", placeholder: "Phone Number", required: false, width: "full" },
      { id: "f4", type: "textarea", label: "Message", fieldName: "message", placeholder: "Message", required: true, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#0ea5e9",
      buttonColor: "#0ea5e9",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send Message",
    },
    defaultSettings: {
      successMessage: "Thank you! Your message has been sent.",
      submitAction: "message",
    },
  },
  {
    id: "dark-contact",
    name: "Dark Contact",
    description: "Professional dark theme for modern brands",
    design: "dark-contact",
    category: "Contact",
    thumbnail: "dark-contact",
    plan: "pro",
    fields: [
      { id: "f1", type: "name", label: "Name", fieldName: "name", placeholder: "Your name", required: true, width: "half" },
      { id: "f2", type: "email", label: "Email", fieldName: "email", placeholder: "Email address", required: true, width: "half" },
      { id: "f3", type: "text", label: "Subject", fieldName: "subject", placeholder: "Subject", required: false, width: "full" },
      { id: "f4", type: "textarea", label: "Message", fieldName: "message", placeholder: "Your message...", required: true, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#a78bfa",
      buttonColor: "#7c3aed",
      buttonText: "#ffffff",
      backgroundColor: "#111827",
      textColor: "#f9fafb",
      borderRadius: "10px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send Message",
    },
    defaultSettings: {
      successMessage: "Message received. We'll be in touch soon.",
      submitAction: "message",
    },
  },
  {
    id: "customer-support",
    name: "Customer Support",
    description: "Comprehensive support form with issue categorization",
    design: "premium-gradient",
    category: "Support",
    thumbnail: "customer-support",
    plan: "pro",
    fields: [
      { id: "f1", type: "name", label: "Name", fieldName: "name", placeholder: "Your name", required: true, width: "half" },
      { id: "f2", type: "email", label: "Email", fieldName: "email", placeholder: "Email address", required: true, width: "half" },
      { id: "f3", type: "text", label: "Order Number", fieldName: "orderNumber", placeholder: "#1001", required: false, width: "half" },
      { id: "f4", type: "dropdown", label: "Issue Category", fieldName: "category", placeholder: "Select issue", required: true, width: "half",
        options: ["Returns & Refunds", "Shipping & Delivery", "Product Question", "Technical Issue", "Billing", "Other"] },
      { id: "f5", type: "textarea", label: "Describe Your Issue", fieldName: "message", placeholder: "Please describe your issue in detail...", required: true, width: "full" },
      { id: "f6", type: "file", label: "Attachment (Optional)", fieldName: "attachment", required: false, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#0ea5e9",
      buttonColor: "#0ea5e9",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Submit Support Request",
    },
    defaultSettings: {
      successMessage: "Thank you! Your support request has been submitted. We'll respond within 24 hours.",
      submitAction: "message",
    },
  },
  {
    id: "product-inquiry",
    name: "Product Inquiry",
    description: "Perfect for product questions and wholesale inquiries",
    design: "split-contact",
    category: "Inquiry",
    thumbnail: "product-inquiry",
    plan: "pro",
    fields: [
      { id: "f1", type: "name", label: "Name", fieldName: "name", placeholder: "Your name", required: true, width: "half" },
      { id: "f2", type: "email", label: "Email", fieldName: "email", placeholder: "Email address", required: true, width: "half" },
      { id: "f3", type: "text", label: "Product Name / SKU", fieldName: "product", placeholder: "Product name or SKU", required: false, width: "half" },
      { id: "f4", type: "phone", label: "Phone", fieldName: "phone", placeholder: "+1 (555) 000-0000", required: false, width: "half" },
      { id: "f5", type: "text", label: "Your Question", fieldName: "question", placeholder: "What would you like to know?", required: true, width: "full" },
      { id: "f6", type: "textarea", label: "Additional Details", fieldName: "message", placeholder: "Any additional details...", required: false, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#f59e0b",
      buttonColor: "#f59e0b",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send Inquiry",
    },
    defaultSettings: {
      successMessage: "Thank you for your inquiry! We'll get back to you shortly.",
      submitAction: "message",
    },
  },
  {
    id: "feedback",
    name: "Feedback Form",
    description: "Collect customer feedback and suggestions",
    design: "card-contact",
    category: "Feedback",
    thumbnail: "feedback",
    plan: "pro",
    fields: [
      { id: "f1", type: "name", label: "Name", fieldName: "name", placeholder: "Your name", required: false, width: "half" },
      { id: "f2", type: "email", label: "Email", fieldName: "email", placeholder: "Email (optional)", required: false, width: "half" },
      { id: "f3", type: "rating", label: "Overall Rating", fieldName: "rating", required: true, width: "full" },
      { id: "f4", type: "textarea", label: "Your Feedback", fieldName: "feedback", placeholder: "Share your experience...", required: true, width: "full" },
      { id: "f5", type: "textarea", label: "Suggestions for Improvement", fieldName: "suggestions", placeholder: "Any suggestions?", required: false, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#10b981",
      buttonColor: "#10b981",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Submit Feedback",
    },
    defaultSettings: {
      successMessage: "Thank you for your feedback! We really appreciate it.",
      submitAction: "message",
    },
  },
  {
    id: "business-inquiry",
    name: "Business Inquiry",
    description: "B2B inquiry form for business and wholesale customers",
    design: "split-contact",
    category: "Business",
    thumbnail: "business-inquiry",
    plan: "vip",
    fields: [
      { id: "f1", type: "name", label: "Full Name", fieldName: "name", placeholder: "Your name", required: true, width: "half" },
      { id: "f2", type: "text", label: "Company Name", fieldName: "company", placeholder: "Company name", required: true, width: "half" },
      { id: "f3", type: "email", label: "Business Email", fieldName: "email", placeholder: "work@company.com", required: true, width: "half" },
      { id: "f4", type: "phone", label: "Phone", fieldName: "phone", placeholder: "+1 (555) 000-0000", required: false, width: "half" },
      { id: "f5", type: "dropdown", label: "Business Type", fieldName: "businessType", required: true, width: "full",
        options: ["Retailer", "Wholesaler", "Distributor", "Brand/Manufacturer", "Agency", "Other"] },
      { id: "f6", type: "textarea", label: "Message", fieldName: "message", placeholder: "Tell us about your business needs...", required: true, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#1e40af",
      buttonColor: "#1e40af",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Submit Inquiry",
      sidebarColor: "#1e40af",
    },
    defaultSettings: {
      successMessage: "Thank you for your business inquiry. Our team will contact you within 1-2 business days.",
      submitAction: "message",
    },
  },
  {
    id: "newsletter-contact",
    name: "Newsletter + Contact",
    description: "Combined contact form with newsletter subscription option",
    design: "modern-minimal",
    category: "Newsletter",
    thumbnail: "newsletter-contact",
    plan: "vip",
    fields: [
      { id: "f1", type: "name", label: "Name", fieldName: "name", placeholder: "Your name", required: true, width: "half" },
      { id: "f2", type: "email", label: "Email", fieldName: "email", placeholder: "Email address", required: true, width: "half" },
      { id: "f3", type: "textarea", label: "Message (Optional)", fieldName: "message", placeholder: "How can we help?", required: false, width: "full" },
      { id: "f4", type: "checkbox", label: "Subscribe to our newsletter for exclusive deals and updates", fieldName: "newsletter", required: false, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#ec4899",
      buttonColor: "#ec4899",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send & Subscribe",
    },
    defaultSettings: {
      successMessage: "Thanks! You're all set. Watch your inbox for our newsletter.",
      submitAction: "message",
    },
  },
  {
    id: "premium-gradient",
    name: "Premium Gradient",
    description: "Stunning gradient design for high-impact forms",
    design: "premium-gradient",
    category: "Premium",
    thumbnail: "premium-gradient",
    plan: "vip",
    fields: [
      { id: "f1", type: "name", label: "Full Name", fieldName: "name", placeholder: "Your full name", required: true, width: "full" },
      { id: "f2", type: "email", label: "Email Address", fieldName: "email", placeholder: "your@email.com", required: true, width: "full" },
      { id: "f3", type: "phone", label: "Phone (Optional)", fieldName: "phone", placeholder: "+1 (555) 000-0000", required: false, width: "full" },
      { id: "f4", type: "text", label: "Subject", fieldName: "subject", placeholder: "How can we help?", required: true, width: "full" },
      { id: "f5", type: "textarea", label: "Message", fieldName: "message", placeholder: "Tell us about your inquiry...", required: true, width: "full" },
    ],
    defaultStyling: {
      primaryColor: "#7c3aed",
      buttonColor: "gradient",
      buttonText: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      fontFamily: "Inter, sans-serif",
      buttonText2: "Send Message ✨",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    defaultSettings: {
      successMessage: "✨ Thank you! Your message has been received. We'll be in touch soon.",
      submitAction: "message",
    },
  },
];

export function getTemplate(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find((t) => t.id === id);
}
