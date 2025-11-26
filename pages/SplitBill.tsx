
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBills } from '../contexts';
import { User, BillParticipant, ScannedReceiptData } from '../types';

const SplitBill: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addBill, currentUser } = useBills();
  
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [activeCategory, setActiveCategory] = useState('food');
  const [splitType, setSplitType] = useState<'equal' | 'unequal'>('equal');
  const [participants, setParticipants] = useState<User[]>([]);
  const [receiptItems, setReceiptItems] = useState<{name: string, price: number}[]>([]);
  
  // Store manual split amounts: userId -> amount string
  const [unequalAmounts, setUnequalAmounts] = useState<Record<string, string>>({});

  // Store scanned data locally if it exists, to pass back to SplitWith
  const [scannedDataCache, setScannedDataCache] = useState<ScannedReceiptData | undefined>(undefined);

  useEffect(() => {
    // 1. Check for Direct Scanned Data (From ScanReceipt)
    if (location.state?.scannedData) {
        const data = location.state.scannedData as ScannedReceiptData;
        setScannedDataCache(data);
        if (data.amount) setAmount(data.amount.toString());
        if (data.description) setDescription(data.description);
        if (data.category) setActiveCategory(data.category.toLowerCase());
        if (data.items) setReceiptItems(data.items);
    }
    
    // 2. Check for Preserved Data (Returned from SplitWith)
    if (location.state?.preservedData) {
        const data = location.state.preservedData;
        setAmount(data.amount);
        setDescription(data.description);
        setActiveCategory(data.category);
        if (data.scannedData) {
            setScannedDataCache(data.scannedData);
            if (data.scannedData.items) setReceiptItems(data.scannedData.items);
        }
    }

    // 3. Set Participants (From SplitWith)
    if (location.state?.participants) {
      setParticipants(location.state.participants);
    }
  }, [location.state]);

  const handleAddPeople = () => {
      // Navigate to SplitWith, but pass current state so we don't lose it
      navigate('/split-with', {
          state: {
              participants: participants,
              preservedData: {
                  amount,
                  description,
                  category: activeCategory,
                  scannedData: scannedDataCache
              }
          }
      });
  };

  // --- Calculation Logic ---
  const totalAmount = Math.abs(parseFloat(amount) || 0);
  const numberOfPeople = participants.length + 1; // Me + Friends
  
  // 1. Equal Split Calculations
  const baseShare = Math.floor((totalAmount / numberOfPeople) * 100) / 100;
  const remainder = Number((totalAmount - (baseShare * numberOfPeople)).toFixed(2));
  const myEqualShare = Number((baseShare + remainder).toFixed(2));
  const friendEqualShare = baseShare;

  // 2. Unequal Split Calculations
  const getUnequalAmount = (id: string | number) => {
      return parseFloat(unequalAmounts[String(id)] || '0');
  };

  // Calculate sum of manually entered amounts
  const currentUnequalTotal = [currentUser, ...participants].reduce((sum, p) => {
      return sum + getUnequalAmount(p.id);
  }, 0);

  const remainingToSplit = totalAmount - currentUnequalTotal;
  // Allow for tiny floating point discrepancies
  const isUnequalValid = Math.abs(remainingToSplit) < 0.01;

  // Determine My Share based on split type (for "You Owe" calculation logic if I wasn't payer, but here I am payer)
  // Actually, for the "Request" button label, we need (Total - My Share)
  const myShareFinal = splitType === 'equal' ? myEqualShare : getUnequalAmount(currentUser.id);
  const requestAmount = (totalAmount - myShareFinal).toFixed(2);

  // --- Handlers ---

  const switchToEqual = () => {
      setSplitType('equal');
  };

  const switchToUnequal = () => {
      // Pre-fill with equal amounts if switching for first time or if empty
      const newAmounts: Record<string, string> = {};
      newAmounts[String(currentUser.id)] = myEqualShare.toString();
      participants.forEach(p => {
          newAmounts[String(p.id)] = friendEqualShare.toString();
      });
      setUnequalAmounts(newAmounts);
      setSplitType('unequal');
  };

  const handleUnequalChange = (id: string | number, val: string) => {
      setUnequalAmounts(prev => ({
          ...prev,
          [String(id)]: val
      }));
  };

  const categories = [
    { id: 'food', label: 'Food', icon: 'restaurant' },
    { id: 'transport', label: 'Transport', icon: 'directions_car' },
    { id: 'rent', label: 'Rent', icon: 'home' },
    { id: 'groceries', label: 'Groceries', icon: 'shopping_cart' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping_bag' },
  ];

  const handleRequest = () => {
      if (totalAmount <= 0) return;
      
      // Validation for unequal split
      if (splitType === 'unequal' && !isUnequalValid) {
          // Provide visual feedback instead of just returning if possible, but alert works for safety
          return; 
      }

      // Construct Participants List
      const billParticipants: BillParticipant[] = [];

      if (splitType === 'equal') {
          billParticipants.push({
              userId: currentUser.id,
              name: currentUser.name,
              img: currentUser.img,
              amount: myEqualShare,
              paid: true
          });
          participants.forEach(p => {
              billParticipants.push({
                  userId: p.id,
                  name: p.name,
                  img: p.img,
                  amount: friendEqualShare,
                  paid: false
              });
          });
      } else {
          // Unequal
          billParticipants.push({
            userId: currentUser.id,
            name: currentUser.name,
            img: currentUser.img,
            amount: getUnequalAmount(currentUser.id),
            paid: true
        });
        participants.forEach(p => {
            billParticipants.push({
                userId: p.id,
                name: p.name,
                img: p.img,
                amount: getUnequalAmount(p.id),
                paid: false
            });
        });
      }

      // Generate a dynamic description if none is provided
      let billDescription = description;
      if (!billDescription) {
          billDescription = `${participants.length} people owe you $${requestAmount}`;
      } else if (participants.length === 1) {
          billDescription = `${participants[0].name} owes you $${requestAmount}`;
      } else if (participants.length > 1) {
          billDescription = `Splitting with ${participants.length} people`;
      } else {
          billDescription = 'Personal Expense';
      }

      const newBill = {
        id: Date.now().toString(),
        title: description || activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1),
        amount: totalAmount,
        date: 'Just now',
        status: 'owed' as const, // Since I paid and split, it's 'owed' to me or 'settled' if 0
        category: activeCategory,
        description: billDescription,
        payerId: currentUser.id,
        participants: billParticipants,
        receiptItems: receiptItems // Save the items to the bill
      };

      addBill(newBill);
      navigate('/dashboard');
  };

  return (
    <div className="relative flex w-full flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      {/* Top App Bar */}
      <div className="flex items-center p-4">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1">Split a Bill</h2>
        <button onClick={() => navigate('/dashboard')} className="text-slate-900 dark:text-white p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <main className="flex-1 px-4 py-2 pb-32">
        {/* Input Card */}
        <div className="rounded-3xl bg-white dark:bg-white/5 p-4 mb-6 shadow-sm">
          <div className="flex justify-center items-center pb-3 pt-6">
             <span className="text-slate-900 dark:text-white text-5xl font-bold">$</span>
             <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent border-none text-slate-900 dark:text-white tracking-tight text-5xl font-bold leading-tight text-center w-48 focus:ring-0 p-0 placeholder:text-slate-300 dark:placeholder:text-white/20"
             />
          </div>
          
          <div className="flex flex-col mb-4">
            <label className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal pb-2" htmlFor="description">Description</label>
            <input 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-slate-100 dark:bg-black/20 h-14 placeholder:text-gray-500 dark:placeholder:text-gray-500 p-4 text-base font-normal leading-normal transition-all" 
                placeholder="e.g. Dinner at The Spot" 
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {categories.map((cat) => (
                <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex h-10 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full pl-3 pr-4 transition-colors ${
                        activeCategory === cat.id 
                        ? 'bg-primary text-slate-900' 
                        : 'bg-slate-100 dark:bg-black/20 text-slate-600 dark:text-white/60'
                    }`}
                >
                    <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                    <p className="text-sm font-medium leading-normal">{cat.label}</p>
                </button>
            ))}
          </div>
        </div>

        {/* Receipt Breakdown (Hidden if no items) */}
        {receiptItems.length > 0 && (
            <div className="mb-6 animate-fade-in-up">
                 <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-3">Receipt Breakdown</h3>
                 <div className="rounded-2xl bg-slate-200/50 dark:bg-white/5 p-4 space-y-2 max-h-48 overflow-y-auto">
                    {receiptItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-slate-700 dark:text-slate-300 font-medium truncate pr-4">{item.name}</span>
                            <span className="text-slate-900 dark:text-white font-bold whitespace-nowrap">${item.price.toFixed(2)}</span>
                        </div>
                    ))}
                     <div className="border-t border-slate-300 dark:border-white/10 pt-2 mt-2 flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Scanned Total</span>
                        <span className="text-primary font-bold">${totalAmount.toFixed(2)}</span>
                    </div>
                 </div>
            </div>
        )}

        {/* Participants */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-3">With Who?</h3>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 overflow-hidden p-1 min-h-[48px]">
              {participants.length > 0 ? (
                  participants.slice(0, 5).map((p) => (
                      <img key={p.id} className="inline-block size-12 rounded-full ring-2 ring-background-light dark:ring-background-dark object-cover" alt={p.name} src={p.img}/>
                  ))
              ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm italic flex items-center">No one selected</p>
              )}
            </div>
            <button 
                onClick={handleAddPeople}
                className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-gray-400 dark:border-gray-600 bg-slate-100 dark:bg-white/5 text-gray-400 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">add</span>
            </button>
          </div>
        </div>

        {/* Split Method */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-3">How to split?</h3>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-200 dark:bg-black/20 p-1 mb-4">
            <button 
                onClick={switchToEqual}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all shadow-sm ${
                    splitType === 'equal' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/5'
                }`}
            >
                Equally
            </button>
            <button 
                onClick={switchToUnequal}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all shadow-sm ${
                    splitType === 'unequal' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/5'
                }`}
            >
                Unequally
            </button>
          </div>

          {/* Unequal Split Status Indicator */}
          {splitType === 'unequal' && (
              <div className={`text-center text-sm font-medium mb-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 ${isUnequalValid ? 'text-green-600 dark:text-green-400' : 'text-rose-500'}`}>
                  {isUnequalValid 
                      ? <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-lg">check</span> Amounts balanced</span>
                      : remainingToSplit > 0 
                          ? `$${remainingToSplit.toFixed(2)} left to split`
                          : `$${Math.abs(remainingToSplit).toFixed(2)} over allocated`
                  }
              </div>
          )}

          {/* Breakdown */}
          <div className="space-y-3 pb-24">
            {/* Me */}
            <div className="flex items-center justify-between rounded-xl bg-white dark:bg-white/5 p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <img className="size-10 rounded-full object-cover" alt="User" src={currentUser.img || 'https://ui-avatars.com/api/?background=random'}/>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">You</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Payer</p>
                </div>
              </div>
              {splitType === 'equal' ? (
                  <p className="text-lg font-bold text-slate-900 dark:text-white">${myEqualShare.toFixed(2)}</p>
              ) : (
                  <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        value={unequalAmounts[String(currentUser.id)] || ''}
                        onChange={(e) => handleUnequalChange(currentUser.id, e.target.value)}
                        className="w-20 text-right bg-transparent border-b border-slate-300 dark:border-white/20 focus:border-primary focus:outline-none p-1 font-bold text-lg text-slate-900 dark:text-white"
                        placeholder="0.00"
                        min="0"
                      />
                  </div>
              )}
            </div>
            
            {/* Friends */}
            {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white dark:bg-white/5 p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <img className="size-10 rounded-full object-cover" alt={p.name} src={p.img}/>
                  <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                </div>
                {splitType === 'equal' ? (
                     <p className="text-lg font-bold text-slate-900 dark:text-white">${friendEqualShare.toFixed(2)}</p>
                ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        value={unequalAmounts[String(p.id)] || ''}
                        onChange={(e) => handleUnequalChange(p.id, e.target.value)}
                        className="w-20 text-right bg-transparent border-b border-slate-300 dark:border-white/20 focus:border-primary focus:outline-none p-1 font-bold text-lg text-slate-900 dark:text-white"
                        placeholder="0.00"
                        min="0"
                      />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FAB */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark dark:to-transparent">
        <button 
            onClick={handleRequest}
            disabled={totalAmount <= 0 || (splitType === 'unequal' && !isUnequalValid)}
            className="w-full rounded-full bg-primary py-4 text-center text-lg font-bold text-slate-900 shadow-lg shadow-primary/30 active:scale-[0.98] transition-all hover:shadow-primary/50 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
        >
            {splitType === 'unequal' && !isUnequalValid ? 'Amounts must match total' : `Request $${requestAmount}`}
        </button>
      </div>
    </div>
  );
};

export default SplitBill;
