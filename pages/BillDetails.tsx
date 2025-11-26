import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBills } from '../contexts';

const BillDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { bills, currentUser } = useBills();

  const bill = bills.find(b => b.id === id);

  if (!bill) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
            <p className="text-slate-900 dark:text-white">Bill not found</p>
            <button onClick={() => navigate('/dashboard')} className="ml-4 text-primary">Go Home</button>
        </div>
    );
  }

  // Calculate stats for this specific bill
  const myParticipation = bill.participants.find(p => p.userId === currentUser.id);
  const myShare = myParticipation ? myParticipation.amount : 0;
  const isPaid = myParticipation ? myParticipation.paid : false;

  const totalPaid = bill.participants.reduce((acc, p) => p.paid ? acc + p.amount : acc, 0);
  
  // Progress Circle
  const percentage = (totalPaid / bill.amount) * 100;
  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark transition-colors duration-300">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 p-4 pb-2 justify-between backdrop-blur-sm">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex size-12 shrink-0 items-center justify-start text-slate-800 dark:text-white"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center text-slate-800 dark:text-white">Bill Details</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-transparent text-slate-800 dark:text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
            <span className="material-symbols-outlined text-2xl">more_vert</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-28">
        {/* Bill Summary Card */}
        <div className="flex flex-col items-stretch justify-start rounded-2xl bg-white dark:bg-zinc-900 shadow-sm mt-4">
          <div className="flex w-full flex-col items-center justify-center gap-1 p-6">
            <p className="text-xl font-bold leading-tight tracking-[-0.015em] text-slate-800 dark:text-white">{bill.title}</p>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-base font-normal leading-normal text-slate-500 dark:text-slate-400">Total: ${bill.amount.toFixed(2)}</p>
              <p className="text-base font-normal leading-normal text-slate-500 dark:text-slate-400">{bill.date}</p>
            </div>
          </div>
        </div>

        {/* Progress Donut Chart */}
        <div className="relative py-8">
          <svg className="w-full h-auto max-w-[300px] mx-auto" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle className="stroke-slate-200 dark:stroke-zinc-800" cx="50" cy="50" fill="none" r="45" strokeWidth="10"></circle>
            {/* Progress Arc */}
            <circle 
                className="stroke-primary transition-all duration-1000 ease-out" 
                cx="50" cy="50" 
                fill="none" r="45" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                strokeWidth="10" 
                transform="rotate(-90 50 50)"
            ></circle>
            {/* Center Content */}
            <foreignObject height="50" width="50" x="25" y="25">
              <div 
                className="w-full h-full rounded-full bg-center bg-no-repeat aspect-square bg-cover" 
                style={{ backgroundImage: `url("${currentUser.img}")` }}
              ></div>
            </foreignObject>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-24">
            <div className="flex items-baseline gap-1 mt-6">
              <p className="text-xl font-bold text-slate-800 dark:text-white">${totalPaid.toFixed(0)}</p>
              <p className="text-base text-slate-500 dark:text-slate-400">of ${bill.amount.toFixed(0)} paid</p>
            </div>
          </div>
        </div>

        {/* My Share Section */}
        <div className="flex items-center gap-4 bg-primary/20 dark:bg-primary/10 px-4 min-h-[72px] py-3 justify-between rounded-xl mb-6">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center rounded-lg shrink-0 size-12 ${isPaid ? 'bg-primary/30 text-primary' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>
              <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>{isPaid ? 'check_circle' : 'pending'}</span>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-base font-medium leading-normal line-clamp-1 text-slate-800 dark:text-white">Your share: ${myShare.toFixed(2)}</p>
              <p className="text-sm font-normal leading-normal line-clamp-2 text-slate-600 dark:text-slate-300">{isPaid ? "You've Paid" : "Unpaid"}</p>
            </div>
          </div>
          <div className="shrink-0">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-primary/30 text-slate-800 dark:text-white text-sm font-medium leading-normal w-fit">
              <span className="truncate">Receipt</span>
            </button>
          </div>
        </div>

        {/* Participants Section Header */}
        <h3 className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-0 pb-2">Participants</h3>
        
        {/* Participant List */}
        <div className="space-y-2">
            {bill.participants.map((p) => (
                <div key={p.userId} className="flex items-center gap-4 bg-transparent px-0 min-h-[72px] py-2 justify-between">
                    <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14" style={{ backgroundImage: `url("${p.img}")` }}></div>
                        {p.paid ? (
                             <div className="absolute -bottom-1 -right-1 flex items-center justify-center size-6 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark text-white">
                                <span className="material-symbols-outlined !text-sm">check</span>
                            </div>
                        ) : (
                            <div className="absolute -bottom-1 -right-1 flex items-center justify-center size-6 bg-amber-500 rounded-full border-2 border-background-light dark:border-background-dark text-white">
                                <span className="material-symbols-outlined !text-sm">schedule</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-slate-800 dark:text-white text-base font-medium leading-normal line-clamp-1">{p.userId === currentUser.id ? 'You' : p.name}</p>
                        <p className={`${p.paid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} text-sm font-normal leading-normal line-clamp-2`}>
                            {p.paid ? `Paid $${p.amount.toFixed(2)}` : `Owes $${p.amount.toFixed(2)}`}
                        </p>
                    </div>
                    </div>
                    {!p.paid && p.userId !== currentUser.id && (
                        <div className="shrink-0">
                        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 px-4 bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-white text-sm font-medium leading-normal w-fit active:scale-95 transition-transform">
                            <span className="truncate">Nudge</span>
                        </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-light to-transparent dark:from-background-dark dark:to-transparent">
        <button 
          onClick={() => navigate('/split-with')}
          className="w-full flex min-h-[56px] items-center justify-center gap-2 overflow-hidden rounded-full bg-primary text-background-dark text-lg font-bold leading-normal tracking-[-0.015em] shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          <span className="truncate">Add Person</span>
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
};

export default BillDetails;
