import React from 'react';
import { Bill } from '../types';

interface ActiveBillItemProps {
  bill: Bill;
  onClick: () => void;
}

const ActiveBillItem: React.FC<ActiveBillItemProps> = ({ bill, onClick }) => {
  
  const getIconForCategory = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'home': return 'home';
      case 'food': return 'lunch_dining';
      case 'transport': return 'local_gas_station';
      case 'shopping': return 'shopping_cart';
      case 'utility': return 'bolt';
      default: return 'receipt';
    }
  };

  const getStatusColor = (status: string, dateText: string) => {
      if (status === 'settled') return 'text-green-600 dark:text-green-500';
      if (dateText.toLowerCase().includes('due')) return 'text-rose-500 dark:text-rose-400';
      return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <div 
      onClick={onClick}
      className="flex gap-4 bg-slate-200/50 dark:bg-white/5 p-4 rounded-2xl justify-between items-center cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="text-slate-800 dark:text-white flex items-center justify-center rounded-xl bg-slate-300 dark:bg-slate-800/50 shrink-0 size-12">
          <span className="material-symbols-outlined text-2xl">{getIconForCategory(bill.category)}</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-slate-900 dark:text-white text-base font-bold leading-normal">{bill.title}</p>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-normal">{bill.description}</p>
          <p className={`${getStatusColor(bill.status, bill.date)} text-sm font-normal leading-normal`}>{bill.date}</p>
        </div>
      </div>
      <div className="shrink-0">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">chevron_right</span>
      </div>
    </div>
  );
};

export default ActiveBillItem;
