import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  name: string;
  quantity: number | null;
  volume_value: number | null;
  volume_unit: string | null;
  expires_at: string | null;
  places:
    | {
        name: string | null;
        address: string | null;
        city_highlight: string | null;
      }
    | {
        name: string | null;
        address: string | null;
        city_highlight: string | null;
      }[]
    | null;
};

function formatDateId(dateValue: string | null) {
  if (!dateValue) return "Belum diisi";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function addDaysDateString(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getDaysLeft(dateValue: string | null) {
  if (!dateValue) return null;

  const today = new Date();
  const targetDate = new Date(dateValue);

  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diff = targetDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getPlace(product: ProductRow) {
  if (Array.isArray(product.places)) {
    return product.places[0] || null;
  }

  return product.places;
}

function buildEmailHtml(products: ProductRow[]) {
  const productRows = products
    .map((product) => {
      const place = getPlace(product);
      const daysLeft = getDaysLeft(product.expires_at);

      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
            <strong>${product.name}</strong><br />
            <span style="font-size:13px;color:#64748b;">
              ${place?.name || "Tempat tidak diketahui"}
            </span>
          </td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
            ${product.quantity ?? 0}
          </td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
            ${product.volume_value ?? "-"} ${product.volume_unit || ""}
          </td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
            ${formatDateId(product.expires_at)}
          </td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
            ${daysLeft === null ? "-" : `${daysLeft} hari`}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:760px;margin:auto;background:white;border-radius:20px;padding:24px;border:1px solid #e5e7eb;">
        <h1 style="margin:0;color:#0f172a;font-size:24px;">
          Peringatan Produk Hampir Expired
        </h1>

        <p style="color:#475569;line-height:1.6;">
          Produk berikut akan habis masa berlakunya dalam 10 hari atau kurang.
          Mohon segera dicek.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
          <thead>
            <tr style="background:#f1f5f9;color:#334155;">
              <th align="left" style="padding:12px;">Produk</th>
              <th align="left" style="padding:12px;">Qty</th>
              <th align="left" style="padding:12px;">Volume</th>
              <th align="left" style="padding:12px;">Expired</th>
              <th align="left" style="padding:12px;">Sisa</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>

        <p style="margin-top:20px;color:#64748b;font-size:13px;">
          Email ini dikirim otomatis dari aplikasi catatan kerja.
        </p>
      </div>
    </div>
  `;
}

function buildEmailText(products: ProductRow[]) {
  const lines = products.map((product) => {
    const place = getPlace(product);
    const daysLeft = getDaysLeft(product.expires_at);

    return [
      `Produk: ${product.name}`,
      `Tempat: ${place?.name || "Tempat tidak diketahui"}`,
      `Quantity: ${product.quantity ?? 0}`,
      `Volume: ${product.volume_value ?? "-"} ${product.volume_unit || ""}`,
      `Expired: ${formatDateId(product.expires_at)}`,
      `Sisa: ${daysLeft === null ? "-" : `${daysLeft} hari`}`,
    ].join("\n");
  });

  return `Peringatan Produk Hampir Expired\n\n${lines.join("\n\n---\n\n")}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET belum diisi." },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.NOTIFICATION_EMAIL_TO;

  if (!resendApiKey) {
    return Response.json(
      { ok: false, error: "RESEND_API_KEY belum diisi." },
      { status: 500 },
    );
  }

  if (!emailTo) {
    return Response.json(
      { ok: false, error: "NOTIFICATION_EMAIL_TO belum diisi." },
      { status: 500 },
    );
  }

  const today = getTodayDateString();
  const tenDaysLater = addDaysDateString(10);

  const { data: productsData, error: productsError } = await supabaseAdmin
    .from("products")
    .select(
      `
      id,
      name,
      quantity,
      volume_value,
      volume_unit,
      expires_at,
      places (
        name,
        address,
        city_highlight
      )
    `,
    )
    .not("expires_at", "is", null)
    .gte("expires_at", today)
    .lte("expires_at", tenDaysLater)
    .order("expires_at", { ascending: true });

  if (productsError) {
    return Response.json(
      { ok: false, error: productsError.message },
      { status: 500 },
    );
  }

  const products = (productsData || []) as ProductRow[];

  if (products.length === 0) {
    return Response.json({
      ok: true,
      message: "Tidak ada produk yang expired dalam 10 hari.",
      count: 0,
    });
  }

  const productIds = products.map((product) => product.id);

  const { data: existingLogs, error: logsError } = await supabaseAdmin
    .from("notification_logs")
    .select("product_id, expires_at_snapshot")
    .eq("channel", "email")
    .eq("target", emailTo)
    .eq("notification_type", "product_expiry")
    .in("product_id", productIds);

  if (logsError) {
    return Response.json(
      { ok: false, error: logsError.message },
      { status: 500 },
    );
  }

  const existingKeys = new Set(
    (existingLogs || []).map(
      (log) => `${log.product_id}|${log.expires_at_snapshot}`,
    ),
  );

  const productsToNotify = products.filter((product) => {
    return !existingKeys.has(`${product.id}|${product.expires_at}`);
  });

  if (productsToNotify.length === 0) {
    return Response.json({
      ok: true,
      message: "Semua produk sudah pernah dikirim notifikasinya.",
      count: 0,
    });
  }

  const resend = new Resend(resendApiKey);

  const subject = `Peringatan: ${productsToNotify.length} produk hampir expired`;
  const html = buildEmailHtml(productsToNotify);
  const text = buildEmailText(productsToNotify);

  const { error: emailError } = await resend.emails.send({
    from: "Catatan Kerja <onboarding@resend.dev>",
    to: [emailTo],
    subject,
    html,
    text,
  });

  const logRows = productsToNotify.map((product) => ({
    product_id: product.id,
    channel: "email",
    target: emailTo,
    status: emailError ? "failed" : "sent",
    sent_at: emailError ? null : new Date().toISOString(),
    error_message: emailError ? emailError.message : null,
    notification_type: "product_expiry",
    expires_at_snapshot: product.expires_at,
    message: subject,
  }));

  const { error: insertLogError } = await supabaseAdmin
    .from("notification_logs")
    .insert(logRows);

  if (insertLogError) {
    return Response.json(
      { ok: false, error: insertLogError.message },
      { status: 500 },
    );
  }

  if (emailError) {
    return Response.json(
      { ok: false, error: emailError.message },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    message: "Email notifikasi berhasil dikirim.",
    count: productsToNotify.length,
  });
}
