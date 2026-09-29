import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export function getMercadoPagoClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 8000 },
  });
}

export interface PreferenceItem {
  id: string;
  title: string;
  unit_price: number;
  quantity: number;
  picture_url?: string;
  currency_id?: string;
}

export interface CreatePreferenceOptions {
  orderId: string;
  orderNumber: string;
  items: PreferenceItem[];
  payerEmail: string;
  payerName?: string;
}

export async function createCheckoutPreference(options: CreatePreferenceOptions) {
  const client = getMercadoPagoClient();
  const preference = new Preference(client);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  const body = {
    items: options.items.map((item) => ({
      id: item.id,
      title: item.title,
      unit_price: item.unit_price,
      quantity: item.quantity,
      currency_id: item.currency_id || "MXN",
      picture_url: item.picture_url,
    })),
    payer: {
      email: options.payerEmail,
      name: options.payerName || "Comprador",
    },
    back_urls: {
      success: `${appUrl}/order/${options.orderId}?status=approved`,
      pending: `${appUrl}/order/${options.orderId}?status=pending`,
      failure: `${appUrl}/order/${options.orderId}?status=failure`,
    },
    auto_return: "approved",
    external_reference: options.orderId,
    statement_descriptor: "PHOTOPLUS FOTO",
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
  };

  const response = await preference.create({ body });
  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
  };
}

export async function getPaymentStatus(paymentId: string | number) {
  const client = getMercadoPagoClient();
  const payment = new Payment(client);
  const data = await payment.get({ id: String(paymentId) });

  return {
    id: data.id,
    status: data.status, // approved, pending, rejected, etc.
    statusDetail: data.status_detail,
    orderId: data.external_reference,
    transactionAmount: data.transaction_amount,
    payerEmail: data.payer?.email,
    dateApproved: data.date_approved,
  };
}
