'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/translation/navigation';
import ChevronRight from '../icons/ChevronRight';

const style = {
  fontFamily: "'Montserrat', sans-serif",
  fontWeight: 500,
  fontSize: '15px',
  lineHeight: '27px',
  color: '#333333',
  textDecoration: 'none',
  transition: 'color 0.3s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

export default function ExploreMoreLink({ href }) {
  const t = useTranslations('common');
  return (
    <Link
      href={href}
      style={style}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#af8564')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#333333')}
    >
      {t('exploreMore')}
      <ChevronRight />
    </Link>
  );
}
