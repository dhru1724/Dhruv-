import React, { useState, useEffect } from 'react';
import { Compass, Plus, MapPin, CheckCircle2, Ticket, Check, Trash2, Calendar, ShieldAlert } from 'lucide-react';

interface ItineraryItem {
  id: string;
  destination: string;
  itinerary: string;
  date: string;
  active: boolean;
}

const DEFAULT_TRAVEL: ItineraryItem[] = [
  { id: 't-1', destination: 'Kyoto, Japan', itinerary: 'Bullet train from Tokyo, explore Gion temple structures, dine at organic sushi markets.', date: '2026-10-14', active: true },
  { id: 't-2', destination: 'Rome, Italy', itinerary: 'Guided architectural tour of Colosseum, dine at local Trastevere pizzerias, visit Vatican.', date: '2026-12-05', active: true }
];

export default function TravelDashboard() {
  const [trips, setTrips] = useState<ItineraryItem[]>(() => {
    const saved = localStorage.getItem('lifeos_travel_itinerary');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse travel itinerary", e);
      }
    }
    return DEFAULT_TRAVEL;
  });

  useEffect(() => {
    localStorage.setItem('lifeos_travel_itinerary', JSON.stringify(trips));
  }, [trips]);

  const [destination, setDestination] = useState('');
  const [itinerary, setItinerary] = useState('');
  const [date, setDate] = useState('');

  // Packing list
  const [packing, setPacking] = useState<{ id: string; item: string; packed: boolean }[]>(() => {
    const saved = localStorage.getItem('lifeos_travel_packing');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse packing list", e);
      }
    }
    return [
      { id: 'p1', item: 'Passport & Visa copies', packed: true },
      { id: 'p2', item: 'Universal Power Adapter block', packed: false },
      { id: 'p3', item: 'Noise cancelling Headphones', packed: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem('lifeos_travel_packing', JSON.stringify(packing));
  }, [packing]);

  const [newPack, setNewPack] = useState('');

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    const newTrip: ItineraryItem = {
      id: `trip-${Date.now()}`,
      destination: destination.trim(),
      itinerary: itinerary.trim() || 'No active details logged yet.',
      date: date || 'Anytime',
      active: true
    };
    setTrips([...trips, newTrip]);
    setDestination('');
    setItinerary('');
    setDate('');
  };

  const handleToggleTrip = (id: string) => {
    setTrips(trips.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const handleDeleteTrip = (id: string) => {
    setTrips(trips.filter(t => t.id !== id));
  };

  const handleAddPacking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPack.trim()) return;
    setPacking([...packing, { id: `p-${Date.now()}`, item: newPack.trim(), packed: false }]);
    setNewPack('');
  };

  return (
    <div className="font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">✈️ Travel Logs & dream Itineraries</h1>
        <p className="text-xs text-gray-400 mt-1">Scribe packing checkmarks, map destination itineraries, and design dream transits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Destination form and schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display pb-3 border-b border-white/5 mb-4 flex items-center space-x-2">
              <MapPin className="h-4.5 w-4.5 text-emerald-400" />
              <span>MAP AN OUTGOING DESTINATION TRIP</span>
            </h3>

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Destination Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Kyoto, Japan"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Scheduled Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Itinerary description & Actions</label>
                <textarea
                  value={itinerary}
                  onChange={(e) => setItinerary(e.target.value)}
                  rows={2}
                  placeholder="Bullet train schedules, temple reservations, local sushi places..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl font-bold font-mono tracking-wider uppercase text-[10px] cursor-pointer"
                >
                  Log Itinerary
                </button>
              </div>
            </form>
          </div>

          {/* Active Trips list */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display select-none">Active Destinations Scheduled</span>
            {trips.length === 0 ? (
              <div className="text-center py-10 glass bg-white/[0.01] border border-white/5 rounded-2xl text-gray-505 text-xs font-semibold">
                No trips mapped currently.
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map(trip => (
                  <div key={trip.id} className="p-4 bg-neutral-900 border border-white/10 rounded-2xl flex flex-col justify-between hover:border-emerald-500/15 transition-all relative group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2.5">
                        <span className="p-1 px-2 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-lg text-xs select-none">🇯🇵</span>
                        <h4 className="text-xs font-black text-white font-display uppercase tracking-wide">{trip.destination}</h4>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-500 font-mono text-[10px] font-extrabold select-none">
                        <span>{trip.date}</span>
                        <button onClick={() => handleDeleteTrip(trip.id)} className="text-gray-600 hover:text-red-400 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[10.5px] text-gray-400 leading-relaxed font-sans mt-2.5">
                      {trip.itinerary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Packing Sidebar checklist */}
        <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5 h-fit">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display pb-3 border-b border-white/5 mb-3 flex items-center space-x-2 select-none">
            <Ticket className="h-4.5 w-4.5 text-blue-400" />
            <span>TRAVEL PACKING DIRECTORY</span>
          </h3>

          <form onSubmit={handleAddPacking} className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Passport, Universal adaptor..."
              value={newPack}
              onChange={(e) => setNewPack(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 p-2.5 rounded-xl text-white font-bold text-xs shrink-0">+</button>
          </form>

          <div className="space-y-1.5 mt-2 font-sans">
            {packing.map(pack => (
              <div
                key={pack.id}
                onClick={() => setPacking(packing.map(p => p.id === pack.id ? { ...p, packed: !p.packed } : p))}
                className="p-2 bg-[#0c0d12] hover:bg-[#121318] border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                    pack.packed ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20'
                  }`}>
                    {pack.packed && <Check className="h-3 w-3 stroke-[3px]" />}
                  </span>
                  <span className={`text-[11px] ${pack.packed ? 'text-gray-550 line-through' : 'text-gray-200'}`}>
                    {pack.item}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
