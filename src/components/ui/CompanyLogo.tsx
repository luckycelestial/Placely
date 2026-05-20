'use client';

import {
  SiGoogle, SiMeta, SiNetflix, SiTesla, SiSpacex, SiNvidia,
  SiSalesforce, SiIntel, SiAmd, SiCisco, SiAtlassian, SiUber,
  SiAirbnb, SiSpotify, SiApple, SiOpenai, SiStripe,
  SiGoldmansachs, SiTcs, SiInfosys, SiWipro, SiAccenture,
  SiZomato, SiSwiggy, SiFlipkart, SiPhonepe, SiPaytm, SiZoho,
  SiSamsung, SiSony, SiLg, SiHuawei, SiHp, SiDell, SiLenovo,
  SiMastercard, SiVisa, SiYoutube, SiSlack, SiGithub, SiShopify, SiDropbox, SiHubspot,
  SiSap, SiAsus, SiBosch, SiAdidas, SiNike,
} from 'react-icons/si';
import { FaAmazon, FaMicrosoft } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import { cn } from '@/lib/utils';

// ─── Brand map ────────────────────────────────────────────────────────────────
// Each entry: [IconComponent, brandColor, bgColor]
type BrandEntry = [IconType, string, string];

const BRAND_MAP: Record<string, BrandEntry> = {
  // Big Tech
  'google':         [SiGoogle,       '#4285F4', '#EAF1FF'],
  'microsoft':      [FaMicrosoft,    '#00A4EF', '#E6F4FF'],
  'apple':          [SiApple,        '#1C1C1E', '#F5F5F5'],
  'meta':           [SiMeta,         '#0668E1', '#EBF3FF'],
  'netflix':        [SiNetflix,      '#E50914', '#FFEAEB'],
  'nvidia':         [SiNvidia,       '#76B900', '#EEF9E3'],
  'intel':          [SiIntel,        '#0068B5', '#E5F1FB'],
  'amd':            [SiAmd,          '#ED1C24', '#FEEAEB'],
  'tesla':          [SiTesla,        '#E81919', '#FEE9E9'],
  'spacex':         [SiSpacex,       '#005288', '#E5EEF7'],
  'openai':         [SiOpenai,       '#00A67E', '#E5F8F4'],
  'amazon':         [FaAmazon,       '#FF9900', '#FFF4E5'],
  'samsung':        [SiSamsung,      '#1428A0', '#E9ECFB'],
  'sony':           [SiSony,         '#000000', '#F5F5F5'],
  'lg':             [SiLg,           '#A50034', '#F9E5EA'],
  'huawei':         [SiHuawei,       '#CF0A2C', '#FCE8EC'],
  'dell':           [SiDell,         '#007DB8', '#E5F2FA'],
  'hp':             [SiHp,           '#0096D6', '#E5F4FB'],
  'lenovo':         [SiLenovo,       '#E2231A', '#FDEAEC'],

  // Software / SaaS
  'atlassian':      [SiAtlassian,    '#0052CC', '#E6EEFF'],
  'salesforce':     [SiSalesforce,   '#00A1E0', '#E5F5FB'],
  'cisco':          [SiCisco,        '#049FD9', '#E5F5FC'],
  'sap':            [SiSap,          '#0F88FF', '#E9F2FF'],
  'slack':          [SiSlack,        '#4A154B', '#F3E8F4'],
  'github':         [SiGithub,       '#171515', '#F5F5F5'],
  'shopify':        [SiShopify,      '#96BF48', '#F2F8E8'],
  'dropbox':        [SiDropbox,      '#0061FF', '#E6EFFF'],
  'hubspot':        [SiHubspot,      '#FF7A59', '#FFF0EC'],
  'stripe':         [SiStripe,       '#635BFF', '#EEEDFF'],
  'zoho':           [SiZoho,         '#E42527', '#FEEAEA'],
  'asus':           [SiAsus,         '#00457C', '#E5EEF7'],

  // Finance
  'goldman sachs':  [SiGoldmansachs, '#7399C6', '#EEF2F9'],
  'goldman':        [SiGoldmansachs, '#7399C6', '#EEF2F9'],
  'mastercard':     [SiMastercard,   '#EB001B', '#FEE9EA'],
  'visa':           [SiVisa,         '#1A1F71', '#EAEBF7'],

  // Entertainment / Media
  'spotify':        [SiSpotify,      '#1DB954', '#E8F9EE'],
  'airbnb':         [SiAirbnb,       '#FF5A5F', '#FFECEC'],
  'uber':           [SiUber,         '#09091A', '#F5F5F5'],
  'youtube':        [SiYoutube,      '#FF0000', '#FFEBEB'],

  // Indian companies
  'tcs':            [SiTcs,          '#0058A0', '#E5EEF8'],
  'infosys':        [SiInfosys,      '#007CC3', '#E5F2FA'],
  'wipro':          [SiWipro,        '#341C54', '#EDE9F3'],
  'accenture':      [SiAccenture,    '#A100FF', '#F3E6FF'],
  'zomato':         [SiZomato,       '#E23744', '#FEE9EA'],
  'swiggy':         [SiSwiggy,       '#FC8019', '#FFF3E9'],
  'flipkart':       [SiFlipkart,     '#2874F0', '#EBF2FE'],
  'phonepe':        [SiPhonepe,      '#5F259F', '#EFE9F7'],
  'paytm':          [SiPaytm,        '#00B9F1', '#E5F8FE'],

  // Apparel / Other
  'adidas':         [SiAdidas,       '#000000', '#F5F5F5'],
  'nike':           [SiNike,         '#111111', '#F5F5F5'],
  'bosch':          [SiBosch,        '#DA1A32', '#FCE9EC'],
};

// Normalize key: lowercase, strip punctuation
function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function lookup(name: string): BrandEntry | null {
  const key = normalize(name);
  // Exact match
  if (BRAND_MAP[key]) return BRAND_MAP[key];
  // Partial match — check if any known key is contained in the name
  for (const k of Object.keys(BRAND_MAP)) {
    if (key.includes(k) || k.includes(key.split(' ')[0])) return BRAND_MAP[k];
  }
  return null;
}

// ─── Fallback avatar colours (deterministic from name) ───────────────────────
const FALLBACK_COLORS: [string, string][] = [
  ['#6366F1', '#EEF2FF'], ['#EC4899', '#FCE7F3'], ['#14B8A6', '#F0FDFA'],
  ['#F59E0B', '#FFFBEB'], ['#3B82F6', '#EFF6FF'], ['#10B981', '#ECFDF5'],
  ['#8B5CF6', '#F5F3FF'], ['#EF4444', '#FEF2F2'], ['#06B6D4', '#ECFEFF'],
  ['#84CC16', '#F7FEE7'],
];

function fallbackColor(name: string): [string, string] {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return FALLBACK_COLORS[n % FALLBACK_COLORS.length];
}

// ─── CompanyLogo component ────────────────────────────────────────────────────
interface CompanyLogoProps {
  name: string;
  /** Container size in px. Default 40 */
  size?: number;
  /** Extra className on the wrapper div */
  className?: string;
  /** Corner rounding class. Default 'rounded-2xl' */
  rounded?: string;
}

export function CompanyLogo({ name, size = 40, className, rounded = 'rounded-2xl' }: CompanyLogoProps) {
  const brand = lookup(name);
  const iconSize = Math.round(size * 0.52);
  const fontSize = Math.round(size * 0.38);

  if (brand) {
    const [Icon, color, bg] = brand;
    return (
      <div
        className={cn('flex items-center justify-center shrink-0', rounded, className)}
        style={{ width: size, height: size, backgroundColor: bg, border: `1px solid ${color}22` }}
      >
        <Icon size={iconSize} style={{ color }} />
      </div>
    );
  }

  // Fallback: letter avatar
  const [fg, bg] = fallbackColor(name);
  const letter = name.trim()[0]?.toUpperCase() ?? '?';
  return (
    <div
      className={cn('flex items-center justify-center shrink-0 font-black select-none', rounded, className)}
      style={{ width: size, height: size, backgroundColor: bg, color: fg, fontSize, border: `1px solid ${fg}22` }}
    >
      {letter}
    </div>
  );
}

export default CompanyLogo;
