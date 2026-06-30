'use client';

import { useState }          from 'react';
import { signIn }            from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense }          from 'react';

// ── Icons ──────────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073C24 5.40 18.627 0 12 0S0 5.40 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────────
function AuthPageContent() {
  const [mode,     setMode]     = useState<'signin' | 'signup'>('signin');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState<string | null>(null);

  const router      = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  // ── Social login ────────────────────────────────────────────────────────────
  async function handleSocial(provider: string) {
    setLoading(provider);
    await signIn(provider, { callbackUrl });
  }

  // ── Email sign in ────────────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading('credentials');

    const res = await signIn('credentials', {
      email, password,
      redirect: false,
    });

    if (res?.error) {
      setErrors({ form: 'Email hoặc mật khẩu không đúng' });
      setLoading(null);
    } else {
      router.push(callbackUrl);
    }
  }

  // ── Email sign up ────────────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (password !== confirm) {
      setErrors({ confirm: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading('register');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Map server errors ra từng field
      const errs: Record<string, string> = {};
      if (data.error?.email)    errs.email    = data.error.email[0];
      if (data.error?.password) errs.password = data.error.password[0];
      if (data.error?.name)     errs.name     = data.error.name[0];
      if (!Object.keys(errs).length) errs.form = 'Đăng ký thất bại, thử lại';
      setErrors(errs);
      setLoading(null);
      return;
    }

    // Đăng ký thành công → tự động đăng nhập
    const loginRes = await signIn('credentials', {
      email, password,
      redirect: false,
    });

    if (loginRes?.ok) {
      router.push(callbackUrl);
    } else {
      setMode('signin');
      setLoading(null);
    }
  }

  const input = (hasErr: boolean) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
      hasErr ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  const socialBtnBase =
    'flex items-center justify-center gap-3 w-full py-2.5 rounded-xl border font-medium text-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <a href="/" className="text-2xl font-extrabold text-indigo-600">Dealeg</a>
          <p className="text-gray-500 text-sm mt-1">Voucher công nghệ tốt nhất</p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['signin','signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setErrors({}); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === m
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        {/* Social buttons */}
        <div className="space-y-2.5 mb-5">
          <button onClick={() => handleSocial('google')}
            disabled={!!loading}
            className={`${socialBtnBase} border-gray-300`}>
            <GoogleIcon />
            <span>Tiếp tục với Google</span>
          </button>

          <button onClick={() => handleSocial('facebook')}
            disabled={!!loading}
            className={`${socialBtnBase} border-[#1877F2] text-[#1877F2] hover:bg-blue-50`}>
            <FacebookIcon />
            <span>Tiếp tục với Facebook</span>
          </button>

          <button onClick={() => handleSocial('github')}
            disabled={!!loading}
            className={`${socialBtnBase} border-gray-800 text-gray-800 hover:bg-gray-50`}>
            <GitHubIcon />
            <span>Tiếp tục với GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-xs text-gray-400">hoặc dùng email</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        {/* Form */}
        {errors.form && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errors.form}
          </div>
        )}

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Tên hiển thị"
                className={input(!!errors.name)} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className={input(!!errors.email)} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Mật khẩu (tối thiểu 6 ký tự)' : 'Mật khẩu'}
              className={input(!!errors.password)} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {mode === 'signup' && (
            <div>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Xác nhận mật khẩu"
                className={input(!!errors.confirm)} />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
            </div>
          )}

          <button type="submit" disabled={!!loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            {loading
              ? 'Đang xử lý...'
              : mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-5">
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <a href="/terms" className="underline hover:text-gray-600">Điều khoản</a>{' '}
          và{' '}
          <a href="/privacy" className="underline hover:text-gray-600">Chính sách bảo mật</a>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Đang tải...</div>
    </div>}>
      <AuthPageContent />
    </Suspense>
  );
}
