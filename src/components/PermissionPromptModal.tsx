'use client';

import React, { useState, useEffect } from 'react';

type PermissionState = 'idle' | 'pending' | 'granted' | 'denied' | 'unsupported' | 'enabled' | 'disabled';

interface PermissionPromptModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  locationState?: PermissionState;
  notificationState?: PermissionState;
  reminderState?: PermissionState;
  statusMessage?: string;
}

function stateLabel(state: PermissionState | undefined): string {
  if (state === 'pending') return 'Memproses...';
  if (state === 'granted' || state === 'enabled') return 'Aktif';
  if (state === 'denied') return 'Ditolak';
  if (state === 'unsupported') return 'Tidak didukung';
  if (state === 'disabled') return 'Belum aktif';
  return '';
}

export default function PermissionPromptModal({
  open,
  loading,
  onClose,
  onConfirm,
  locationState = 'idle',
  notificationState = 'idle',
  reminderState = 'idle',
  statusMessage,
}: PermissionPromptModalProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsExiting(false);
    }
  }, [open]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  if (!open && !isExiting) return null;

  const containerClass = isExiting 
    ? 'fixed inset-0 z-[80] flex justify-center items-start pt-6 modal-exit'
    : 'fixed inset-0 z-[80] flex justify-center items-start pt-6 modal-enter';

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        .modal-enter {
          animation: slideDown 0.3s ease-out forwards;
        }
        .modal-exit {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
      <div 
        className={containerClass}
        style={{ pointerEvents: isExiting ? 'none' : 'auto' }}>
        <div className="h-fit w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:w-80 md:w-[400px] dark:border-slate-800 dark:bg-black">
          <h2 className="text-lg font-semibold text-teal-600 dark:text-teal-400">Yuk, aktifkan fitur lengkapnya! 🕌</h2>
          <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Biar Moosleem bisa kasih tau waktu sholat &amp; arah kiblat yang akurat, aktifkan izin Lokasi, Notifikasi, dan Adzan Reminder sekaligus — cukup 1 klik!
          </p>
          {statusMessage ? (
            <p className="mt-2 text-xs font-medium text-teal-600 dark:text-teal-300">{statusMessage}</p>
          ) : null}

          <div className="mt-3 flex gap-2 text-xs">
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <p className="text-[10px] font-medium">Lokasi</p>
              <p className="mt-0.5 text-[9px] opacity-80">{stateLabel(locationState)}</p>
            </div>
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <p className="text-[10px] font-medium">Notifikasi</p>
              <p className="mt-0.5 text-[9px] opacity-80">{stateLabel(notificationState)}</p>
            </div>
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <p className="text-[10px] font-medium">Adzan</p>
              <p className="mt-0.5 text-[9px] opacity-80">{stateLabel(reminderState)}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Nanti Saja
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? 'Memproses...' : 'Aktifkan'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
