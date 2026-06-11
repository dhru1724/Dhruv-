import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Timer, Play, Pause, RefreshCw, Eye, BookOpen, Quote, HelpCircle, Volume2, VolumeX, Lightbulb, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SilvaDashboard() {
  // Web Audio entrainment generator
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscLeftRef = useRef<OscillatorNode | null>(null);
  const oscRightRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startBinauralBeats = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      
      // Left channel oscillator (200 Hz)
      const oscLeft = ctx.createOscillator();
      oscLeft.frequency.value = 200;
      
      // Right channel oscillator (210 Hz to generate 10 Hz alpha wave)
      const oscRight = ctx.createOscillator();
      oscRight.frequency.value = 210;
      
      // Channels merger
      const merger = ctx.createChannelMerger(2);
      
      const leftGain = ctx.createGain();
      const rightGain = ctx.createGain();
      
      oscLeft.connect(leftGain);
      oscRight.connect(rightGain);
      
      leftGain.connect(merger, 0, 0);
      rightGain.connect(merger, 0, 1);
      
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.08, ctx.currentTime); // gentle low volume safe
      
      merger.connect(mainGain);
      mainGain.connect(ctx.destination);
      
      oscLeft.start();
      oscRight.start();
      
      oscLeftRef.current = oscLeft;
      oscRightRef.current = oscRight;
      gainRef.current = mainGain;
      
      setIsPlayingAudio(true);
    } catch (e) {
      console.error("Audio Context failed to boot.", e);
    }
  };

  const stopBinauralBeats = () => {
    try {
      if (oscLeftRef.current) oscLeftRef.current.stop();
      if (oscRightRef.current) oscRightRef.current.stop();
      setIsPlayingAudio(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    return () => {
      if (oscLeftRef.current) oscLeftRef.current.stop();
      if (oscRightRef.current) oscRightRef.current.stop();
    };
  }, []);

  // Centering Timer states
  const [countdown, setCountdown] = useState(100);
  const [isCounting, setIsCounting] = useState(false);
  const [exerciseText, setExerciseText] = useState('Relax your facial muscles, take a deep breath...');

  useEffect(() => {
    let timer: any;
    if (isCounting && countdown > 1) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
        updateExerciseInstructions(countdown - 1);
      }, 1000);
    } else if (countdown === 1) {
      setExerciseText('You have reached the Alpha realm. Your mind is fully centered.');
      setIsCounting(false);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  const updateExerciseInstructions = (countValue: number) => {
    if (countValue > 80) {
      setExerciseText('Close your eyes. Inhale slowly and exhale deeply...');
    } else if (countValue > 60) {
      setExerciseText('Visualize a tranquil, calm place of absolute safety...');
    } else if (countValue > 40) {
      setExerciseText('Count down from 3 to 1 to enter the mental sandbox room...');
    } else if (countValue > 20) {
      setExerciseText('Enter your secondary reference workshop. Formulate solutions clearly...');
    } else {
      setExerciseText('Aligning cognitive focus streams for total intellectual control...');
    }
  };

  const [reflections, setReflections] = useState<string>(() => {
    return localStorage.getItem('lifeos_silva_reflections') || '';
  });

  useEffect(() => {
    localStorage.setItem('lifeos_silva_reflections', reflections);
  }, [reflections]);

  const SILVA_EXERCISES = [
    { title: 'The 3-to-1 Centering Routine', duration: '5 min', desc: 'Sinks core brain frequencies to 10Hz alpha levels instantly for body relaxation.' },
    { title: 'Dream Control Programming', duration: '12 min', desc: 'Commands subconscious attention before sleep to solve specific technical blockers.' },
    { title: 'The Mirror of the Mind', duration: '15 min', desc: 'Constructs mental visual projection plates to replace worry frames with solved scenarios.' }
  ];

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">✨ Silva mind Control Exercises</h1>
          <p className="text-xs text-gray-400 mt-1">Harness alpha brainwave triggers and subconscious triggers to solve problems</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Alpha Brainwave Generator Card */}
        <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-white/5 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider font-display flex items-center space-x-2">
                <Volume2 className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
                <span>MINDENTRAINMENT LOG: ALPHA (10HZ)</span>
              </span>
              <span className="text-[9.5px] font-mono text-gray-550">Binaural Beat</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#a855f7]/5 border border-purple-500/10 text-center space-y-3">
              <span className="text-4xl">🧘‍♂️</span>
              <h3 className="text-sm font-bold text-gray-100">10 Hz Entrainment Loop</h3>
              <p className="text-[10.5px] text-gray-500 leading-normal">
                Synthesizes a 200Hz frequency in the left audio ear, and 210Hz in the right, generating a real 10Hz cognitive alpha wave cycle. Headphones are strictly recommended.
              </p>

              {isPlayingAudio ? (
                <button
                  onClick={stopBinauralBeats}
                  className="px-5 py-2.5 bg-rose-600/15 text-rose-400 border border-rose-500/20 hover:bg-rose-600/25 rounded-xl text-xs font-bold font-sans tracking-wide cursor-pointer flex items-center space-x-1.5 mx-auto transition-all"
                >
                  <VolumeX className="h-4 w-4" />
                  <span>Stop Entrainment</span>
                </button>
              ) : (
                <button
                  onClick={startBinauralBeats}
                  className="px-5 py-2.5 bg-violet-650 text-white rounded-xl text-xs font-bold font-sans tracking-wide cursor-pointer flex items-center space-x-1.5 mx-auto hover:bg-violet-600 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Synthesize Waves</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-[9.5px] text-gray-550 leading-snug mt-3 italic text-center select-none">
            Generates real, hardware-authoritative audio beats in sandbox
          </p>
        </div>

        {/* Dynamic Countdown Exercise Panel */}
        <div className="lg:col-span-2 glass bg-[#7c3aed]/5 border border-purple-500/15 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-white/5 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-300 tracking-wider font-display flex items-center space-x-2">
                <Timer className="h-4.5 w-4.5 text-purple-400" />
                <span>THE 100-TO-1 DEPTH CASCADE</span>
              </span>
              <span className="text-[9.5px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full select-none">Alpha Depth</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="text-center font-mono select-none">
                <span className="text-5xl font-black text-white">{countdown}</span>
                <div className="flex items-center justify-center space-x-3 mt-4">
                  <button
                    onClick={() => { setIsCounting(!isCounting); }}
                    className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md"
                  >
                    {isCounting ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
                  </button>
                  <button
                    onClick={() => { setIsCounting(false); setCountdown(100); setExerciseText('Ready to practice centering cascade.'); }}
                    className="p-2.5 rounded-xl bg-[#1a1b24] hover:bg-neutral-800 text-gray-400 transition-all cursor-pointer border border-white/5"
                    title="Reset Countdown"
                  >
                    <RefreshCw className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-neutral-900 border border-white/10 rounded-2xl space-y-2 min-h-[110px] flex flex-col justify-center">
                <span className="text-[9.5px] font-mono text-purple-400 tracking-wider font-black select-none uppercase">CASCADE INSTRUCTION:</span>
                <p className="text-xs text-gray-200 font-sans leading-relaxed italic">
                  "{exerciseText}"
                </p>
              </div>
            </div>
          </div>

          <p className="text-[9.5px] text-gray-500 mt-4 font-sans leading-normal">
            Cascade counts down slowly to synchronize logical and critical hemispheres. Enter alpha state purposefully.
          </p>
        </div>
      </div>

      {/* Guided Exercises List & mystical journal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display pb-3 border-b border-white/5 mb-4 select-none">
            SILVA CONTROL EXERCISES DIRECTORY
          </h3>

          <div className="space-y-3 font-sans">
            {SILVA_EXERCISES.map((ex, idx) => (
              <div key={idx} className="p-3 bg-[#0a0b10] border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-200">{ex.title}</h4>
                  <p className="text-[10.5px] text-gray-500 mt-1 leading-normal">{ex.desc}</p>
                </div>
                <span className="text-[9.5px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 select-none shrink-0 ml-4">
                  {ex.duration}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reflections Ledger */}
        <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5 flex flex-col">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display pb-3 border-b border-white/5 mb-3">
            ALPHA STATE JOURNAL & MIND NOTES
          </h3>

          <textarea
            value={reflections}
            onChange={(e) => setReflections(e.target.value)}
            placeholder="Document insights, creative breakthroughs, solve parameters, and dreams captured during alpha beat meditation..."
            className="flex-1 min-h-[160px] bg-white/[0.01] hover:bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500/50 resize-none font-sans"
          />
          <div className="flex items-center justify-between mt-3 text-[9px] font-mono text-gray-500 select-none">
            <span>Progress automatically saved.</span>
            <span>✨ Coherent Mind</span>
          </div>
        </div>
      </div>
    </div>
  );
}
