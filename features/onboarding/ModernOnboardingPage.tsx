import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { ChevronLeft, ChevronRight, Sparkles, Radio, ShieldCheck } from 'lucide-react';

type Step = {
  title: string;
  description: string;
  image: string;
  tag: string;
  sports: string[];
  highlights: string[];
};

const STEPS: Step[] = [
  {
    title: 'Decouvre Les Talents',
    description: "Une plateforme sportive moderne pour exposer les performances et accelerer les opportunites.",
    image: '/assets/images/people-playing-basketball.jpg',
    tag: 'TALENT',
    sports: ['⚽ Football', '🏀 Basketball', '🏃 Athletisme', '🎾 Tennis'],
    highlights: ['Profil sportif visible', 'Videos courtes impactantes', 'Audience qualifiee']
  },
  {
    title: 'Connecte Toi Aux Recruteurs',
    description: 'Clubs, scouts et medias suivent les profils, stats et videos en temps reel.',
    image: '/assets/images/childrens-playing-football.jpg',
    tag: 'RECRUTEUR',
    sports: ['🏐 Volleyball', '🤾 Handball', '🥊 Boxe', '🚴 Cyclisme'],
    highlights: ['Recherche par sport/poste', 'Decouverte rapide des talents', 'Contact direct']
  },
  {
    title: 'Vibre Avec Le Live',
    description: 'Matchs en direct, pronostics, wallet et contenu video dans une seule experience.',
    image: '/assets/images/Capture_decran_2025-03-07_a_20.04.39.png',
    tag: 'LIVE',
    sports: ['⚽ Football', '🏀 Basketball', '🎾 Tennis', '🥊 Boxe'],
    highlights: ['Pronostics en direct', 'Wallet integre', 'Fonctions securisees']
  }
];

const ModernOnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const touchStartX = useRef<number | null>(null);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    navigate('/onboarding/type');
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 45) return;
    if (delta < 0) goNext();
    if (delta > 0) goPrev();
  };

  const step = STEPS[currentStep];

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-black"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: `url(${step.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/62 to-transparent" />
      </div>

      <div className="absolute top-4 left-0 right-0 px-5 z-10 flex items-center justify-between">
        <div className="bg-black/45 border border-white/10 rounded-full px-3 py-1.5">
          <p className="text-white text-xs font-bold tracking-wider">
            CHOOSE<span className="text-[#19DB8A]">-ME</span>
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-white/80 text-sm font-semibold h-9 px-3 rounded-full bg-black/45 border border-white/10"
        >
          Passer
        </button>
      </div>

      <div className="relative h-full flex flex-col justify-end p-5 sm:p-7 pb-10 z-10">
        <div className="bg-black/42 border border-white/10 backdrop-blur-xl rounded-3xl p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="bg-[#208050] text-[10px] font-bold px-3 py-1 rounded-full text-white tracking-[0.15em]">
              {step.tag}
            </span>
            <p className="text-white/60 text-xs font-semibold">
              {currentStep + 1}/{STEPS.length}
            </p>
          </div>

          <h2 className="text-3xl sm:text-4xl font-readex font-bold text-white mb-3 leading-tight">
            {step.title}
          </h2>

          <p className="text-white/75 text-sm sm:text-base mb-4 leading-relaxed">
            {step.description}
          </p>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 mb-4">
            {step.sports.map((sport) => (
              <span
                key={sport}
                className="shrink-0 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white/90"
              >
                {sport}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <div className="bg-white/[0.06] rounded-xl px-2.5 py-2 border border-white/10 flex items-center gap-2">
              <Sparkles size={14} className="text-[#19DB8A]" />
              <span className="text-white/85 text-[11px]">{step.highlights[0]}</span>
            </div>
            <div className="bg-white/[0.06] rounded-xl px-2.5 py-2 border border-white/10 flex items-center gap-2">
              <Radio size={14} className="text-[#FF8A3C]" />
              <span className="text-white/85 text-[11px]">{step.highlights[1]}</span>
            </div>
            <div className="bg-white/[0.06] rounded-xl px-2.5 py-2 border border-white/10 flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#19DB8A]" />
              <span className="text-white/85 text-[11px]">{step.highlights[2]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="secondary"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="h-12 w-12 p-0 rounded-2xl shrink-0"
            >
              <ChevronLeft size={18} />
            </Button>
            <Button onClick={goNext} className="h-12 flex-1 text-base">
              {currentStep === STEPS.length - 1 ? 'Commencer' : 'Suivant'}
              <ChevronRight size={18} />
            </Button>
          </div>

          <Button variant="ghost" onClick={() => navigate('/login')} className="w-full h-10">
            Deja un compte ? Connexion
          </Button>

          <div className="flex gap-2 mt-4 justify-center">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === idx ? 'w-8 bg-[#19DB8A]' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernOnboardingPage;
