import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <main className={styles.hero}>
        <h1 className={styles.heading}>
          Forms that <span className={styles.headingHighlight}>Convert</span>
        </h1>
        <p className={styles.text}>
          Connect Form is the lightweight, affordable, and easy-to-use form builder for Shopify.
          Create beautiful contact forms, lead captures, and surveys in minutes without writing code.
        </p>

        {showForm && (
          <div className={styles.loginCard}>
            <h2 className={styles.loginCardTitle}>Merchant Login</h2>
            <p className={styles.loginCardDesc}>Enter your Shopify store domain to access Connect Form.</p>
            
            <Form className={styles.form} method="post" action="/auth/login">
              <label className={styles.label}>
                Store Domain
                <div className={styles.inputGroup}>
                  <input 
                    className={styles.input} 
                    type="text" 
                    name="shop" 
                    placeholder="my-shop-domain"
                    autoComplete="off"
                    required
                  />
                  <div className={styles.inputSuffix}>.myshopify.com</div>
                </div>
              </label>
              <button className={styles.button} type="submit">
                Log in to Dashboard
              </button>
            </Form>
          </div>
        )}

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Create & Customize</h3>
            <p className={styles.featureDesc}>
              Build contact, support, or wholesale forms exactly how you want them using our intuitive drag-and-drop builder.
            </p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Collect & Forward</h3>
            <p className={styles.featureDesc}>
              Seamlessly collect customer inquiries and automatically forward them to your support email or helpdesk.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Shopify Native</h3>
            <p className={styles.featureDesc}>
              Built exclusively for Shopify. Integrates perfectly with your store's theme via App Blocks with zero impact on page speed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
