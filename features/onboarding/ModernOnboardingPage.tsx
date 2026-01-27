
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { ChevronRight } from 'lucide-react';

const STEPS = [
  {
    title: "Découvre les Talents",
    description: "Une plateforme unique dédiée aux futurs champions d'Afrique. Footballeurs, basketteurs, et plus.",
    image: "/assets/images/people-playing-basketball.jpg",
    tag: "TALENT"
  },
  {
    title: "Connecte-toi aux Recruteurs",
    description: "Les plus grands clubs et agents scrutent Choose-Me à la recherche de la perle rare.",
    image: "/assets/images/childrens-playing-football.jpg",
    tag: "RECRUTEUR"
  },
  {
    title: "Vibrer en Direct",
    description: "Pronostics live, portefeuille sécurisé et récompenses exclusives. Deviens un expert.",
    image: "/assets/images/Capture_decran_2025-03-07_a_20.04.39.png",
    tag: "LIVE"
  }
];

const ModernOnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/onboarding/type');
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{ 
          backgroundImage: `url(${STEPS[currentStep].image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8 pb-12">
        <div className="mb-4">
          <span className="bg-[#208050] text-xs font-bold px-3 py-1 rounded-full text-white tracking-widest">
            {STEPS[currentStep].tag}
          </span>
        </div>

        <h2 className="text-4xl font-readex font-bold text-white mb-4 transition-all">
          {STEPS[currentStep].title}
        </h2>
        
        <p className="text-white/70 text-lg mb-10 max-w-sm leading-relaxed">
          {STEPS[currentStep].description}
        </p>

        <div className="flex flex-col gap-4">
          <Button onClick={() => navigate('/onboarding/register')} className="w-full py-4 text-lg">
            {currentStep === STEPS.length - 1 ? "Commencer" : "Suivant"}
            <ChevronRight size={20} />
          </Button>
          
          <Button variant="ghost" onClick={() => navigate('/login')} className="w-full">
            Déjà un compte ? Connexion
          </Button>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2 mt-8 justify-center">
          {STEPS.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep === idx ? 'w-8 bg-[#19DB8A]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernOnboardingPage;
