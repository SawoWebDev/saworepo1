'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/translation/navigation';
import ChevronRight from '../icons/ChevronRight';
import paths from '@/translation/routing';

const exploreBtnStyle = {
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

const STEAM_KEYS = ['generators', 'controls', 'accessories'];
const STEAM_IMAGES = {
  generators: '/assets/Home/Section3/steam-generator1.webp',
  controls: '/assets/Home/Section3/SteamControlFinal.webp',
  accessories: '/assets/Home/Section3/ST-746-I_Display2.webp',
};
const STEAM_HREFS = {
  generators: paths.steam.generators,
  controls: paths.steam.controls,
  accessories: paths.steam.accessories,
};

const ROOM_KEYS = ['standard', 'glassFront', 'outdoor', 'infrared'];
const ROOM_IMAGES = {
  standard: '/assets/Home/Section3/700x525.webp',
  glassFront: '/assets/Home/Section3/GLASS-FRONT.webp',
  outdoor: '/assets/Home/Section3/700x525-outdoor-2.webp',
  infrared: '/assets/Home/Section3/INFRARED-SAUNA-ROOM.webp',
};

const IR_KEYS = ['rooms', 'panels', 'controls'];
const IR_IMAGES = {
  rooms: '/assets/Home/Section3/SR06-44710101-1313LS_PERSPECTIVE-VIEW-1.webp',
  panels: '/assets/Home/Section3/infrared-panelss-400x600px.webp',
  controls: '/assets/Home/Section3/IR-UI-V2.webp',
};

const CONTROL_KEYS = ['saunova', 'innova', 'accessories'];
const CONTROL_IMAGES = {
  saunova: '/assets/Home/Section3/SAU-UI-V2_AspenSauna.webp',
  innova: '/assets/Home/Section3/INC-S-V2_SpruceSauna.webp',
  accessories: '/assets/Home/Section3/sensor-holder.webp',
};

export default function Section3() {
  const t = useTranslations('home.section3');

  const steamItems = STEAM_KEYS.map((key) => ({
    key,
    title: t(`steam.${key}.title`),
    caption: t(`steam.${key}.caption`),
    img: STEAM_IMAGES[key],
    href: STEAM_HREFS[key],
  }));
  const roomItems = ROOM_KEYS.map((key) => ({
    key,
    title: t(`rooms.${key}.title`),
    caption: t(`rooms.${key}.caption`),
    img: ROOM_IMAGES[key],
    href: paths.sauna.rooms,
  }));
  const irItems = IR_KEYS.map((key) => ({
    key,
    title: t(`infrared.${key}.title`),
    img: IR_IMAGES[key],
    href: paths.infrared,
  }));
  const controlItems = CONTROL_KEYS.map((key) => ({
    key,
    title: t(`controls.${key}.title`),
    img: CONTROL_IMAGES[key],
    href: key === 'accessories' ? paths.sauna.accessories.parent : paths.sauna.controls,
  }));

  return (
    <section className="section3-wrapper">
      <h2 className="section-title">{t('steamHeading')}</h2>
      <div className="steam-grid">
        {steamItems.map((item) => (
          <Link key={item.key} className="steam-card has-caption" href={item.href}>
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link href={paths.steam.parent} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          <ExploreLabel /> <ChevronRight />
        </Link>
      </div>

      <h2 className="section-title">{t('saunaRoomsHeading')}</h2>
      <div className="steam-grid">
        {roomItems.map((item) => (
          <Link key={item.key} className="steam-card has-caption" href={item.href}>
            <img src={item.img} alt="" width="700" height="525" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link href={paths.sauna.rooms} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          <ExploreLabel /> <ChevronRight />
        </Link>
      </div>

      <h2 className="section-title">{t('infraredHeading')}</h2>
      <div className="image-grid">
        {irItems.map((item) => (
          <Link key={item.key} href={item.href} className="image-card">
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link href={paths.infrared} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          <ExploreLabel /> <ChevronRight />
        </Link>
      </div>

      <h2 className="section-title">{t('saunaControlHeading')}</h2>
      <div className="image-grid">
        {controlItems.map((item) => (
          <Link key={item.key} href={item.href} className="image-card">
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link href={paths.sauna.controls} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          <ExploreLabel /> <ChevronRight />
        </Link>
      </div>

    </section>
  );
}

function ExploreLabel() {
  const t = useTranslations('common');
  return t('exploreMore');
}
