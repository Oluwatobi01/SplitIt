import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  avatars: string[];
  type: 'owe' | 'owed';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, avatars, type }) => {
  const isOwed = type === 'owed';
  const progressWidth = isOwed ? (amount > 0 ? '70%' : '0%') : (amount > 0 ? '40%' : '0%');
  const barColor = isOwed ? 'bg-primary' : 'bg-rose-500';

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-slate-200/50 dark:bg-white/5 p-5 min-w-[280px] shadow-sm backdrop-blur-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">{title}</p>
          <p className="text-slate-900 dark:text-white text-3xl font-bold leading-normal mt-1">${amount.toFixed(2)}</p>
        </div>
        <div className="flex -space-x-2">
          {avatars.map((src, i) => (
             <img key={i} alt="Avatar" className="inline-block size-10 rounded-full ring-2 ring-background-light dark:ring-background-dark object-cover" src={src}/>
          ))}
          {isOwed && (
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600 ring-2 ring-background-light dark:ring-background-dark text-xs font-bold text-slate-800 dark:text-white">+</div>
          )}
        </div>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden mt-2">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: progressWidth }}></div>
      </div>
    </div>
  );
};

export default SummaryCard;
