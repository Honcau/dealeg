// Admin root layout — KHÔNG có html/body (root layout đã xử lý)
export const metadata = { title: 'Admin — Dealeg' };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
