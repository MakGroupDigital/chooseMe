
import React from 'react';

const SplashPage: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50">
      <div className="relative w-32 h-32">
        {/* Logo réel de l'app */}
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-black">
          <img
            src="/assets/images/Sans_titre-4.png"
            alt="ChooseMe logo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <h1 className="mt-8 text-3xl font-readex font-bold tracking-tight text-white">
        Choose<span className="text-[#19DB8A]">-Me</span>
      </h1>
      <p className="mt-2 text-white/50 text-sm tracking-widest uppercase">
        Propulser les talents
      </p>
    </div>
  );
};

export default SplashPage;
