import React from 'react';
import { COLORS } from '../constants';

type IconProps = {
  size?: number;
  className?: string;
};

const stroke = COLORS.WHITE;
const primary = COLORS.SECONDARY_GREEN;
const accent = COLORS.ACCENT_ORANGE;

export const IconFeed: React.FC<IconProps> = ({ size = 22, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M7 8h10" />
    <path d="M7 12h6" />
    <circle cx="9" cy="16" r="1.6" fill={primary} stroke="none" />
    <circle cx="15" cy="16" r="1.6" stroke={primary} />
  </svg>
);

export const IconNews: React.FC<IconProps> = ({ size = 22, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="4" width="10" height="16" rx="2" />
    <path d="M16 7h2.5a1.5 1.5 0 0 1 1.5 1.5V18a2 2 0 0 1-2 2H8" />
    <path d="M6.5 8.5h5" />
    <path d="M6.5 11.5h5" />
    <path d="M6.5 14.5h3" />
  </svg>
);

export const IconPerf: React.FC<IconProps> = ({ size = 26, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 18v-3.5l3.5-3.5 3 3L17 8l3 3.5V18" />
    <path d="M4 18h16" />
    <circle cx="7.5" cy="7.5" r="2" stroke={primary} />
    <circle cx="17" cy="6" r="1.4" fill={accent} stroke="none" />
  </svg>
);

export const IconLive: React.FC<IconProps> = ({ size = 22, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="5" width="16" height="12" rx="3" />
    <path d="M10 16.5 9 19h6l-1-2.5" />
    <polygon points="11 9 15 12 11 15" fill={primary} stroke="none" />
    <circle cx="7" cy="9" r="1" fill={accent} stroke="none" />
  </svg>
);

export const IconProfile: React.FC<IconProps> = ({ size = 22, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="3" />
    <path d="M6 19.5c.8-2.3 2.8-3.5 6-3.5s5.2 1.2 6 3.5" />
    <circle cx="18" cy="7" r="1.2" fill={accent} stroke="none" />
  </svg>
);

export const IconLike: React.FC<IconProps> = ({ size = 26, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.1 19.2S6 15.3 6 10.4A3.4 3.4 0 0 1 9.5 7 3.8 3.8 0 0 1 12 8.1 3.8 3.8 0 0 1 14.5 7 3.4 3.4 0 0 1 18 10.4c0 4.9-6.1 8.8-6.1 8.8Z" />
  </svg>
);

export const IconComment: React.FC<IconProps> = ({ size = 26, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 5.5h14v9.5a3 3 0 0 1-3 3H11l-3.5 2v-2H8a3 3 0 0 1-3-3Z" />
    <path d="M8 10h8" />
    <path d="M8 13h4" />
  </svg>
);

export const IconShare: React.FC<IconProps> = ({ size = 26, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 13v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5" />
    <path d="M12 4v11" />
    <path d="M8.5 7.5 12 4l3.5 3.5" />
  </svg>
);

export const IconVolume: React.FC<IconProps> = ({ size = 22, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 10v4h3.2L13 18v-8L8.2 10Z" />
    <path d="M16 10a3 3 0 0 1 0 4" />
    <path d="M17.5 7a6 6 0 0 1 0 10" />
  </svg>
);

export const IconVolumeMuted: React.FC<IconProps> = ({ size = 22, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 10v4h3.2L13 18v-8L8.2 10Z" />
    <path d="M16 9l4 4" />
    <path d="M20 9l-4 4" />
  </svg>
);

export const IconWallet: React.FC<IconProps> = ({ size = 22, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke={stroke}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 9h18" />
    <path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" />
    <circle cx="16" cy="14" r="1.5" fill={primary} stroke="none" />
  </svg>
);

