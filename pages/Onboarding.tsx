
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-white font-display overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 animate-fade-in">
        {/* Illustration */}
        <div className="w-full max-w-sm mb-12 relative">
             <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full transform scale-90"></div>
             <img 
              className="relative z-10 rounded-2xl w-full h-auto object-cover aspect-square shadow-2xl border border-white/10 rotate-3 transition-transform hover:rotate-0 duration-500" 
              alt="Friends splitting a bill" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzSppjaRDElcAW1iLhw-lIdb4nLwZkXi9gFPoeTun8rIjqTfSXPM8W6Rnhsp4i4sX6br7Fork6LZz_kg3cDitfINSczofkSMtsGk1SAd_y7yR7w2uo8Jiyezu8Qb80sOnmlrxoq4NWPpJtbi-gBvE3Sba42a6p_xjqoYQDLfWOPuniSu-ZfouudM4v1sfnBiBdbriGTTADgEhryF8f7yTajSFFYzlV_tA7Ram7U4ZjW-nV3p-EIlmaFUxKvpF9hY7oxItDYvcy5fo"
            />
        </div>

        {/* Text */}
        <div className="text-center space-y-4 max-w-md">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Stop the <span className="text-primary">awkward</span> math.
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
                Split bills, scan receipts, and settle up with friends in seconds.
            </p>
        </div>
      </div>

      {/* Buttons Area */}
      <div className="w-full p-6 pb-12 z-10 flex flex-col gap-4 max-w-md mx-auto animate-slide-up">
        <button 
          onClick={() => navigate('/signup')}
          className="w-full py-4 bg-primary text-background-dark text-lg font-bold rounded-2xl shadow-[0_0_20px_rgba(13,242,185,0.3)] hover:shadow-[0_0_30px_rgba(13,242,185,0.5)] active:scale-[0.98] transition-all"
        >
          Create Account
        </button>
        
        <button 
          onClick={() => navigate('/login')}
          className="w-full py-4 bg-white/5 text-white text-lg font-bold rounded-2xl border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
        >
          Log In
        </button>
        
        <p className="text-center text-xs text-white/30 mt-2">
            By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
