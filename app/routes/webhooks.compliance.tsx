import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, payload, shop } = await authenticate.webhook(request);

  const shopRecord = await prisma.shop.findUnique({ where: { shopDomain: shop } });

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // Return customer data - find submissions with customer email
      // In production, you'd send this data to the provided endpoint
      console.log(`[Compliance] Data request for shop ${shop}`, payload);
      break;

    case "CUSTOMERS_REDACT":
      // Anonymize customer data in submissions
      if (shopRecord) {
        const customerEmail = (payload as {email?: string}).email;
        if (customerEmail) {
          const submissions = await prisma.submission.findMany({
            where: { shopId: shopRecord.id, data: { contains: customerEmail } },
          });
          for (const submission of submissions) {
            const data = JSON.parse(submission.data || "{}") as Record<string, string>;
            // Replace email with anonymized version
            Object.keys(data).forEach((k) => {
              if (data[k] === customerEmail) {
                data[k] = "[redacted]";
              }
            });
            await prisma.submission.update({
              where: { id: submission.id },
              data: { data: JSON.stringify(data) },
            });
          }
        }
      }
      break;

    case "SHOP_REDACT":
      // Delete all shop data 48 hours after uninstall
      if (shopRecord) {
        await prisma.submission.deleteMany({ where: { shopId: shopRecord.id } });
        await prisma.form.deleteMany({ where: { shopId: shopRecord.id } });
        await prisma.emailLog.deleteMany({ where: { shopId: shopRecord.id } });
        await prisma.subscription.deleteMany({ where: { shopId: shopRecord.id } });
        await prisma.shopSettings.deleteMany({ where: { shopId: shopRecord.id } });
        await prisma.shop.delete({ where: { id: shopRecord.id } });
      }
      break;

    default:
      throw new Response("Unhandled topic", { status: 404 });
  }

  return new Response();
};
