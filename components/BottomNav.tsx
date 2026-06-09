
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FilePlus2, ShieldCheck } from 'lucide-react';
import { UserType } from '../types';
import { IconFeed, IconNews, IconPerf, IconLive, IconWallet, IconProfile, IconMessage } from './Icons';

interface BottomNavProps {
  userType: UserType;
}

type NavItem = {
  icon: React.ReactElement<{ size?: number; className?: string }>;
  label: string;
  path: string;
  variant?: 'standard' | 'publish' | 'live';
  compact?: boolean;
};

const BottomNav: React.FC<BottomNavProps> = ({ userType }) => {
  const getNavItems = (): NavItem[] => {
    if (userType === UserType.ADMIN) {
      return [
        { icon: <IconFeed />, label: 'Feed', path: '/home' },
        { icon: <IconNews />, label: 'Actu', path: '/explorer' },
        { icon: <IconPerf />, label: 'Perfs', path: '/create-content', variant: 'publish', compact: true },
        { icon: <FilePlus2 />, label: 'Presse', path: '/dashboard/press', variant: 'publish', compact: true },
        { icon: <IconLive />, label: 'Live', path: '/live-match', variant: 'live', compact: true },
        { icon: <IconMessage />, label: 'Messages', path: '/messages' },
        { icon: <IconWallet />, label: 'Wallet', path: '/wallet' },
        { icon: <ShieldCheck />, label: 'Admin', path: '/admin' },
        { icon: <IconProfile />, label: 'Profil', path: '/profile' }
      ];
    }

    if (userType === UserType.PRESS) {
      return [
        { icon: <IconFeed />, label: 'Feed', path: '/home' },
        { icon: <IconNews />, label: 'Presse', path: '/explorer' },
        { icon: <FilePlus2 />, label: 'Créer', path: '/dashboard/press', variant: 'publish', compact: true },
        { icon: <IconLive />, label: 'Live', path: '/live-match', variant: 'live', compact: true },
        { icon: <IconMessage />, label: 'Messages', path: '/messages' },
        { icon: <IconProfile />, label: 'Profil', path: '/profile' }
      ];
    }

    const items: NavItem[] = [
      { icon: <IconFeed />, label: 'Feed', path: '/home' },
    ];

    // Explorer context changes by role
    if (userType === UserType.RECRUITER || userType === UserType.CLUB) {
      items.push({ icon: <IconNews />, label: 'Talents', path: '/explorer' });
    } else {
      items.push({ icon: <IconNews />, label: 'Actu', path: '/explorer' });
    }

    // Role-based Posting Capability
    if (userType === UserType.ATHLETE || userType === UserType.PRESS) {
      items.push({ 
        icon: <IconPerf />,
        label: userType === UserType.ATHLETE ? 'Perfs' : 'Publier', 
        path: '/create-content',
        variant: 'publish'
      });
    }

    items.push({ icon: <IconLive />, label: 'Live', path: '/live-match', variant: 'live' });
    items.push({ icon: <IconMessage />, label: 'Messages', path: '/messages' });
    items.push({ icon: <IconWallet />, label: 'Wallet', path: '/wallet' });
    items.push({ icon: <IconProfile />, label: 'Profil', path: '/profile' });

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-[100] px-2 pb-[max(env(safe-area-inset-bottom),0px)]">
      <div className="pointer-events-auto relative mx-auto flex max-w-[430px] items-end justify-between gap-1 rounded-[28px] border border-white/[0.12] bg-[#070707]/78 px-2 py-2 shadow-[0_18px_55px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.28] to-transparent" />
        <div className="pointer-events-none absolute inset-x-10 -top-6 h-12 rounded-full bg-[#19DB8A]/10 blur-2xl" />

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => {
              if (item.variant === 'live') {
                return `group relative ${item.compact ? 'flex' : '-mt-7 flex'} min-w-[54px] flex-1 flex-col items-center gap-1 rounded-[22px] px-1 ${item.compact ? 'py-2' : 'pb-2 pt-1'} transition-all duration-300 ${
                  isActive
                    ? 'text-black'
                    : 'text-white hover:text-black'
                }`;
              }

              if (item.variant === 'publish') {
                return `group relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 text-[#19DB8A] shadow-[inset_0_0_0_1px_rgba(25,219,138,0.24)]'
                    : 'text-white/50 hover:bg-white/[0.07] hover:text-white'
                }`;
              }

              return `group relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 transition-all duration-300 ${
                isActive
                  ? 'bg-[#19DB8A]/12 text-[#19DB8A] shadow-[inset_0_0_0_1px_rgba(25,219,138,0.22)]'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
              }`;
            }}
          >
            {({ isActive }) => {
              const iconSize = item.variant === 'live' ? (item.compact ? 22 : 25) : item.variant === 'publish' ? (item.compact ? 21 : 23) : 21;

              if (item.variant === 'live') {
                return (
                  <>
                    <div className={`relative flex ${item.compact ? 'h-9 w-9 rounded-xl' : 'h-[54px] w-[54px] rounded-[20px]'} items-center justify-center border transition-all duration-300 ${
                      isActive
                        ? 'border-[#19DB8A] bg-[#19DB8A] shadow-[0_16px_35px_rgba(25,219,138,0.35)]'
                        : 'border-[#FF8A3C]/55 bg-gradient-to-br from-[#FF8A3C] to-[#19DB8A] shadow-[0_14px_32px_rgba(255,138,60,0.28)] group-hover:shadow-[0_16px_36px_rgba(25,219,138,0.32)]'
                    }`}>
                      <span className={`absolute -right-0.5 -top-0.5 flex ${item.compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'}`}>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
                        <span className={`relative inline-flex ${item.compact ? 'h-2.5 w-2.5 border' : 'h-3.5 w-3.5 border-2'} rounded-full border-black bg-red-500`} />
                      </span>
                      {React.cloneElement(item.icon, { size: iconSize, className: 'relative z-10' })}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] transition-colors ${
                      isActive ? 'bg-[#19DB8A] text-black' : 'bg-white/10 text-white'
                    }`}>
                      Live
                    </span>
                  </>
                );
              }

              return (
                <>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'scale-105 bg-white/[0.08]'
                      : 'group-hover:-translate-y-0.5'
                  }`}>
                    {React.cloneElement(item.icon, { size: iconSize, className: 'relative z-10' })}
                  </div>
                  <span className={`max-w-[58px] truncate text-[8px] font-black uppercase tracking-tight transition-all duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-60'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute -top-0.5 h-1 w-5 rounded-full bg-[#19DB8A] shadow-[0_0_12px_rgba(25,219,138,0.8)]" />
                  )}
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
