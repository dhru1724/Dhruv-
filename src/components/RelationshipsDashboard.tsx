import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Check, Sparkles, Smile, MessageCircle, Gift, Heart, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: string;
  name: string;
  frequency: string; // Weekly, Monthly, Quarterly
  lastContact: string; // YYYY-MM-DD
  notes: string;
  birthday: string;
  giftIdea: string;
}

const DEFAULT_CONTACTS: Contact[] = [
  { id: 'c-1', name: 'Mom & Dad', frequency: 'Weekly', lastContact: '2026-05-28', notes: 'Check in on gardening plans and health scores. Offer help with travel.', birthday: '10-23', giftIdea: 'Handmade framed travel album' },
  { id: 'c-2', name: 'Kabir (Engineering Lead)', frequency: 'Monthly', lastContact: '2026-05-15', notes: 'Gather insight on scalable compiler frameworks and web design architectures.', birthday: '03-12', giftIdea: 'JetBrains subscription or tech mechanical keyboard' }
];

export default function RelationshipsDashboard() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('lifeos_relations_ledger');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse contacts", e);
      }
    }
    return DEFAULT_CONTACTS;
  });

  useEffect(() => {
    localStorage.setItem('lifeos_relations_ledger', JSON.stringify(contacts));
  }, [contacts]);

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('Weekly');
  const [notes, setNotes] = useState('');
  const [birthday, setBirthday] = useState('');
  const [giftIdea, setGiftIdea] = useState('');

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name: name.trim(),
      frequency,
      lastContact: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      birthday: birthday.trim() || 'N/A',
      giftIdea: giftIdea.trim() || 'N/A'
    };

    setContacts([newContact, ...contacts]);
    setName('');
    setNotes('');
    setBirthday('');
    setGiftIdea('');
  };

  const handleTouchContact = (id: string) => {
    setContacts(contacts.map(c => 
      c.id === id 
        ? { ...c, lastContact: new Date().toISOString().split('T')[0] } 
        : c
    ));
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">💬 Relationships Ledger & CRM</h1>
        <p className="text-xs text-gray-400 mt-1">Nurture focal family connections, schedule catching up, and record gift registries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact entries with Touch Action details */}
        <div className="lg:col-span-2 space-y-4">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display select-none">Focal Social Contacts</span>
          {contacts.length === 0 ? (
            <div className="text-center py-12 glass bg-white/[0.01] border border-white/5 rounded-2xl text-gray-500 font-semibold text-xs">
              No contacts mapped to CRM. Insert parent/allies/mentors below!
            </div>
          ) : (
            <div className="space-y-4 font-sans">
              {contacts.map(c => (
                <div key={c.id} className="p-4 bg-neutral-900 border border-white/10 rounded-2xl flex flex-col hover:border-orange-500/15 transition-all relative group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/15 text-orange-400 shrink-0">
                        👥
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-gray-100 uppercase tracking-wide">{c.name}</h4>
                        <div className="flex items-center space-x-2 text-[9.5px] font-mono text-gray-550 mt-1 uppercase font-bold">
                          <span className="bg-orange-500/5 text-orange-400 px-1.5 py-0.25 rounded border border-orange-500/10">{c.frequency} cadence</span>
                          <span>•</span>
                          <span>Last Catch-Up: {c.lastContact}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTouchContact(c.id)}
                        className="px-3 py-1 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 hover:text-white border border-orange-500/20 rounded-xl text-[9px] font-mono font-black uppercase transition-all tracking-wide flex items-center space-x-1"
                        title="Tick Catchpoint to Today"
                      >
                        <Check className="h-3 w-3 stroke-[3px]" />
                        <span>Touchpoint</span>
                      </button>
                      <button onClick={() => handleDeleteContact(c.id)} className="text-gray-600 hover:text-red-400 p-1.5 rounded hover:bg-white/5 transition-all cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {c.notes && (
                    <div className="mt-4 p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs text-gray-350 leading-relaxed italic pr-4 relative">
                      <MessageCircle className="h-4 w-4 text-orange-500/30 absolute right-3 top-3 pointer-events-none" />
                      "{c.notes}"
                    </div>
                  )}

                  {/* gift and birthday registries */}
                  <div className="mt-3.5 pt-3 border-t border-white/[0.03] grid grid-cols-2 gap-4 text-[10px] font-mono text-gray-500 leading-none select-none">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      <span>Birthday: <strong>{c.birthday}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Gift className="h-3.5 w-3.5 text-rose-450 shrink-0" />
                      <span className="truncate">Registry: <strong>{c.giftIdea}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Friend Form */}
        <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5 h-fit text-xs font-sans">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display pb-3 border-b border-white/5 mb-4 flex items-center space-x-1.5 select-none">
            <Plus className="h-4 w-4 text-orange-400" />
            <span>INSERT OUTGOING ALLY IN CRM</span>
          </h3>

          <form onSubmit={handleCreateContact} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Contact Name</label>
              <input
                type="text"
                required
                placeholder="E.g. Elon Musk, Sis, John Doe..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Contact Cadence</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-[#121318] border border-white/10 rounded-xl px-2 py-2 text-white font-mono"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Birthday Date</label>
                <input
                  type="text"
                  placeholder="MM-DD (E.g. 11-28)"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Gift Idea Registry</label>
              <input
                type="text"
                placeholder="E.g. Premium leather journal book..."
                value={giftIdea}
                onChange={(e) => setGiftIdea(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Conversation Notes & Prompts</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Inquire on family, check on plans, record feedback..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold font-mono tracking-wider uppercase text-[10px] cursor-pointer shadow-md"
            >
              Insert in ledger
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
