'use client';

import { useTranslations, useLocale } from 'next-intl';

import { useSession, signOut }   from 'next-auth/react';
import { useRouter }    from 'next/navigation';
import { useState, useEffect } from 'react';
import Image             from 'next/image';
import { LOCALE_OPTIONS } from '@/lib/locales';

interface UserComment {
  id: string;
  text: string;
  createdAt: string;
  voucher: { id: string; code: string; provider: string };
  votes: { value: number }[];
}

interface LinkedAccount {
  provider: string;
}

interface SavedVoucher {
  id: string;
  provider: string;
  code: string;
  discount: string;
  discountValue: number | null;
  savedAt: string;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tx = (k: string, f: string) => (t.has(k) ? t(k) : f);
  const locale = useLocale();
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [name,        setName]        = useState('');
  const [language,    setLanguage]    = useState('en');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [comments,    setComments]    = useState<UserComment[]>([]);
  const [accounts,    setAccounts]    = useState<LinkedAccount[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<SavedVoucher[]>([]);

  // Đổi mật khẩu
  const [showPwd,     setShowPwd]     = useState(false);
  const [curPwd,      setCurPwd]      = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [pwdMsg,      setPwdMsg]      = useState('');
  const [pwdSaving,   setPwdSaving]   = useState(false);

  // Xóa tài khoản
  const [showDelete,  setShowDelete]  = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting,    setDeleting]    = useState(false);
  const [deleteMsg,   setDeleteMsg]   = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? '');
      fetchUserData();
    }
  }, [session]);

  async function fetchUserData() {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const data = await res.json();
    setComments(data.comments ?? []);
    setAccounts(data.accounts ?? []);
    setLanguage(data.language ?? 'en');
    // Lấy voucher đã lưu
    fetch('/api/user/saved')
      .then(r => r.json())
      .then(d => setSavedVouchers(d.saved ?? []))
      .catch(() => {});
  }

  async function handleChangePassword() {
    if (newPwd.length < 6) { setPwdMsg(t('pwdTooShort')); return; }
    setPwdSaving(true); setPwdMsg('');
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg(t('pwdChanged'));
        setCurPwd(''); setNewPwd('');
        setTimeout(() => { setShowPwd(false); setPwdMsg(''); }, 2000);
      } else {
        setPwdMsg(data.error ?? t('pwdError'));
      }
    } catch {
      setPwdMsg(t('pwdError'));
    }
    setPwdSaving(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true); setDeleteMsg('');
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        // Xóa xong → đăng xuất + về trang chủ
        await signOut({ callbackUrl: '/' });
      } else {
        setDeleteMsg(data.error ?? t('deleteError'));
        setDeleting(false);
      }
    } catch {
      setDeleteMsg(t('deleteError'));
      setDeleting(false);
    }
  }

  async function handleUnsave(voucherId: string) {
    try {
      await fetch('/api/user/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherId }),
      });
      setSavedVouchers(prev => prev.filter(v => v.id !== voucherId));
    } catch {}
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, language }),
    });

    if (res.ok) {
      await update({ name }); // Cập nhật session
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (language !== locale) {
        // Đổi ngôn ngữ → reload sang locale mới để nạp bản dịch
        window.location.href = `/${language}/profile`;
        return;
      }
    }
    setSaving(false);
  }

  if (status === 'loading') {
    return <div className="flex justify-center py-20 text-gray-400">{t('loading')}</div>;
  }

  if (!session) return null;

  const providerColors: Record<string, string> = {
    google:   'bg-blue-100 text-blue-700',
    facebook: 'bg-blue-600 text-white',
    github:   'bg-gray-900 text-white',
    credentials: 'bg-indigo-100 text-indigo-700',
  };

  const providerLabels: Record<string, string> = {
    google:      'Google',
    facebook:    'Facebook',
    github:      'GitHub',
    credentials: 'Email',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-extrabold text-gray-900">{t('title')}</h1>

      {/* Avatar + basic info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? 'Avatar'}
              width={64} height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>
        </div>

        {/* Chỉnh tên */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('displayName')}
          </label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saved ? t('saved') : saving ? '...' : t('save')}
            </button>
          </div>
        </div>

        {/* Ngôn ngữ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {tx('language', 'Language')}
          </label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {LOCALE_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {tx('languageHint', 'Changing this switches the site language after you press Save.')}
          </p>
        </div>
      </div>

      {/* Tài khoản liên kết */}
      {accounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t('linkedAccounts')}</h2>
          <div className="flex flex-wrap gap-2">
            {accounts.map(acc => (
              <span
                key={acc.provider}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${providerColors[acc.provider] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {providerLabels[acc.provider] ?? acc.provider}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bình luận của tôi */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {t('myComments')}
          <span className="ml-2 text-sm font-normal text-gray-400">({comments.length})</span>
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noComments')}</p>
        ) : (
          <div className="space-y-3">
            {comments.map(c => {
              const upvotes   = c.votes.filter(v => v.value === 1).length;
              const downvotes = c.votes.filter(v => v.value === -1).length;
              return (
                <div key={c.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <a
                      href={`/provider/${c.voucher.provider.toLowerCase()}`}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      {c.voucher.provider} · {c.voucher.code}
                    </a>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('vi')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{c.text}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span className="text-green-600">✓ {upvotes}</span>
                    <span className="text-red-500">✗ {downvotes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Deal đã lưu */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {t('savedDeals')}
          <span className="ml-2 text-sm font-normal text-gray-400">({savedVouchers.length})</span>
        </h2>
        {savedVouchers.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noSaved')}</p>
        ) : (
          <div className="space-y-2">
            {savedVouchers.map(v => (
              <div key={v.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                <a href={`/voucher/${v.id}`} className="min-w-0 flex-1">
                  <span className="font-medium text-sm text-gray-800">{v.provider}</span>
                  <span className="text-xs text-gray-400 font-mono ml-2">{v.code}</span>
                </a>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-indigo-600 font-bold text-sm">
                    {v.discountValue ? `-${v.discountValue}%` : v.discount}
                  </span>
                  <button onClick={() => handleUnsave(v.id)}
                    className="text-xs text-red-400 hover:text-red-600" title={t('remove')}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bảo mật: đổi mật khẩu */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{t('security')}</h2>
          <button onClick={() => setShowPwd(!showPwd)}
            className="text-sm text-indigo-600 hover:underline">
            {showPwd ? t('cancel') : t('changePassword')}
          </button>
        </div>

        {showPwd && (
          <div className="mt-4 space-y-3">
            <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)}
              placeholder={t('currentPassword')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              placeholder={t('newPassword')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex items-center gap-3">
              <button onClick={handleChangePassword} disabled={pwdSaving || !newPwd}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {pwdSaving ? '...' : t('updatePassword')}
              </button>
              {pwdMsg && <span className={`text-sm ${pwdMsg === t('pwdChanged') ? 'text-green-600' : 'text-red-500'}`}>{pwdMsg}</span>}
            </div>
            <p className="text-xs text-gray-400">{t('pwdOAuthHint')}</p>
          </div>
        )}
      </div>

      {/* Đăng xuất */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">{t('logout')}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{t('logoutHint')}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
            {t('logout')}
          </button>
        </div>
      </div>

      {/* Vùng nguy hiểm: xóa tài khoản */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-red-700">{t('deleteAccount')}</h2>
            <p className="text-sm text-red-400 mt-0.5">{t('deleteHint')}</p>
          </div>
          {!showDelete && (
            <button onClick={() => setShowDelete(true)}
              className="px-5 py-2 bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg transition-colors">
              {t('deleteAccount')}
            </button>
          )}
        </div>

        {showDelete && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-700">{t('deleteConfirm', { email: session.user.email ?? '' })}</p>
            <input value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)}
              placeholder={session.user.email ?? ''}
              className="w-full px-3 py-2 rounded-lg border border-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            <div className="flex items-center gap-3">
              <button onClick={handleDeleteAccount}
                disabled={deleting || confirmEmail !== session.user.email}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {deleting ? '...' : t('deleteForever')}
              </button>
              <button onClick={() => { setShowDelete(false); setConfirmEmail(''); }}
                className="text-sm text-gray-500 hover:text-gray-700">{t('cancel')}</button>
              {deleteMsg && <span className="text-sm text-red-500">{deleteMsg}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
