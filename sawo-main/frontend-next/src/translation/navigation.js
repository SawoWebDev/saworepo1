import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware replacements for next/link and next/navigation. Components
// import Link from here instead of next/link so every href automatically
// carries the active locale prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
