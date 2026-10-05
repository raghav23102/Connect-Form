import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (!admin && topic !== "APP_UNINSTALLED") {
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        // Anonymize/delete shop data on uninstall
        const shopRecord = await prisma.shop.findUnique({
          where: { shopDomain: shop },
        });
        if (shopRecord) {
          // Mark shop as uninstalled, keep data for compliance period
          await prisma.shop.update({
            where: { id: shopRecord.id },
            data: { subscriptionStatus: "uninstalled" },
          });
        }
        await prisma.session.deleteMany({ where: { shop } });
      }
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
