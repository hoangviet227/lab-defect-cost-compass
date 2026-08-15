export const vnd = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("vi-VN");

/** Mở cửa sổ in với nội dung HTML đã dựng sẵn. */
export function printHtml(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    alert("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép pop-up.");
    return;
  }
  win.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8" />
  <title>${title}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111;margin:24px;font-size:13px}
    h1{font-size:20px;margin:0 0 2px}
    .muted{color:#666}
    .row{display:flex;justify-content:space-between;gap:24px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
    th{background:#f3f4f6}
    td.num,th.num{text-align:right}
    .totals{margin-top:10px;width:280px;margin-left:auto}
    .totals td{border:none;padding:2px 0}
    .sign{display:flex;justify-content:space-between;margin-top:48px;text-align:center}
    .sign div{width:45%}
    @media print{body{margin:8mm} .noprint{display:none}}
  </style></head><body>${bodyHtml}
  <div class="noprint" style="margin-top:24px"><button onclick="window.print()">In</button></div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>
  </body></html>`);
  win.document.close();
}

export type PrintParty = { name?: string | null; phone?: string | null; address?: string | null };
export type PrintLine = { name: string; spec?: string; qty: number; unit?: string; price?: number; total?: number };

export function docTemplate(opts: {
  workshop: PrintParty & { tax_code?: string | null };
  docTitle: string;
  code: string;
  date: string;
  party?: PrintParty;
  partyLabel?: string;
  lines: PrintLine[];
  showMoney?: boolean;
  discount?: number;
  notes?: string | null;
  signLeft?: string;
  signRight?: string;
}) {
  const money = opts.showMoney !== false;
  const subtotal = opts.lines.reduce((s, l) => s + (l.total ?? (l.qty * (l.price ?? 0))), 0);
  const total = Math.max(subtotal - (opts.discount ?? 0), 0);
  return `
  <div class="row">
    <div>
      <h1>${opts.workshop.name ?? "Xưởng In"}</h1>
      <div class="muted">${opts.workshop.address ?? ""}</div>
      <div class="muted">${opts.workshop.phone ? "ĐT: " + opts.workshop.phone : ""} ${opts.workshop.tax_code ? " • MST: " + opts.workshop.tax_code : ""}</div>
    </div>
    <div style="text-align:right">
      <h1>${opts.docTitle}</h1>
      <div class="muted">Số: <b>${opts.code}</b></div>
      <div class="muted">Ngày: ${opts.date}</div>
    </div>
  </div>
  ${opts.party ? `<div style="margin-top:12px"><b>${opts.partyLabel ?? "Khách hàng"}:</b> ${opts.party.name ?? ""}<br/>
    <span class="muted">${opts.party.phone ? "ĐT: " + opts.party.phone + " • " : ""}${opts.party.address ?? ""}</span></div>` : ""}
  <table>
    <thead><tr>
      <th style="width:32px">#</th><th>Nội dung</th><th>Quy cách</th>
      <th class="num" style="width:70px">SL</th>
      ${money ? `<th class="num" style="width:100px">Đơn giá</th><th class="num" style="width:110px">Thành tiền</th>` : ""}
    </tr></thead>
    <tbody>
      ${opts.lines.map((l, i) => `<tr>
        <td>${i + 1}</td><td>${l.name}</td><td>${l.spec ?? ""}</td>
        <td class="num">${l.qty.toLocaleString("vi-VN")} ${l.unit ?? ""}</td>
        ${money ? `<td class="num">${vnd(l.price)}</td><td class="num">${vnd(l.total ?? l.qty * (l.price ?? 0))}</td>` : ""}
      </tr>`).join("")}
      ${opts.lines.length === 0 ? `<tr><td colspan="${money ? 6 : 4}" class="muted">Không có dòng nào</td></tr>` : ""}
    </tbody>
  </table>
  ${money ? `<table class="totals">
    <tr><td>Tạm tính</td><td class="num">${vnd(subtotal)}</td></tr>
    <tr><td>Chiết khấu</td><td class="num">${vnd(opts.discount ?? 0)}</td></tr>
    <tr><td><b>Tổng cộng</b></td><td class="num"><b>${vnd(total)}</b></td></tr>
  </table>` : ""}
  ${opts.notes ? `<div style="margin-top:12px"><b>Ghi chú:</b> ${opts.notes}</div>` : ""}
  <div class="sign">
    <div><b>${opts.signLeft ?? "Người lập phiếu"}</b><div class="muted">(Ký, ghi rõ họ tên)</div></div>
    <div><b>${opts.signRight ?? "Khách hàng"}</b><div class="muted">(Ký, ghi rõ họ tên)</div></div>
  </div>`;
}
