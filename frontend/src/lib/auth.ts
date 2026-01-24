/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import { Polar } from "@polar-sh/sdk";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { env } from "~/env";

const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "18477266-b079-417a-ac2c-d41555564a37",
              slug: "small",
            },
            {
              productId: "76a726dc-b47d-4f3b-a1b0-bc76b5240542",
              slug: "medium",
            },
            {
              productId: "8005497e-53ca-49f8-8410-98336ce07a10",
              slug: "large",
            },
          ],
          successUrl: "/",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: env.POLAR_WEBHOOK_SECRET,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;

            if (!externalCustomerId) {
              console.error("No external customer ID found");
              throw new Error("No external customer id found");
            }

            const productId = order.data.productId;

            let creditsToAdd = 0;

            switch (productId) {
              case "18477266-b079-417a-ac2c-d41555564a37":
                creditsToAdd = 10;
                break;
              case "76a726dc-b47d-4f3b-a1b0-bc76b5240542":
                creditsToAdd = 25;
                break;
              case "8005497e-53ca-49f8-8410-98336ce07a10":
                creditsToAdd = 50;
                break;
            }

            await db.user.update({
              where: { id: externalCustomerId },
              data: {
                credits: {
                  increment: creditsToAdd,
                },
              },
            });
          },
        }),
      ],
    }),
  ],
});
