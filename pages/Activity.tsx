
import React, { useEffect, useState, useMemo } from 'react';
import { useBills } from '../contexts';
import { fetchUserGroups } from '../services/db';

interface ActivityItem {
  id: string;
  type: 'bill' | 'settlement' | 'group' | 'nudge';
  text: React.ReactNode;
  time: string;
  icon: string;
  color: string;
  timestamp: number; // For sorting
}

const Activity: React.FC = () => {
  const { bills, currentUser, users } = useBills();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser?.id) {
        const userGroups = await fetchUserGroups(String(currentUser.id));
        setGroups(userGroups);
      }
      setLoading(false);
    };
    loadData();
  }, [currentUser]);

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // 1. Map Bills & Settlements
    bills.forEach(bill => {
      const isMe = String(bill.payerId) === String(currentUser.id);
      let payerName = isMe ? 'You' : 'Unknown';
      
      if (!isMe) {
          const payerUser = users.find(u => String(u.id) === String(bill.payerId));
          payerName = payerUser ? payerUser.name.split(' ')[0] : 'Someone';
      }

      // Check if it's a settlement (We stored settlements as bills with status 'settled')
      // OR if the title/category implies settlement
      const isSettlement = bill.status === 'settled' || bill.category === 'transfer';

      if (isSettlement) {
        items.push({
          id: `bill-${bill.id}`,
          type: 'settlement',
          text: <span><span className="font-bold">{payerName}</span> settled <span className="font-bold">"{bill.title}"</span></span>,
          time: bill.date, // Using the display date string from DB
          icon: 'check_circle',
          color: 'text-primary',
          timestamp: 0 // We rely on bill order (fetchBills returns desc) usually, but rough sort fallback
        });
      } else {
        items.push({
          id: `bill-${bill.id}`,
          type: 'bill',
          text: <span><span className="font-bold">{payerName}</span> added <span className="font-bold">"{bill.title}"</span></span>,
          time: bill.date,
          icon: 'add_circle',
          color: 'text-white', // Dark mode clean look
          timestamp: 0
        });
      }
    });

    // 2. Map Groups
    groups.forEach(group => {
      // We don't have exact 'joined_at' in the basic fetch, so we'll genericize for demo
      // In a real app, we'd compare created_at
      items.push({
        id: `group-${group.id}`,
        type: 'group',
        text: <span>You joined <span className="font-bold">"{group.name}"</span></span>,
        time: 'Recently', 
        icon: 'group_add',
        color: 'text-blue-400',
        timestamp: -1 // Put slightly later/earlier depending on logic
      });
    });

    // Since 'bills' comes pre-sorted from DB by created_at DESC, we largely respect that order.
    // However, mixing in groups without exact dates is tricky. 
    // For this demo, we'll interleave them or just append groups at the end if 'timestamp' isn't available.
    // A simple approach is just returning the list as generated, mostly dominated by bills.
    
    return items; 
  }, [bills, groups, currentUser, users]);

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col pb-24 bg-background-light dark:bg-background-dark animate-fade-in transition-colors duration-300">
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg px-4 pt-4 pb-2">
            <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">Recent Activity</h2>
        </div>

        <div className="p-4 flex flex-col gap-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                    Loading activity...
                </div>
            ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 text-center">
                    <span className="material-symbols-outlined text-5xl mb-2">history</span>
                    <p>No recent activity.</p>
                </div>
            ) : (
                activities.map((item, index) => (
                    <div key={item.id} className="flex gap-4 relative animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                        {/* Vertical Line */}
                        {index !== activities.length - 1 && (
                            <div className="absolute left-5 top-10 bottom-[-24px] w-0.5 bg-slate-200 dark:bg-white/10"></div>
                        )}
                        
                        <div className={`size-10 rounded-full bg-white dark:bg-white/5 shadow-sm flex items-center justify-center shrink-0 z-10 border border-slate-100 dark:border-white/5`}>
                            <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                        </div>
                        <div className="pt-1 pb-2">
                            <p className="text-slate-900 dark:text-white font-medium text-base leading-snug">
                                {item.text}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">{item.time}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default Activity;
