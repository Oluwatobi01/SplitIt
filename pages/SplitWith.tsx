
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBills } from '../contexts';
import { User, ScannedReceiptData } from '../types';

interface LocationState {
    participants?: User[];
    preservedData?: {
        amount: string;
        description: string;
        category: string;
        scannedData?: ScannedReceiptData;
    };
}

const SplitWith: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, currentUser } = useBills();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Changed to string[] to support UUIDs
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // State to hold data passed from SplitBill to preserve it
  const [preservedBillData, setPreservedBillData] = useState<LocationState['preservedData'] | null>(null);

  useEffect(() => {
    // If we have incoming participants or preserved data, load it
    const state = location.state as LocationState;
    if (state?.participants) {
        // Ensure we map to strings for comparison
        setSelectedIds(state.participants.map(u => String(u.id)));
    } else {
        // Default selection: Empty
        setSelectedIds([]);
    }

    if (state?.preservedData) {
        setPreservedBillData(state.preservedData);
    }
  }, [location.state]);

  const handleDone = () => {
    // Pass selected users AND preserved data back to the next screen
    const selectedUsers = users.filter(u => selectedIds.includes(String(u.id)));
    
    navigate('/split-bill', { 
        state: { 
            participants: selectedUsers,
            // Pass back the data we preserved so the form doesn't clear
            preservedData: preservedBillData
        } 
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Filter users based on search term and EXCLUDE current user
  const filteredUsers = users.filter(user => 
    String(user.id) !== String(currentUser.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.handle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Users currently selected (for the bottom tray)
  const selectedUsersList = users.filter(u => selectedIds.includes(String(u.id)));

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden transition-colors duration-300">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex flex-col bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button 
            onClick={() => handleDone()} 
            className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-start"
          >
            <span className="material-symbols-outlined text-3xl">arrow_back</span>
          </button>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Split with</h2>
          <div className="flex w-12 items-center justify-end">
            <button onClick={handleDone} className="text-primary text-base font-bold leading-normal tracking-[0.015em] shrink-0">
              Done
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3">
          <label className="flex flex-col h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm">
              <div className="text-slate-500 dark:text-white/50 flex border-none bg-slate-200 dark:bg-white/10 items-center justify-center pl-4 rounded-l-xl border-r-0">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-slate-200 dark:bg-white/10 focus:border-none h-full placeholder:text-slate-500 dark:placeholder:text-white/50 px-4 rounded-l-none text-base font-normal leading-normal" 
                placeholder="Who's in? Search by name or @"
              />
            </div>
          </label>
        </div>

        {/* Chips */}
        <div className="flex gap-3 px-4 pb-4 pt-1 overflow-x-auto no-scrollbar">
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary px-4 transition-transform active:scale-95">
            <p className="text-background-dark text-sm font-bold leading-normal">All</p>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-slate-200 dark:bg-white/10 px-4 transition-transform active:scale-95">
            <p className="text-slate-700 dark:text-white/80 text-sm font-medium leading-normal">Groups</p>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-slate-200 dark:bg-white/10 px-4 transition-transform active:scale-95">
            <p className="text-slate-700 dark:text-white/80 text-sm font-medium leading-normal">Favorites</p>
          </button>
        </div>
      </div>

      <main className="flex-1 pb-40">
        <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Contacts</h3>
        
        {filteredUsers.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                <p>No contacts found.</p>
             </div>
        ) : (
            filteredUsers.map(user => (
            <div key={user.id} onClick={() => toggleSelection(String(user.id))} className="flex items-center gap-4 bg-background-light dark:bg-background-dark px-4 min-h-16 justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4">
                <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border border-slate-200 dark:border-white/10" 
                style={{ backgroundImage: `url("${user.img}")` }}
                ></div>
                <div>
                <p className="text-slate-900 dark:text-white text-base font-medium leading-normal">{user.name}</p>
                <p className="text-slate-500 dark:text-white/50 text-sm font-normal leading-normal">{user.handle}</p>
                </div>
            </div>
            <div className="shrink-0">
                <div className="flex size-7 items-center justify-center">
                <input 
                    type="checkbox" 
                    checked={selectedIds.includes(String(user.id))}
                    readOnly
                    className="h-6 w-6 rounded-md border-slate-300 dark:border-white/30 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer" 
                />
                </div>
            </div>
            </div>
            ))
        )}
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-28 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 dark:bg-white/20 text-white backdrop-blur-lg shadow-lg active:scale-95 transition-transform z-20">
        <span className="material-symbols-outlined text-3xl">group_add</span>
      </button>

      {/* Selected Contacts Tray */}
      <div className={`fixed bottom-0 left-0 right-0 w-full bg-background-light/95 dark:bg-background-dark/80 backdrop-blur-md p-4 border-t border-slate-200 dark:border-white/10 pb-8 transition-transform duration-300 z-30 ${selectedUsersList.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center gap-3">
          <p className="text-slate-900 dark:text-white text-sm font-bold shrink-0">Selected ({selectedUsersList.length}):</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {selectedUsersList.map((u) => (
               <div key={u.id} className="relative shrink-0 animate-pop-in">
               <div 
                 className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border-2 border-background-light dark:border-background-dark" 
                 style={{ backgroundImage: `url("${u.img}")` }}
               ></div>
               <div 
                 onClick={() => toggleSelection(String(u.id))}
                 className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background-light dark:bg-background-dark cursor-pointer shadow-sm"
               >
                 <span className="material-symbols-outlined text-primary text-base hover:text-red-500">cancel</span>
               </div>
             </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitWith;
