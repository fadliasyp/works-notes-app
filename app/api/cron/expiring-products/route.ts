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
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const productCards = products
    .map((product) => {
      const place = getPlace(product);
      const daysLeft = getDaysLeft(product.expires_at);

      const badgeColor =
        daysLeft !== null && daysLeft <= 3 ? "#fee2e2" : "#ffedd5";

      const badgeTextColor =
        daysLeft !== null && daysLeft <= 3 ? "#b91c1c" : "#c2410c";

      return `
        <div style="margin-bottom:16px;border:1px solid #e2e8f0;border-radius:18px;padding:18px;background:#ffffff;">
          <div style="margin-bottom:12px;">
            <div style="display:inline-block;background:${badgeColor};color:${badgeTextColor};padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;">
              ${daysLeft === null ? "Perlu dicek" : `${daysLeft} hari lagi`}
            </div>
          </div>

          <h3 style="margin:0 0 6px 0;font-size:20px;line-height:1.4;color:#0f172a;font-weight:800;">
            ${product.name}
          </h3>

          <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#64748b;">
            ${place?.name || "Tempat tidak diketahui"}
            ${place?.city_highlight ? ` • ${place.city_highlight}` : ""}
          </p>

          <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="width:50%;padding:0 8px 12px 0;vertical-align:top;">
                  <div style="background:#f8fafc;border-radius:14px;padding:12px;">
                    <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Quantity</div>
                    <div style="font-size:16px;font-weight:700;color:#0f172a;">
                      ${product.quantity ?? 0}
                    </div>
                  </div>
                </td>
                <td style="width:50%;padding:0 0 12px 8px;vertical-align:top;">
                  <div style="background:#f8fafc;border-radius:14px;padding:12px;">
                    <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Volume</div>
                    <div style="font-size:16px;font-weight:700;color:#0f172a;">
                      ${product.volume_value ?? "-"} ${product.volume_unit || ""}
                    </div>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="width:50%;padding:0 8px 0 0;vertical-align:top;">
                  <div style="background:#f8fafc;border-radius:14px;padding:12px;">
                    <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Tanggal Expired</div>
                    <div style="font-size:16px;font-weight:700;color:#0f172a;">
                      ${formatDateId(product.expires_at)}
                    </div>
                  </div>
                </td>
                <td style="width:50%;padding:0 0 0 8px;vertical-align:top;">
                  <div style="background:#f8fafc;border-radius:14px;padding:12px;">
                    <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Status</div>
                    <div style="font-size:16px;font-weight:700;color:${
                      daysLeft !== null && daysLeft <= 3 ? "#b91c1c" : "#c2410c"
                    };">
                      ${daysLeft === null ? "Perlu dicek" : `${daysLeft} hari lagi`}
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:24px 24px 0 0;padding:28px 24px;color:#ffffff;">
          <div style="display:inline-block;background:rgba(255,255,255,0.12);padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.3px;">
            CATATAN KERJA
          </div>

          <h1 style="margin:16px 0 10px 0;font-size:34px;line-height:1.2;font-weight:800;color:#ffffff;">
            Peringatan Produk Hampir Expired
          </h1>

          <p style="margin:0;font-size:15px;line-height:1.8;color:#cbd5e1;">
            Produk berikut akan habis masa berlakunya dalam <strong style="color:#ffffff;">10 hari atau kurang</strong>.
            Mohon segera dicek agar stok tetap aman dan terkontrol.
          </p>
        </div>

        <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 24px 24px;padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:22px;">
            <tr>
              <td style="padding:0 6px 0 0;vertical-align:top;">
                <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:18px;padding:16px;text-align:center;">
                  <div style="font-size:12px;color:#1d4ed8;font-weight:700;margin-bottom:6px;">JUMLAH PRODUK</div>
                  <div style="font-size:28px;color:#0f172a;font-weight:800;">${products.length}</div>
                </div>
              </td>
              <td style="padding:0 0 0 6px;vertical-align:top;">
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:16px;text-align:center;">
                  <div style="font-size:12px;color:#475569;font-weight:700;margin-bottom:6px;">TANGGAL CEK</div>
                  <div style="font-size:16px;color:#0f172a;font-weight:800;">${todayFormatted}</div>
                </div>
              </td>
            </tr>
          </table>

          <div style="margin-bottom:14px;">
            <h2 style="margin:0;font-size:18px;color:#0f172a;font-weight:800;">
              Daftar Produk
            </h2>
            <p style="margin:6px 0 0 0;font-size:14px;line-height:1.7;color:#64748b;">
              Berikut daftar produk yang perlu menjadi perhatian.
            </p>
          </div>

          ${productCards}

          <div style="margin-top:24px;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;">
            <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#0f172a;">
              Tindakan yang disarankan:
            </p>
            <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px;line-height:1.8;">
              <li>Periksa stok fisik produk di tempat.</li>
              <li>Prioritaskan penggunaan produk yang mendekati expired.</li>
              <li>Catat produk yang perlu diganti atau dibuang.</li>
            </ul>
          </div>

          <p style="margin:22px 0 0 0;font-size:12px;line-height:1.7;color:#94a3b8;text-align:center;">
            Email ini dikirim otomatis oleh sistem Catatan Kerja.
          </p>
        </div>
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
  const subject = `⚠️ Notifikasi Expired: ${productsToNotify.length} Produk Perlu Dicek`;
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
