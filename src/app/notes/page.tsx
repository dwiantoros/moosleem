'use client';

import React, { useEffect, useState } from 'react';
import QuranStyleHeader from '@/components/QuranStyleHeader';

interface NoteItem {
  id: string;
  text: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('muslim-traveler-notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('muslim-traveler-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setNotes((current) => [{ id: crypto.randomUUID(), text: trimmed }, ...current]);
    setDraft('');
  };

  const removeNote = (id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
  };

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <QuranStyleHeader title="Catatan Pribadi" />

        <section className="glass-panel rounded-[1.8rem] p-5 sm:p-6">
          <div className="glass-subtle rounded-[1.4rem] p-4">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Tulis catatan</label>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Catat niat, checklist ibadah, atau pengingat perjalanan..."
              className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-white/40 bg-white/45 px-4 py-3 text-sm text-slate-800 outline-none backdrop-blur-xl placeholder:text-slate-400"
            />
            <div className="mt-3 flex justify-end">
              <button onClick={addNote} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Simpan</button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {notes.length === 0 ? (
              <div className="glass-subtle rounded-[1.4rem] p-5 text-sm text-slate-500">Belum ada catatan. Tambahkan satu untuk mulai menyimpan pengingat pribadi.</div>
            ) : (
              notes.map((note) => (
                <article key={note.id} className="glass-subtle flex items-start justify-between gap-4 rounded-[1.4rem] p-4">
                  <p className="text-sm leading-relaxed text-slate-700">{note.text}</p>
                  <button onClick={() => removeNote(note.id)} className="text-xs font-medium text-slate-500 transition hover:text-slate-900">Hapus</button>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
