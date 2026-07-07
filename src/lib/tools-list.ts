/** Danh sách công cụ — dùng chung cho trang /tools và API search.
 *  vnOnly = chỉ hiện/tìm khi locale='vi'. */
export interface ToolDef {
  key: string;      // key i18n trong namespace 'tools' (tools.{key}.name / .desc)
  href: string;
  vnOnly: boolean;
}

export const TOOLS: ToolDef[] = [
  // VN-only
  { key: 'vietqr',   href: '/tools/vietqr',          vnOnly: true },
  { key: 'grossnet', href: '/tools/gross-net',       vnOnly: true },
  { key: 'vnfont',   href: '/tools/vn-font',         vnOnly: true },
  { key: 'idphoto',  href: '/tools/id-photo',        vnOnly: true },
  { key: 'lunar',    href: '/tools/lunar-calendar',  vnOnly: true },
  { key: 'interest', href: '/tools/interest',        vnOnly: true },
  // Global
  { key: 'discount',      href: '/tools/discount',         vnOnly: false },
  { key: 'unitprice',     href: '/tools/unit-price',       vnOnly: false },
  { key: 'currency',      href: '/tools/currency',         vnOnly: false },
  { key: 'password',      href: '/tools/password',         vnOnly: false },
  { key: 'num2words',     href: '/tools/number-to-words',  vnOnly: false },
  { key: 'textcounter',   href: '/tools/text-counter',     vnOnly: false },
  { key: 'imagecompress', href: '/tools/image-compress',   vnOnly: false },
  { key: 'pdf',           href: '/tools/pdf',              vnOnly: false },
  { key: 'qr',            href: '/tools/qr',               vnOnly: false },
  { key: 'datecalc',      href: '/tools/date-calculator',  vnOnly: false },
  { key: 'utm',           href: '/tools/utm-builder',      vnOnly: false },
  { key: 'json',          href: '/tools/json',             vnOnly: false },
  { key: 'base64',        href: '/tools/base64',           vnOnly: false },
  { key: 'hash',          href: '/tools/hash',             vnOnly: false },
];
