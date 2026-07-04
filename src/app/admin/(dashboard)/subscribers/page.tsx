import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Subscribers | Admin' };

export default async function SubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const activeCount = subscribers.filter(s => s.isActive).length;

  // Export CSV data
  const csvContent = 'email,locale,source,date\n' +
    subscribers.map(s => `${s.email},${s.locale},${s.source ?? ''},${s.createdAt.toISOString().split('T')[0]}`).join('\n');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Người đăng ký</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeCount} active · {subscribers.length} tổng</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Email','Ngôn ngữ','Nguồn','Ngày','Trạng thái'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscribers.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                <td className="px-4 py-3 text-gray-500 uppercase text-xs">{s.locale}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{s.source ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(s.createdAt).toLocaleDateString('vi')}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${s.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.isActive ? 'Active' : 'Hủy'}
                  </span>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Chưa có ai đăng ký</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Xuất email để gửi newsletter qua Mailchimp, Brevo... (copy từ DB hoặc dùng nút export sau)
      </p>
    </div>
  );
}
