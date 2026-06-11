import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, Trash2, Calendar, Sparkles, Trophy, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline: string;
  completed: boolean;
}

const DEFAULT_GOALS: Goal[] = [
  { id: 'g-1', title: 'Complete DeepMind LLM Applet', description: 'Bundle modular dashboards, clean linter bugs, and verify compile state.', priority: 'High', deadline: '2026-06-15', completed: false },
  { id: 'g-2', title: 'Run 5K Marathon under 22 mins', description: 'Run aerobic base splits, track recovery indices, and hydrate regularly.', priority: 'Medium', deadline: '2026-08-30', completed: false },
  { id: 'g-3', title: 'Master Silva 100-to-1 Cascades', description: 'Practice centering exercises twice a day to increase cognitive focus.', priority: 'Low', deadline: '2026-07-01', completed: true }
];

export default function GoalsDashboard() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('lifeos_goals_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse goals", e);
      }
    }
    return DEFAULT_GOALS;
  });

  useEffect(() => {
    localStorage.setItem('lifeos_goals_list', JSON.stringify(goals));
  }, [goals]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [deadline, setDeadline] = useState('');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      description: desc.trim(),
      priority,
      deadline: deadline || 'No deadline',
      completed: false
    };

    setGoals([...goals, newGoal]);
    setTitle('');
    setDesc('');
    setDeadline('');
    setPriority('High');
    setShowAddForm(false);
  };

  const handleToggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">🎯 Goals & Vision boards</h1>
          <p className="text-xs text-gray-400 mt-1">Scribe executive milestones, prioritize action items, and audit completed trophies</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 font-semibold text-xs transition-colors self-start cursor-pointer font-sans"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Launch Vision Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Goals block */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display select-none">Active Focal Milestones</span>
            {activeGoals.length === 0 ? (
              <div className="text-center py-10 glass bg-white/[0.01] border border-white/5 rounded-2xl text-gray-505 text-xs font-semibold">
                No active vision goals. Build one above to start tracking!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map(goal => (
                  <div key={goal.id} className="glass bg-[#0c0d12]/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-indigo-500/25 transition-all relative group">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full select-none ${
                          goal.priority === 'High' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                          goal.priority === 'Medium' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                          'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                        }`}>
                          {goal.priority} Priority
                        </span>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h3 className="text-xs font-black text-white mt-3 leading-tight tracking-wide">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-[10.5px] text-gray-400 mt-2 font-sans leading-normal">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.03] flex items-center justify-between text-[9px] font-mono text-gray-500 select-none">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 inline text-gray-550" />
                        <span>By: {goal.deadline}</span>
                      </span>
                      <button
                        onClick={() => handleToggleGoal(goal.id)}
                        className="text-indigo-400 hover:text-white font-extrabold flex items-center gap-0.5 uppercase"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 inline shrink-0" />
                        <span>Achieve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Archive Completed Goal Block */}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display select-none">Completed Trophies Archive</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map(goal => (
                  <div key={goal.id} className="glass bg-[#10b981]/2 border border-[#10b981]/10 p-4 rounded-2xl flex flex-col justify-between opacity-70 hover:opacity-100 transition-all">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono font-bold bg-[#10b981]/10 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full select-none">Completely Achieved</span>
                        <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-505 hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <h3 className="text-xs font-black text-gray-300 mt-3 line-through leading-tight">{goal.title}</h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#10b981]/10 flex items-center justify-between text-[9.5px] font-mono text-emerald-400/80">
                      <span>Verified milestone completion</span>
                      <button onClick={() => handleToggleGoal(goal.id)} className="hover:underline text-[9px] font-bold uppercase cursor-pointer">
                        Re-Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vision Sidebar */}
        <div className="space-y-6">
          <div className="glass bg-[#10b981]/5 border border-emerald-500/10 rounded-2xl p-5 flex flex-col items-center text-center space-y-3">
            <Trophy className="h-8 w-8 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-widest leading-none mt-1">Vision Summary Tracker</h3>
            <div className="grid grid-cols-2 gap-4 w-full mt-2 font-mono text-xs font-bold leading-normal">
              <div className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5">
                <span className="text-gray-500 block text-[9.5px] uppercase font-semibold">Active</span>
                <span className="text-white text-base font-black mt-1 block">{activeGoals.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#10b981]/5 border border-emerald-500/10">
                <span className="text-emerald-500 block text-[9.5px] uppercase font-semibold">Achieved</span>
                <span className="text-emerald-400 text-base font-black mt-1 block">{completedGoals.length}</span>
              </div>
            </div>
          </div>

          <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5 text-xs text-gray-300 leading-relaxed font-sans space-y-2">
            <h4 className="font-bold flex items-center gap-1 text-indigo-400 select-none">
              <Star className="h-4 w-4 text-amber-400" />
              <span>THE VISION MANIFESTO</span>
            </h4>
            <p className="font-sans text-[11px] leading-relaxed">
              Writing down your vision with strict deadlines increases visual recognition and forces executive attention streams to allocate time blocks on your workspace scheduled calendar daily.
            </p>
          </div>
        </div>
      </div>

      {/* Add vision form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0c10] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-widest">Launch Vision Goal</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white transition-colors">
                  <Plus className="h-5 w-5 transform rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Goal Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Relational database compilation..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono font-bold">Action steps description</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    placeholder="E.g. 1. Complete unit tests, 2. Lint checks, 3. Deploy sandbox triggers..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-[#121318] border border-white/10 rounded-xl px-3 py-2.5 text-white font-medium"
                    >
                      <option value="High">🔴 High Priority</option>
                      <option value="Medium">🟡 Medium Priority</option>
                      <option value="Low">🔵 Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Target Deadline</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-white/15 hover:bg-white/5 text-gray-300 rounded-xl font-bold font-mono tracking-wider uppercase text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-605 text-white rounded-xl font-bold font-mono tracking-wider uppercase text-[10px]"
                  >
                    Establish Milestone
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
