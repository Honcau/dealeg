import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Type-safe navigation helpers — use these instead of next/navigation
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
