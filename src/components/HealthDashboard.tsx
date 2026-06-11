import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Heart, Activity, Droplet, Plus, Trash2, Key, Check, PlusCircle, Smile, Sparkles, Moon, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HealthDashboardProps {
  projects: Project[];
}

export default function HealthDashboard({ projects }: HealthDashboardProps) {
  // Persistence for Water Hydration
  const [water, setWater] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_health_water');
    return saved ? parseFloat(saved) : 1.5;
  });

  // Steps
  const [steps, setSteps] = useState<string>(() => {
    return localStorage.getItem('lifeos_health_steps') || '8412';
  });

  // Sleep
  const [sleep, setSleep] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_health_sleep');
    return saved ? parseFloat(saved) : 7.2;
  });

  useEffect(() => {
    localStorage.setItem('lifeos_health_water', water.toString());
  }, [water]);

  useEffect(() => {
    localStorage.setItem('lifeos_health_steps', steps);
  }, [steps]);

  useEffect(() => {
    localStorage.setItem('lifeos_health_sleep', sleep.toString());
  }, [sleep]);

  // Workout checklist
  const [workouts, setWorkouts] = useState<{ id: string; name: string; completed: boolean }[]>(() => {
    const saved = localStorage.getItem('lifeos_health_workouts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse workouts", e);
      }
    }
    return [
      { id: 'w1', name: '30-min Hill Interval Runs', completed: true },
      { id: 'w2', name: 'Hypertrophy Bench Press Core', completed: false },
      { id: 'w3', name: 'Centering flow posture stretches', completed: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem('lifeos_health_workouts', JSON.stringify(workouts));
  }, [workouts]);

  const [newWorkout, setNewWorkout] = useState('');

  const handleAddWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkout.trim()) return;
    setWorkouts([...workouts, { id: `w-${Date.now()}`, name: newWorkout.trim(), completed: false }]);
    setNewWorkout('');
  };

  const handleToggleWorkout = (id: string) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, completed: !w.completed } : w));
  };

  const handleDeleteWorkout = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  return (
    <div className="font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">❤️ Health & Hydration Center</h1>
        <p className="text-xs text-gray-400 mt-1">Audit water consumption, sleeping indices, steps thresholds, and workout splits</p>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Inline Water Water Glass Clicker */}
        <div className="glass bg-[#2563eb]/5 dark:bg-[#1e1b4b]/40 border border-blue-500/15 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3.5">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <Droplet className="h-4 w-4 text-blue-400" />
                <span>HYDRATION ACCUMULATION</span>
              </span>
              <span className="text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">Goal: 3.0 L</span>
            </div>

            <div className="flex items-baseline space-x-1 font-mono">
              <span className="text-3xl font-black text-white">{water.toFixed(2)}</span>
              <span className="text-xs text-blue-400">Liters</span>
            </div>

            {/* Clickable glass selector indicators */}
            <div className="grid grid-cols-8 gap-1.5 mt-4">
              {Array.from({ length: 12 }).map((_, idx) => {
                const checked = water >= (idx + 1) * 0.25;
                return (
                  <button
                    key={idx}
                    onClick={() => setWater(Math.max(0, (idx + 1) * 0.25))}
                    className={`h-7 rounded-lg border text-base flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                      checked 
                        ? 'bg-blue-500/30 border-blue-400 text-blue-300' 
                        : 'bg-white/[0.01] border-white/10 text-gray-750 hover:border-blue-500/30'
                    }`}
                    title={`Glass ${idx + 1}: ${((idx + 1) * 0.25).toFixed(2)} L`}
                  >
                    🥛
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button 
              onClick={() => setWater(Math.min(5, water + 0.25))}
              className="text-[10px] font-mono text-blue-400 hover:underline cursor-pointer bg-blue-500/10 px-2 py-1 rounded"
            >
              + Add Glass (+250ml)
            </button>
            <button 
              onClick={() => setWater(0)}
              className="text-[9px] font-mono text-gray-500 hover:text-red-400 cursor-pointer"
            >
              Reset Water
            </button>
          </div>
        </div>

        {/* Steps Inputs */}
        <div className="glass bg-[#ef4444]/5 dark:bg-[#450a0a]/30 border border-rose-500/15 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3.5">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <Footprints className="h-4 w-4 text-rose-400" />
                <span>DAILY PEDOMETER TARGETS</span>
              </span>
              <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full">Goal: 10,000</span>
            </div>

            <div className="flex items-center space-x-2 font-mono">
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="E.g. 8412"
                className="bg-transparent text-3xl font-black text-rose-400 focus:outline-none border-b border-rose-500/20 py-0.5 outline-none max-w-[150px] font-mono"
              />
              <span className="text-xs text-rose-500">steps</span>
            </div>

            <p className="text-[10px] text-gray-500 leading-normal mt-3 font-sans">
              Dynamic physical movement stimulates cardio flow and mitigates fatigue. Maintain a stable threshold above 8k.
            </p>
          </div>
        </div>

        {/* Sleep Logger */}
        <div className="glass bg-[#8b5cf6]/5 dark:bg-[#2e1065]/30 border border-purple-500/15 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3.5">
              <span className="text-[10px] font-bold text-gray-300 tracking-wider flex items-center gap-1">
                <Moon className="h-4 w-4 text-purple-400" />
                <span>REST & REM QUALITY SCORE</span>
              </span>
              <span className="text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">Target: 8.0h</span>
            </div>

            <div className="flex items-baseline space-x-1.5 font-mono">
              <span className="text-3xl font-black text-white">{sleep}</span>
              <span className="text-xs text-purple-400">hours</span>
            </div>

            {/* Slider to edit sleep */}
            <input
              type="range"
              min="3"
              max="12"
              step="0.1"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="w-full mt-4 h-1 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <p className="text-[10px] text-gray-500 leading-normal mt-3 font-sans leading-relaxed">
            Configure sleep duration to adjust hormone performance and neurological repair state.
          </p>
        </div>
      </div>

      {/* Workout Splits split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5">
          <div className="pb-3 border-b border-white/5 mb-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display flex items-center space-x-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>WEEKLY WORKOUT SPLITS & FITNESS MATRIX</span>
            </span>
            <span className="text-[9px] font-mono font-bold bg-white/5 px-2 py-0.5 rounded text-gray-500">Routine</span>
          </div>

          {/* New splits creation */}
          <form onSubmit={handleAddWorkout} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add training workout (E.g. Deadlifts & Posterior core...)"
              value={newWorkout}
              onChange={(e) => setNewWorkout(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500' outline-none"
            />
            <button
              type="submit"
              className="bg-[#10b981] hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl text-xs transition-colors flex items-center justify-center shrink-0"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>

          {/* Checklist */}
          <div className="space-y-2 mt-2 font-sans">
            {workouts.length === 0 ? (
              <div className="text-center py-6 text-gray-650 text-xs">No splits registered in routine ledger</div>
            ) : (
              workouts.map(w => (
                <div
                  key={w.id}
                  onClick={() => handleToggleWorkout(w.id)}
                  className="p-3 bg-[#0a0b10] border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`h-4.5 w-4.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      w.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 hover:border-emerald-550'
                    }`}>
                      {w.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                    </span>
                    <span className={`text-xs ${w.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                      {w.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteWorkout(w.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400"
                    title="Remove split"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic active visual progress metrics or recommendations */}
        <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display pb-3 border-b border-white/5">
            ACTIVE FITNESS CONSTRAINTS
          </h3>
          <div className="space-y-3.5 text-xs text-gray-300 font-sans leading-relaxed">
            <div className="flex items-start space-x-2.5">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-100 block">Aerobic threshold training</strong>
                Maintain a target cardiovascular heart rate split of 130-150BPM for optimized recovery.
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-100 block">Sleep timing balance</strong>
                Avoid blue-light wavelengths for 90 minutes before targeted sleep to ensure alpha & theta REM indices.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
