
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserType } from '../types';
import { IconFeed, IconNews, IconPerf, IconLive, IconWallet, IconProfile } from './Icons';

interface BottomNavProps {
  userType: UserType;
}

const BottomNav: React.FC<BottomNavProps> = ({ userType }) => {
  const getNavItems = () => {
    const items = [
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
        path: '/create-content' 
      });
    }

    items.push({ icon: <IconLive />, label: 'Live', path: '/live-match' });
    items.push({ icon: <IconWallet />, label: 'Wallet', path: '/wallet' });
    items.push({ icon: <IconProfile />, label: 'Profil', path: '/profile' });

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/5 px-4 pt-3 pb-8 flex justify-between items-center z-[100] shadow-[0_-15px_40px_rgba(0,0,0,0.9)]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center flex-1 gap-1.5 transition-all duration-300 relative ${
              isActive ? 'text-[#19DB8A]' : 'text-white/40 hover:text-white/70'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-bold tracking-tight uppercase transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-3 w-1 h-1 bg-[#19DB8A] rounded-full shadow-[0_0_12px_#19DB8A]" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
