
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchGroupDetails, addGroupMember, createBillInDb, fetchBills as fetchBillsDb } from '../services/db';
import { Group, Bill, BillParticipant } from '../types';
import { useBills } from '../contexts';

const GroupDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { users: allUsers, currentUser, bills, addBill } = useBills();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [activeModal, setActiveModal] = useState<'add_member' | 'totals' | 'settle' | 'settings' | null>(null);

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
      if (!id) return;
      setLoading(true);
      const data = await fetchGroupDetails(id);
      setGroup(data);
      setLoading(false);
  };

  const handleAddMember = async (userId: string | number) => {
      if (!group) return;
      try {
          await addGroupMember(group.id, userId);
          await loadGroupData();
          setActiveModal(null);
      } catch (err) {
          console.error("Failed to add member", err);
          alert("Failed to add member");
      }
  };

  // --- Dynamic Group Bill Logic ---
  // A bill belongs to this group if ALL its participants are members of the group
  const groupBills = useMemo(() => {
      if (!group || !bills) return [];
      const memberIds = new Set(group.members.map(m => String(m.id)));
      
      return bills.filter(bill => {
          // Check if payer is in group
          if (!memberIds.has(String(bill.payerId))) return false;
          // Check if all participants are in group
          return bill.participants.every(p => memberIds.has(String(p.userId)));
      });
  }, [group, bills]);

  // --- Balance Calculation ---
  const balances = useMemo(() => {
      const bal: Record<string, number> = {};
      
      // Initialize 0
      group?.members.forEach(m => bal[String(m.id)] = 0);

      groupBills.forEach(bill => {
          if (bill.status === 'settled') return; // Skip settled bills (or handle them as payments)

          // Credit the payer (they put money IN)
          const payerId = String(bill.payerId);
          bal[payerId] = (bal[payerId] || 0) + bill.amount;

          // Debit the participants (they took value OUT)
          bill.participants.forEach(p => {
              const pid = String(p.userId);
              bal[pid] = (bal[pid] || 0) - p.amount;
          });
      });

      return bal;
  }, [groupBills, group]);

  const groupTotalSpending = groupBills.reduce((sum, b) => sum + b.amount, 0);
  const myBalance = balances[String(currentUser?.id)] || 0;

  // --- Actions ---

  const handleSettleUp = async () => {
      if (!group) return;

      // Find who I owe (anyone with a positive balance)
      // For simplicity in this demo, we just "Pay" the group/creates a settlement bill
      // In a real app, you'd verify WHO you are paying. 
      // Here we assume we are paying back into the pool (or the person owed most).
      
      const settlementAmount = Math.abs(myBalance);
      
      if (settlementAmount < 0.01) {
          setActiveModal(null);
          return;
      }

      const settlementBill: Bill = {
          id: Date.now().toString(),
          title: `Settlement: ${currentUser.name}`,
          amount: settlementAmount,
          date: 'Just now',
          status: 'settled',
          category: 'transfer',
          description: `${currentUser.name} settled up with ${group.name}`,
          payerId: currentUser.id,
          participants: [
              { userId: currentUser.id, name: currentUser.name, img: currentUser.img, amount: settlementAmount, paid: true }
          ]
      };

      try {
          await createBillInDb(settlementBill);
          addBill(settlementBill); // Update context
          setActiveModal(null);
          alert("Settled up successfully!");
      } catch (e) {
          console.error("Settlement failed", e);
          alert("Failed to settle up");
      }
  };

  // --- Helpers ---

  // Filter users not already in group
  const potentialMembers = allUsers.filter(u => 
      group && !group.members.some(m => String(m.id) === String(u.id))
  );

  // Helper to get initials (e.g., "TE")
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-background-dark text-white">
              <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!group) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background-dark text-white">
            <p>Group not found</p>
            <button onClick={() => navigate('/groups')} className="text-primary mt-4 font-bold">Go Back</button>
        </div>
      );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-[#10221e] font-display overflow-hidden">
       {/* Top App Bar */}
       <div className="sticky top-0 z-10 flex items-center p-4 pb-2 justify-between">
        <button 
          onClick={() => navigate('/groups')}
          className="flex size-12 shrink-0 items-center justify-start text-white hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center text-white">{group.name}</h2>
        <div className="flex w-12 items-center justify-end">
          <button 
            onClick={() => setActiveModal('settings')}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal min-w-0 p-0 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-2xl">settings</span>
          </button>
        </div>
      </div>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
          {/* Group Header Card */}
          <div className="mx-4 mt-8 mb-8 flex flex-col items-center justify-center bg-[#152a25] rounded-[2rem] p-12 shadow-sm border border-white/5">
             <div className="size-24 rounded-[1.5rem] bg-[#1a3830] flex items-center justify-center text-primary mb-6 shadow-inner">
                <span className="material-symbols-outlined text-[3rem]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>{group.img || 'home'}</span>
             </div>
             <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{group.name}</h1>
             <p className="text-white/40 font-medium text-lg">{group.members.length} members</p>
          </div>

          {/* Members Header */}
          <div className="mx-4 mb-3 flex items-center justify-between px-1">
             <h3 className="text-white text-lg font-bold">Members</h3>
             <button 
                onClick={() => setActiveModal('add_member')} 
                className="text-primary text-sm font-bold flex items-center gap-1 hover:text-primary/80 transition-colors"
             >
                 + Add Member
             </button>
          </div>
          
          {/* Members List Container */}
          <div className="mx-4 bg-[#152a25] rounded-2xl overflow-hidden border border-white/5">
              {group.members.map((member, idx) => {
                  const isMe = String(member.id) === String(currentUser.id);
                  const displayName = isMe ? 'You' : member.name;
                  const initials = getInitials(displayName);
                  const memberBalance = balances[String(member.id)] || 0;
                  
                  // Format Balance Text
                  let balanceText = "Settled";
                  let balanceColor = "text-white/40";

                  if (memberBalance > 0.01) {
                      balanceText = `Gets back $${memberBalance.toFixed(2)}`;
                      balanceColor = "text-primary";
                  } else if (memberBalance < -0.01) {
                      balanceText = `Owes $${Math.abs(memberBalance).toFixed(2)}`;
                      balanceColor = "text-rose-400";
                  }

                  return (
                      <div key={member.id} className={`flex items-center gap-4 p-4 ${idx !== group.members.length - 1 ? 'border-b border-white/5' : ''}`}>
                          {/* Avatar: Green Circle, Dark Text */}
                          <div className="size-12 rounded-full bg-primary flex items-center justify-center text-[#10221e] font-bold text-sm shrink-0 tracking-wide">
                             {initials}
                          </div>
                          <div className="flex-1">
                              <p className="text-white font-bold text-base tracking-wide">
                                  {displayName}
                              </p>
                              <p className={`${balanceColor} text-xs font-bold tracking-wide`}>{balanceText}</p>
                          </div>
                      </div>
                  );
              })}
          </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-[#10221e] border-t border-white/5 pb-8">
          <div className="flex gap-4">
            <button 
                onClick={() => setActiveModal('settle')}
                className="flex-1 py-4 bg-[#152a25] text-primary font-bold rounded-[1.2rem] text-base hover:bg-[#1a3830] active:scale-[0.98] transition-all"
            >
                Settle Up
            </button>
            <button 
                onClick={() => setActiveModal('totals')}
                className="flex-1 py-4 bg-white/5 text-white font-bold rounded-[1.2rem] text-base hover:bg-white/10 active:scale-[0.98] transition-all"
            >
                Totals
            </button>
          </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Member Modal */}
      {activeModal === 'add_member' && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setActiveModal(null)}>
              <div className="w-full bg-[#152a25] rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[80vh] flex flex-col border-t border-white/10" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Add People</h3>
                    <button onClick={() => setActiveModal(null)} className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pb-8">
                    {potentialMembers.length === 0 ? (
                        <p className="text-center text-white/50 py-8">No other contacts to add.</p>
                    ) : (
                        potentialMembers.map(u => (
                            <div key={u.id} onClick={() => handleAddMember(u.id)} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                                <div className="size-10 rounded-full bg-primary flex items-center justify-center text-[#10221e] font-bold text-xs shrink-0">
                                    {getInitials(u.name)}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{u.name}</p>
                                    <p className="text-white/50 text-xs">{u.handle}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="material-symbols-outlined text-primary">add_circle</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
              </div>
          </div>
      )}

      {/* Totals Modal */}
      {activeModal === 'totals' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setActiveModal(null)}>
              <div className="w-[90%] max-w-sm bg-[#152a25] rounded-3xl p-6 border border-white/10 animate-pop-in" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Group Totals</h3>
                      <button onClick={() => setActiveModal(null)}><span className="material-symbols-outlined text-white/60">close</span></button>
                  </div>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {group.members.map(member => {
                          const bal = balances[String(member.id)] || 0;
                          const isMe = String(member.id) === String(currentUser.id);
                          const name = isMe ? 'You' : member.name;
                          const initials = getInitials(name);
                          
                          if (Math.abs(bal) < 0.01) return null; // Skip if settled

                          return (
                            <div key={member.id} className="bg-black/20 p-4 rounded-2xl flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-primary text-[#10221e] flex items-center justify-center font-bold text-xs">{initials}</div>
                                    <span className="text-white font-medium truncate max-w-[120px]">{name} {bal > 0 ? 'gets' : 'owes'}</span>
                                </div>
                                <span className={`${bal > 0 ? 'text-primary' : 'text-rose-400'} font-bold text-lg`}>
                                    ${Math.abs(bal).toFixed(2)}
                                </span>
                            </div>
                          );
                      })}
                      {Object.values(balances).every(b => Math.abs(b) < 0.01) && (
                          <div className="text-center py-4 text-white/50">
                              <span className="material-symbols-outlined text-4xl mb-2">thumb_up</span>
                              <p>Everyone is settled up!</p>
                          </div>
                      )}
                      
                      <div className="border-t border-white/10 pt-4 mt-2">
                          <p className="text-center text-white/40 text-sm">Total group spending: ${groupTotalSpending.toFixed(2)}</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setActiveModal(null)}>
               <div className="w-full bg-[#152a25] rounded-t-3xl p-6 pb-12 animate-slide-up border-t border-white/10" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                  <button className="w-full py-4 bg-white/5 rounded-2xl text-white font-medium text-left px-6 mb-3 hover:bg-white/10 flex items-center justify-between">
                      Edit Group Name <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button className="w-full py-4 bg-rose-500/10 rounded-2xl text-rose-500 font-medium text-left px-6 hover:bg-rose-500/20 flex items-center justify-between">
                      Leave Group <span className="material-symbols-outlined">logout</span>
                  </button>
               </div>
          </div>
      )}

      {/* Settle Up Modal */}
      {activeModal === 'settle' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setActiveModal(null)}>
              <div className="w-[85%] max-w-sm bg-[#152a25] rounded-3xl p-6 text-center border border-white/10 animate-pop-in" onClick={e => e.stopPropagation()}>
                  <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                      <span className="material-symbols-outlined text-3xl">check</span>
                  </div>
                  {myBalance < -0.01 ? (
                      <>
                        <h3 className="text-xl font-bold text-white mb-2">Settle Up?</h3>
                        <p className="text-white/60 mb-6">
                            You owe <strong>${Math.abs(myBalance).toFixed(2)}</strong>. 
                            Are you sure you want to record this payment?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold">Cancel</button>
                            <button onClick={handleSettleUp} className="flex-1 py-3 bg-primary text-[#10221e] rounded-xl font-bold">Confirm</button>
                        </div>
                      </>
                  ) : (
                      <>
                        <h3 className="text-xl font-bold text-white mb-2">You're All Good!</h3>
                        <p className="text-white/60 mb-6">
                            You don't owe anything to this group right now.
                        </p>
                        <button onClick={() => setActiveModal(null)} className="w-full py-3 bg-white/5 text-white rounded-xl font-bold">Close</button>
                      </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default GroupDetails;
