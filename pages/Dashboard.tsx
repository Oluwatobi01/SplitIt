
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBills } from '../contexts';
import SummaryCard from '../components/SummaryCard';
import ActiveBillItem from '../components/ActiveBillItem';
import { createBillInDb } from '../services/db';
import { Bill } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { bills, currentUser, users, addBill } = useBills();
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'notifications' | 'settle' | 'remind' | null>(null);

  // --- Calculations ---
  
  // Total I Owe: Sum of my share in bills where I am NOT the payer and status is 'owe'
  const totalYouOwe = bills
    .filter(b => b.payerId !== currentUser.id && b.status !== 'settled')
    .reduce((acc, bill) => {
        const myPart = bill.participants.find(p => p.userId === currentUser.id);
        return acc + (myPart ? myPart.amount : 0);
    }, 0);

  // Total Owed to Me: Sum of everyone else's share in bills where I AM the payer
  const totalYouAreOwed = bills
    .filter(b => b.payerId === currentUser.id && b.status !== 'settled')
    .reduce((acc, bill) => {
        const othersAmount = bill.participants
            .filter(p => p.userId !== currentUser.id)
            .reduce((sum, p) => sum + p.amount, 0);
        return acc + othersAmount;
    }, 0);

  // Mock Avatar sets for summary cards
  const oweAvatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB7bWO0ARimHLT6-KGr97R6YOQsEqTrPi870JLrfn_HGZ60BDZhqBumjOKbUdqZwTKEVy98HO7vLMSOxgxyX-o583QGUft58IlWRwtXfj2dVJ0eZZ2bl3SRiL3-lh28sc6TUmKz-7_CtnvX0bNpmwee5mOXYlDseGHAUDSwAJ5WBC7GNLQSF45gqf11kJgN8o5V3t4lFilaBuf03dEfpKS4rKKmgavG2q8mK8vZtKlxr0wblDL_wNRMvJD847J-740lyIcLgpg6DSs",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA-2KIbX0nXsJIYicyM7tK4dGLRDBhgvk_kub7OKLwKT9SZgwQc4N15unnJr32i4VpdK-cKH1r1x9Nh6fC1TAyRGejZOoozfZchdRoBqz9YjWEBZJIzFqUrzvMRAYZSqpG6MsDt3zP88YFvVbYXifBauQTYYNyJ5pmqrKXIYgC3N7pwOVEstNrCQVBZ63HbM8qMm-FaCplSsyb8SRycAbOFBm0DyCckAO4kcE3NHYTkrFf2uC78vFCj_v-ay8QuUlV1ZbhN20qPEeQ"
  ];

  const owedAvatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCi6LnXDEeHOmI1jinGH0yIQWw841TzeHE-yOnmcONhvD2E7ohIhaihgTsrv0ubMyipc6H0UF8F7xsrQ0XLb7DWieCPm8T8D5bQinyCflaHaQnb5HrJl2hoI08wVpgh63Q37qz9EeJLiiU6mXrMzV6sCp2NoLP2166NVJJVG2E27T7TbhTg1peEYyIk8sJRLan22FKC2S0nGpjeFgdnV-JCQtINJ8XhPmX4x15XJC7wLV3BoxC58hyDuWgj-IjZXHL-04F8CQjXbm8",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDgeYKbBa8Cxb1J-iUk5wmqdcqFTQ8KGZobW4-rY66mmztGGGsqjSO39658z1k6Frhv1EV6sI0hbxL7S-Y9Hf4vKA50zvhyzza4XhHHL6ovcy2Eo6apVhH_TfhLwq0bUevEgE9AmlxLoi7mitoqeY-qPfAhVGjFxO4AftnZFFws7afoktnAY-NQLXmdQa7p2oZV9vG7GMHx27oCFh_9ZB74oNEfPbW0IBXNldSyKBJ7P4S-BVf6HZ36Zcg5vmvlzpxf7AT61WqscRA"
  ];

  // --- Logic for Modals ---

  // Who do I owe?
  const debts = bills
      .filter(b => b.payerId !== currentUser.id && b.status !== 'settled')
      .map(b => {
          const myPart = b.participants.find(p => p.userId === currentUser.id);
          const payer = users.find(u => String(u.id) === String(b.payerId));
          return {
              billId: b.id,
              title: b.title,
              amount: myPart ? myPart.amount : 0,
              payer: payer
          };
      })
      .filter(item => item.amount > 0);

  // Who owes me?
  const credits = bills
      .filter(b => b.payerId === currentUser.id && b.status !== 'settled')
      .flatMap(b => {
          return b.participants
              .filter(p => p.userId !== currentUser.id && !p.paid)
              .map(p => ({
                  billId: b.id,
                  title: b.title,
                  amount: p.amount,
                  user: users.find(u => String(u.id) === String(p.userId)) || { name: p.name, img: p.img }
              }));
      });

  const handleSettleDebt = async (debt: any) => {
      // Create a settlement transaction
      const settlementBill: Bill = {
          id: Date.now().toString(),
          title: `Settled: ${debt.title}`,
          amount: debt.amount,
          date: 'Just now',
          status: 'settled',
          category: 'transfer',
          description: `You paid ${debt.payer?.name || 'Unknown'} for ${debt.title}`,
          payerId: currentUser.id,
          participants: [
              { userId: currentUser.id, name: currentUser.name, img: currentUser.img, amount: debt.amount, paid: true }
          ]
      };
      
      try {
          await createBillInDb(settlementBill);
          addBill(settlementBill);
          alert(`Paid $${debt.amount} to ${debt.payer?.name}`);
          setActiveModal(null);
      } catch (e) {
          console.error(e);
          alert("Failed to process settlement");
      }
  };

  const handleSendReminder = (credit: any) => {
      // In a real app, trigger a push notification or email
      alert(`Reminder sent to ${credit.user.name} for $${credit.amount}!`);
      setActiveModal(null);
  };

  // --- Components ---

  const ModalOverlay = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up sm:animate-pop-in max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20">
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
                {children}
            </div>
        </div>
    </div>
  );

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col pb-24 animate-fade-in">
      {/* Sticky Top App Bar */}
      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg px-4 pt-4 pb-2 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shadow-sm"
              style={{ backgroundImage: `url("${currentUser.img}")` }}
            ></div>
            <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
              Hey, {currentUser.name.split(' ')[0]}!
            </h2>
          </div>
          <div className="flex items-center justify-end">
            <button 
                onClick={() => setActiveModal('notifications')}
                className="flex items-center justify-center rounded-full size-10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative"
            >
              <span className="material-symbols-outlined text-2xl text-slate-800 dark:text-white">notifications</span>
              {/* Mock Notification Dot */}
              <span className="absolute top-2 right-2 size-2.5 bg-rose-500 rounded-full border-2 border-background-light dark:border-background-dark"></span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col gap-5">
        
        {/* Carousel: Summary Cards */}
        <div className="flex overflow-x-auto no-scrollbar pt-2 pb-2">
          <div className="flex items-stretch px-4 gap-4">
            <SummaryCard 
                title="You Owe" 
                amount={totalYouOwe} 
                avatars={oweAvatars} 
                type="owe" 
            />
            <SummaryCard 
                title="You're Owed" 
                amount={totalYouAreOwed} 
                avatars={owedAvatars} 
                type="owed" 
            />
          </div>
        </div>

        {/* Actions Bar */}
        <div className="@container pt-2">
          <div className="gap-2 px-4 grid-cols-3 grid">
            <button 
              onClick={() => navigate('/scan')}
              className="flex flex-col items-center gap-2 py-2.5 text-center active:scale-95 transition-transform group"
            >
              <div className="rounded-2xl bg-primary/20 dark:bg-primary/20 p-4 group-hover:bg-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">qr_code_scanner</span>
              </div>
              <p className="text-slate-800 dark:text-white text-sm font-medium leading-normal">Scan Receipt</p>
            </button>
            <button 
                onClick={() => setActiveModal('settle')}
                className="flex flex-col items-center gap-2 py-2.5 text-center active:scale-95 transition-transform group"
            >
              <div className="rounded-2xl bg-primary/20 dark:bg-primary/20 p-4 group-hover:bg-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">payments</span>
              </div>
              <p className="text-slate-800 dark:text-white text-sm font-medium leading-normal">Settle Up</p>
            </button>
            <button 
                onClick={() => setActiveModal('remind')}
                className="flex flex-col items-center gap-2 py-2.5 text-center active:scale-95 transition-transform group"
            >
              <div className="rounded-2xl bg-primary/20 dark:bg-primary/20 p-4 group-hover:bg-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">send</span>
              </div>
              <p className="text-slate-800 dark:text-white text-sm font-medium leading-normal">Reminder</p>
            </button>
          </div>
        </div>

        {/* Section Header */}
        <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-1 pt-3">
          Active Bills
        </h2>

        {/* List of Bills */}
        <div className="flex flex-col px-4 gap-3">
          {bills.length === 0 ? (
              <div className="py-10 text-center opacity-50">
                  <p>No bills yet.</p>
              </div>
          ) : (
            bills.map((bill) => (
                <ActiveBillItem 
                    key={bill.id} 
                    bill={bill} 
                    onClick={() => navigate(`/bill-details/${bill.id}`)} 
                />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-20">
        <button 
          onClick={() => navigate('/split-with')}
          className="flex items-center justify-center size-16 bg-primary rounded-2xl shadow-lg shadow-primary/30 active:scale-90 transition-transform hover:shadow-primary/50"
        >
          <span className="material-symbols-outlined text-background-dark text-4xl" style={{ fontVariationSettings: "'wght' 600" }}>add</span>
        </button>
      </div>

      {/* --- MODALS --- */}

      {/* Notifications Modal */}
      {activeModal === 'notifications' && (
          <ModalOverlay title="Notifications" onClose={() => setActiveModal(null)}>
              <div className="space-y-4">
                  {/* Mock Notifications */}
                  <div className="flex gap-4 p-3 bg-slate-100 dark:bg-white/5 rounded-2xl items-start">
                      <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined">notifications_active</span>
                      </div>
                      <div>
                          <p className="text-slate-900 dark:text-white text-sm font-bold">New Bill Added</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Sarah added "Pizza Night"</p>
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1">2 hours ago</p>
                      </div>
                  </div>
                  <div className="flex gap-4 p-3 bg-slate-100 dark:bg-white/5 rounded-2xl items-start">
                      <div className="size-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined">waving_hand</span>
                      </div>
                      <div>
                          <p className="text-slate-900 dark:text-white text-sm font-bold">Nudge Received</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Mike nudged you for "Rent"</p>
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1">Yesterday</p>
                      </div>
                  </div>
                  <div className="flex gap-4 p-3 bg-slate-100 dark:bg-white/5 rounded-2xl items-start">
                      <div className="size-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      <div>
                          <p className="text-slate-900 dark:text-white text-sm font-bold">Payment Settled</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">You settled "Groceries" with Alex</p>
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1">2 days ago</p>
                      </div>
                  </div>
              </div>
          </ModalOverlay>
      )}

      {/* Settle Up Modal */}
      {activeModal === 'settle' && (
          <ModalOverlay title="Settle Debts" onClose={() => setActiveModal(null)}>
              {debts.length === 0 ? (
                  <div className="text-center py-10 opacity-60">
                      <span className="material-symbols-outlined text-4xl mb-2">thumb_up</span>
                      <p>You don't owe anyone!</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {debts.map((debt, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-2xl">
                              <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-full bg-cover" style={{ backgroundImage: `url("${debt.payer?.img}")` }}></div>
                                  <div>
                                      <p className="text-slate-900 dark:text-white font-bold">{debt.payer?.name}</p>
                                      <p className="text-xs text-slate-500">{debt.title}</p>
                                  </div>
                              </div>
                              <button 
                                onClick={() => handleSettleDebt(debt)}
                                className="px-4 py-2 bg-primary text-black font-bold rounded-lg text-sm hover:bg-primary/80 transition-colors"
                              >
                                  Pay ${debt.amount.toFixed(2)}
                              </button>
                          </div>
                      ))}
                  </div>
              )}
          </ModalOverlay>
      )}

      {/* Reminder Modal */}
      {activeModal === 'remind' && (
          <ModalOverlay title="Send Reminders" onClose={() => setActiveModal(null)}>
               {credits.length === 0 ? (
                  <div className="text-center py-10 opacity-60">
                      <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                      <p>No one owes you money.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {credits.map((credit, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-2xl">
                              <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-full bg-cover" style={{ backgroundImage: `url("${(credit.user as any).img}")` }}></div>
                                  <div>
                                      <p className="text-slate-900 dark:text-white font-bold">{(credit.user as any).name}</p>
                                      <p className="text-xs text-slate-500">Owes for {credit.title}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-slate-900 dark:text-white font-bold mb-1">${credit.amount.toFixed(2)}</p>
                                  <button 
                                    onClick={() => handleSendReminder(credit)}
                                    className="text-xs text-primary font-bold hover:underline"
                                  >
                                      Nudge
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </ModalOverlay>
      )}
    </div>
  );
};

export default Dashboard;
