
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBills } from '../contexts';
import { fetchUserGroups, createGroup } from '../services/db';
import { Group } from '../types';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useBills();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [currentUser]);

  const loadGroups = async () => {
      setLoading(true);
      if (currentUser?.id) {
          const data = await fetchUserGroups(String(currentUser.id));
          setGroups(data);
      }
      setLoading(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGroupName.trim()) return;

      setCreateLoading(true);
      try {
          // Random icon for now
          const icons = ['home', 'flight', 'playing_cards', 'shopping_bag', 'restaurant', 'sports_bar'];
          const randomIcon = icons[Math.floor(Math.random() * icons.length)];

          await createGroup(newGroupName, String(currentUser.id), randomIcon);
          await loadGroups();
          setShowModal(false);
          setNewGroupName('');
      } catch (err) {
          console.error("Failed to create group", err);
          alert("Failed to create group");
      } finally {
          setCreateLoading(false);
      }
  };

  const ModalOverlay = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up sm:animate-pop-in">
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
    <div className="relative flex h-full min-h-screen w-full flex-col pb-24 bg-background-light dark:bg-background-dark animate-fade-in transition-colors duration-300">
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg px-4 pt-4 pb-2">
            <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">Your Groups</h2>
        </div>

        <div className="p-4 grid gap-4">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                    Loading groups...
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 text-center">
                    <span className="material-symbols-outlined text-5xl mb-2">groups</span>
                    <p>You haven't joined any groups yet.</p>
                </div>
            ) : (
                groups.map(group => (
                    <div 
                        key={group.id} 
                        onClick={() => navigate(`/group-details/${group.id}`)}
                        className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-3xl">{group.img || 'group'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg truncate">{group.name}</h3>
                            <p className="text-slate-500 text-sm">{group.member_count || 1} members</p>
                        </div>
                        <div className="text-right shrink-0">
                            {/* Simplified logic for list view */}
                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">chevron_right</span>
                        </div>
                    </div>
                ))
            )}

             <button 
                onClick={() => setShowModal(true)}
                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl text-slate-500 dark:text-slate-400 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">add</span> Create New Group
            </button>
        </div>

        {/* Create Group Modal */}
        {showModal && (
            <ModalOverlay title="Create New Group" onClose={() => setShowModal(false)}>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
                        <input 
                            type="text" 
                            value={newGroupName} 
                            onChange={e => setNewGroupName(e.target.value)}
                            placeholder="e.g., Summer Trip"
                            className="w-full rounded-xl border-none bg-slate-100 dark:bg-white/5 p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={createLoading || !newGroupName.trim()}
                        className="w-full py-3 bg-primary rounded-xl text-black font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {createLoading ? 'Creating...' : 'Create Group'}
                    </button>
                </form>
            </ModalOverlay>
        )}
    </div>
  );
};

export default Groups;
