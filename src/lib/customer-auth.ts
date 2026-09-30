import { cookies } from "next/headers";
import prisma from "./prisma";

const CUSTOMER_COOKIE_NAME = "photoplus_customer_session";

export interface CustomerSessionUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
}

export async function getCustomerSession(): Promise<CustomerSessionUser | null> {
  const cookieStore = await cookies();
  const customerId = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

  if (!customerId) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      email: true,
      name: true,
      picture: true,
    },
  });

  return customer;
}

export async function setCustomerSession(customerId: string) {
  const cookieStore = await cookies();
  const isHttps = (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https://");
  cookieStore.set(CUSTOMER_COOKIE_NAME, customerId, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_COOKIE_NAME);
}
