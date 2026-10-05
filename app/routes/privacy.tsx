import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy | Connect Form" },
    { name: "description", content: "Privacy Policy for the Connect Form Shopify App" },
  ];
};

export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#374151",
      lineHeight: "1.6"
    }}>
      <h1 style={{ color: "#111827", marginBottom: "24px" }}>Privacy Policy for Connect Form</h1>
      
      <p style={{ marginBottom: "24px" }}><strong>Last Updated: October 2026</strong></p>

      <p style={{ marginBottom: "24px" }}>
        This Privacy Policy describes how your personal information is collected, used, and shared when you install or use the Connect Form app in connection with your Shopify-supported store.
      </p>

      <h2 style={{ color: "#111827", marginTop: "32px", marginBottom: "16px" }}>1. Personal Information the App Collects</h2>
      <p style={{ marginBottom: "24px" }}>
        When you install the App, we are automatically able to access certain types of information from your Shopify account:
      </p>
      <ul style={{ marginBottom: "24px", paddingLeft: "24px" }}>
        <li><strong>Shop Information:</strong> We collect your shop domain to uniquely identify your store and provide the App's core functionality.</li>
        <li><strong>Form Submissions:</strong> We store the data that your customers submit through the forms you create using our App. This data is stored securely and is only accessible by you via the App dashboard.</li>
      </ul>

      <h2 style={{ color: "#111827", marginTop: "32px", marginBottom: "16px" }}>2. How Do We Use Your Personal Information?</h2>
      <p style={{ marginBottom: "24px" }}>
        We use the personal information we collect from you and your customers in order to provide the Service and to operate the App. Specifically:
      </p>
      <ul style={{ marginBottom: "24px", paddingLeft: "24px" }}>
        <li>To render forms on your Shopify storefront.</li>
        <li>To capture, store, and display form submissions in your App dashboard.</li>
        <li>To communicate with you (e.g., technical support).</li>
      </ul>

      <h2 style={{ color: "#111827", marginTop: "32px", marginBottom: "16px" }}>3. Sharing Your Personal Information</h2>
      <p style={{ marginBottom: "24px" }}>
        We do not sell, trade, or otherwise transfer your or your customers' personally identifiable information to outside parties. We only share information with third parties (such as hosting providers) when it is strictly necessary to provide the App's services, or to comply with applicable laws and regulations.
      </p>

      <h2 style={{ color: "#111827", marginTop: "32px", marginBottom: "16px" }}>4. Data Retention and Deletion</h2>
      <p style={{ marginBottom: "24px" }}>
        We retain form submission data for as long as you have the App installed. If you uninstall the App, we will automatically delete all of your shop's data and stored submissions within 48 hours in accordance with Shopify's data privacy requirements.
      </p>

      <h2 style={{ color: "#111827", marginTop: "32px", marginBottom: "16px" }}>5. Your Rights (GDPR & CCPA)</h2>
      <p style={{ marginBottom: "24px" }}>
        If you are a European resident or a resident of California, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. 
        Because we process data on your behalf as a Shopify Merchant, any customer data requests should be directed to you first. We provide automated webhooks to process Shopify's data redaction and deletion requests automatically on your behalf.
      </p>

      <h2 style={{ color: "#111827", marginTop: "32px", marginBottom: "16px" }}>6. Changes</h2>
      <p style={{ marginBottom: "24px" }}>
        We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons.
      </p>

      <h2 style={{ color: "#111827", marginTop: "32px", marginBottom: "16px" }}>7. Contact Us</h2>
      <p style={{ marginBottom: "24px" }}>
        For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at <strong>support@connectform.vercel.app</strong>.
      </p>
    </div>
  );
}
