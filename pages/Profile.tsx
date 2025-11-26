
import React, { useState, useMemo, useRef } from 'react';
import { useTheme, useAuth, useBills } from '../contexts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

type ModalType = 'edit' | 'payment' | 'notifications' | 'security' | 'help' | null;

const Profile: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { currentUser, bills, users } = useBills();
  const navigate = useNavigate();

  // Local state for modals and forms
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  
  // Edit Profile Form State
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editHandle, setEditHandle] = useState(currentUser?.handle || '');
  const [editImg, setEditImg] = useState(currentUser?.img || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Dynamic Stats Calculations ---
  const stats = useMemo(() => {
    if (!currentUser) return { total: 0, paid: 0, friends: 0 };

    // Total Split: Sum of all bills I'm involved in (either paid or owe)
    const totalSplit = bills.reduce((acc, bill) => {
        // If I am the payer, add full amount
        if (bill.payerId === currentUser.id) return acc + bill.amount;
        // If I am a participant, add my share
        const myPart = bill.participants.find(p => p.userId === currentUser.id);
        return acc + (myPart ? myPart.amount : 0);
    }, 0);

    // Bills Paid: Number of bills where I am the payer
    const billsPaidCount = bills.filter(b => b.payerId === currentUser.id).length;

    // Friends: Total users in the system minus me
    const friendsCount = Math.max(0, users.length - 1);

    return {
        total: totalSplit,
        paid: billsPaidCount,
        friends: friendsCount
    };
  }, [bills, users, currentUser]);

  const handleLogout = async () => {
      await signOut();
      navigate('/'); // Redirect to Onboarding
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file size (limit to 2MB for base64 safety)
      if (file.size > 2 * 1024 * 1024) {
          alert("Image is too large. Please choose an image under 2MB.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          setEditImg(reader.result as string);
      };
      reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          const { error } = await supabase
            .from('profiles')
            .update({ 
                name: editName, 
                handle: editHandle,
                img: editImg // Update the image string (URL or Base64)
            })
            .eq('id', currentUser.id);

          if (error) throw error;
          
          // Simple reload to refresh context (in a larger app, we'd update context directly)
          window.location.reload();
      } catch (err) {
          console.error("Failed to update profile", err);
          alert("Failed to update profile. Please try again.");
      } finally {
          setLoading(false);
          setActiveModal(null);
      }
  };

  const openEditModal = () => {
      setEditName(currentUser.name);
      setEditHandle(currentUser.handle);
      setEditImg(currentUser.img);
      setActiveModal('edit');
  };

  // --- Modal Components (Inline for simplicity) ---

  const ModalOverlay = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up sm:animate-pop-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                  <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20">
                      <span className="material-symbols-outlined text-xl">close</span>
                  </button>
              </div>
              {children}
          </div>
      </div>
  );

  return (
    <div className="relative mx-auto flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark transition-colors duration-300">
      
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 p-4 pb-2 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="flex size-12 shrink-0 items-center justify-start">
             <button onClick={() => navigate(-1)} className="text-zinc-900 dark:text-white p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                 <span className="material-symbols-outlined">arrow_back</span>
             </button>
        </div>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white">My Profile</h1>
        <div className="flex w-12 items-center justify-end">
          <button onClick={openEditModal} className="flex h-12 max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-transparent p-0 text-zinc-900 dark:text-white">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4">
        {/* Profile Header */}
        <section className="flex w-full flex-col items-center gap-4 py-6">
          <div className="relative group cursor-pointer" onClick={openEditModal}>
            <div 
                className="h-32 w-32 rounded-full bg-cover bg-center bg-no-repeat shadow-lg border-4 border-white dark:border-white/10 group-hover:opacity-90 transition-opacity" 
                style={{ backgroundImage: `url("${currentUser.img || 'https://ui-avatars.com/api/?background=random'}")` }}
            ></div>
            <div className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-background-light dark:border-background-dark bg-primary text-background-dark">
              <span className="material-symbols-outlined !text-lg">edit</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white">{currentUser.name}</p>
            <p className="text-base font-normal leading-normal text-zinc-500 dark:text-zinc-400">{currentUser.handle}</p>
          </div>
          <button 
            onClick={openEditModal}
            className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-200 px-6 text-sm font-bold leading-normal tracking-[0.015em] text-zinc-900 dark:bg-white/10 dark:text-white hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors"
          >
            Edit Profile
          </button>
        </section>

        {/* Stats Snippet */}
        <section className="flex flex-wrap gap-3">
          <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-2xl bg-zinc-200 p-4 dark:bg-white/10">
            <p className="text-sm font-medium leading-normal text-zinc-600 dark:text-zinc-300">Total Split</p>
            <p className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">${stats.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
          <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-2xl bg-zinc-200 p-4 dark:bg-white/10">
            <p className="text-sm font-medium leading-normal text-zinc-600 dark:text-zinc-300">Bills Paid</p>
            <p className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">{stats.paid}</p>
          </div>
          <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-2xl bg-zinc-200 p-4 dark:bg-white/10">
            <p className="text-sm font-medium leading-normal text-zinc-600 dark:text-zinc-300">Friends</p>
            <p className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">{stats.friends}</p>
          </div>
        </section>

        {/* Settings List */}
        <div className="mt-8 flex flex-col gap-2">
          {/* Account Section */}
          <h3 className="px-2 pb-1 pt-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Account</h3>
          
          <div onClick={openEditModal} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-zinc-200 p-3 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
              <p className="flex-1 truncate text-base font-medium leading-normal text-zinc-900 dark:text-white">Personal Information</p>
            </div>
            <div className="shrink-0">
              <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">chevron_right</span>
            </div>
          </div>

          <div onClick={() => setActiveModal('payment')} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-zinc-200 p-3 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">credit_card</span>
              </div>
              <p className="flex-1 truncate text-base font-medium leading-normal text-zinc-900 dark:text-white">Payment Methods</p>
            </div>
            <div className="shrink-0">
              <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">chevron_right</span>
            </div>
          </div>

          {/* App Preferences Section */}
          <h3 className="px-2 pb-1 pt-4 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Preferences</h3>
          
          <div onClick={() => setActiveModal('notifications')} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-zinc-200 p-3 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">notifications</span>
              </div>
              <p className="flex-1 truncate text-base font-medium leading-normal text-zinc-900 dark:text-white">Notifications</p>
            </div>
            <div className="shrink-0">
              <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">chevron_right</span>
            </div>
          </div>
          
          {/* Dark Mode Toggle */}
          <div className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-zinc-200 p-3 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">palette</span>
              </div>
              <p className="flex-1 truncate text-base font-medium leading-normal text-zinc-900 dark:text-white">Dark Mode</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center" htmlFor="dark-mode-toggle">
              <input 
                checked={isDark} 
                onChange={toggleTheme}
                className="peer sr-only" 
                id="dark-mode-toggle" 
                type="checkbox"
              />
              <div className="switch-bg h-7 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600 peer-checked:bg-primary transition-colors"></div>
              <div className="switch-dot absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </label>
          </div>

          <div onClick={() => setActiveModal('security')} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-zinc-200 p-3 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <p className="flex-1 truncate text-base font-medium leading-normal text-zinc-900 dark:text-white">Security</p>
            </div>
            <div className="shrink-0">
              <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">chevron_right</span>
            </div>
          </div>

          {/* Support Section */}
          <h3 className="px-2 pb-1 pt-4 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Support</h3>
          
          <div onClick={() => setActiveModal('help')} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-zinc-200 p-3 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">help_center</span>
              </div>
              <p className="flex-1 truncate text-base font-medium leading-normal text-zinc-900 dark:text-white">Help Center</p>
            </div>
            <div className="shrink-0">
              <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">chevron_right</span>
            </div>
          </div>

          <div 
            onClick={handleLogout}
            className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-zinc-200 p-3 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 transition-colors mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">logout</span>
              </div>
              <p className="flex-1 truncate text-base font-medium leading-normal text-red-500 dark:text-red-400">Log Out</p>
            </div>
          </div>
        </div>
        <div className="pb-24"></div> 
      </main>

      {/* --- MODALS --- */}

      {/* Edit Profile Modal */}
      {activeModal === 'edit' && (
          <ModalOverlay title="Edit Profile" onClose={() => setActiveModal(null)}>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Image Upload */}
                  <div className="flex justify-center">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div 
                            className="h-28 w-28 rounded-full bg-cover bg-center bg-no-repeat shadow-lg border-4 border-slate-200 dark:border-white/10" 
                            style={{ backgroundImage: `url("${editImg || 'https://ui-avatars.com/api/?background=random'}")` }}
                        ></div>
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                      <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          className="w-full rounded-xl border-none bg-slate-100 dark:bg-white/5 p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Handle</label>
                      <input 
                          type="text" 
                          value={editHandle} 
                          onChange={e => setEditHandle(e.target.value)}
                          className="w-full rounded-xl border-none bg-slate-100 dark:bg-white/5 p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                      />
                  </div>
                  <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-3 bg-primary rounded-xl text-black font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                      {loading ? 'Saving...' : 'Save Changes'}
                  </button>
              </form>
          </ModalOverlay>
      )}

      {/* Payment Methods Modal */}
      {activeModal === 'payment' && (
          <ModalOverlay title="Payment Methods" onClose={() => setActiveModal(null)}>
              <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-500">credit_card</span>
                          <div>
                              <p className="text-slate-900 dark:text-white font-medium">Visa ending in 4242</p>
                              <p className="text-xs text-slate-500">Expires 12/25</p>
                          </div>
                      </div>
                      <span className="text-primary text-sm font-bold">Default</span>
                  </div>
                  <button className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">add</span> Add New Card
                  </button>
              </div>
          </ModalOverlay>
      )}

      {/* Notifications Modal */}
      {activeModal === 'notifications' && (
          <ModalOverlay title="Notifications" onClose={() => setActiveModal(null)}>
              <div className="space-y-4">
                  {['Push Notifications', 'Email Alerts', 'SMS Updates', 'New Bill Alerts', 'Payment Reminders'].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2">
                          <span className="text-slate-900 dark:text-white font-medium">{item}</span>
                          <label className="relative inline-flex cursor-pointer items-center">
                              <input defaultChecked={true} type="checkbox" className="peer sr-only" />
                              <div className="switch-bg h-6 w-11 rounded-full bg-slate-300 dark:bg-zinc-600 peer-checked:bg-primary transition-colors"></div>
                              <div className="switch-dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                          </label>
                      </div>
                  ))}
              </div>
          </ModalOverlay>
      )}

       {/* Security Modal */}
       {activeModal === 'security' && (
          <ModalOverlay title="Security" onClose={() => setActiveModal(null)}>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-2">
                       <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-slate-500">fingerprint</span>
                            <span className="text-slate-900 dark:text-white font-medium">Biometric Login</span>
                       </div>
                       <label className="relative inline-flex cursor-pointer items-center">
                              <input defaultChecked={false} type="checkbox" className="peer sr-only" />
                              <div className="switch-bg h-6 w-11 rounded-full bg-slate-300 dark:bg-zinc-600 peer-checked:bg-primary transition-colors"></div>
                              <div className="switch-dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                        </label>
                  </div>
                  <button className="w-full py-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-left px-4">
                      Change Password
                  </button>
                  <button className="w-full py-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-left px-4">
                      Two-Factor Authentication
                  </button>
               </div>
          </ModalOverlay>
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
          <ModalOverlay title="Help Center" onClose={() => setActiveModal(null)}>
              <div className="space-y-4">
                 <div className="bg-primary/10 p-4 rounded-xl mb-4">
                     <p className="text-primary font-bold mb-1">Need urgent help?</p>
                     <p className="text-sm text-slate-600 dark:text-slate-300">Contact our support team directly at support@splitit.app</p>
                 </div>
                 {['How to split a bill?', 'Connecting a bank account', 'Inviting friends', 'Exporting data'].map((faq, i) => (
                     <div key={i} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10">
                         <span className="text-slate-900 dark:text-white text-sm">{faq}</span>
                         <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                     </div>
                 ))}
              </div>
          </ModalOverlay>
      )}

    </div>
  );
};

export default Profile;
