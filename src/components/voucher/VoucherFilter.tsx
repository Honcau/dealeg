/**
 * FILTER + SORT UI — Server component, dùng URL search params
 * Không cần useState — bấm là URL thay đổi → page re-render với data mới
 */
import { Link } from '@/i18n/navigation';

interface Props {
  currentSort:     string;
  currentProvider: string | undefined;
  providers:       string[];
  category:        string;
}

const SORT_OPTIONS = [
  { value: 'discount', label: 'Giảm nhiều nhất' },
  { value: 'newest',   label: 'Mới nhất' },
  { value: 'popular',  label: 'Phổ biến nhất' },
];

export function VoucherFilter({ currentSort, currentProvider, providers, category }: Props) {
  const base = `/category/${category}`;

  function sortHref(sort: string) {
    const params = new URLSearchParams();
    params.set('sort', sort);
    if (currentProvider) params.set('provider', currentProvider);
    return `${base}?${params}`;
  }

  function providerHref(provider: string | undefined) {
    const params = new URLSearchParams();
    params.set('sort', currentSort);
    if (provider) params.set('provider', provider);
    return `${base}?${params}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sort buttons */}
      <div className="flex gap-1 mr-4">
        {SORT_OPTIONS.map(opt => (
          <Link
            key={opt.value}
            href={sortHref(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentSort === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Provider filter pills */}
      {providers.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <Link
            href={providerHref(undefined)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              !currentProvider
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            Tất cả
          </Link>
          {providers.map(p => (
            <Link
              key={p}
              href={providerHref(p)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                currentProvider === p
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
