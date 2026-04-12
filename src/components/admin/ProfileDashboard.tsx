'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { CmsAsset, CmsSettings } from '@/server/cms/types';

type ProfileDashboardProps = {
  initialSettings: CmsSettings;
  initialAssets: CmsAsset[];
  backHref: string;
};

export default function ProfileDashboard({ initialSettings, initialAssets, backHref }: ProfileDashboardProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [assets, setAssets] = useState(initialAssets);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function updateField<K extends keyof CmsSettings>(key: K, value: CmsSettings[K]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSaveProfile() {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileName: settings.profileName,
          profileRole: settings.profileRole,
          profilePhoto: settings.profilePhoto,
          profileBio: settings.profileBio,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { settings?: CmsSettings; error?: string };

      if (!response.ok || !data.settings) {
        setMessage(data.error || 'Gagal menyimpan profil author.');
        return;
      }

      setSettings(data.settings);
      setMessage('Profil author berhasil diperbarui.');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadPhoto(file: File) {
    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', settings.profileName || 'Foto profil author');

      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as { asset?: CmsAsset; error?: string };

      if (!response.ok || !data.asset) {
        setMessage(data.error || 'Upload foto profil gagal.');
        return;
      }

      setAssets((current) => [data.asset as CmsAsset, ...current.filter((asset) => asset.id !== data.asset?.id)]);
      updateField('profilePhoto', data.asset.url);
      setMessage('Foto profil berhasil diunggah.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="glass-panel rounded-[2rem] p-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Profil</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Atur profil author CMS</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Data ini dipakai di halaman artikel untuk menampilkan nama penulis, foto profil, dan bio singkat.</p>
        </div>
        <Link href={backHref} className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
          Kembali ke dashboard
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Nama profil
            <input
              type="text"
              value={settings.profileName}
              onChange={(event) => updateField('profileName', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Role / jabatan
            <input
              type="text"
              value={settings.profileRole}
              onChange={(event) => updateField('profileRole', event.target.value)}
              placeholder="Contoh: Editor Muslim Traveler"
              className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Foto profil URL
            <div className="mt-2 space-y-2">
              <input
                type="url"
                value={settings.profilePhoto}
                onChange={(event) => updateField('profilePhoto', event.target.value)}
                placeholder="https://... atau /api/cms/assets/..."
                className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              />
              <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">
                {uploading ? 'Mengunggah...' : 'Upload foto'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';

                    if (!file) {
                      return;
                    }

                    await handleUploadPhoto(file);
                  }}
                />
              </label>
            </div>
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Bio singkat
            <textarea
              value={settings.profileBio}
              onChange={(event) => updateField('profileBio', event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
            />
          </label>

          {message ? <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveProfile}
              className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || uploading}
            >
              {saving ? 'Menyimpan...' : 'Simpan profil'}
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-300">Perubahan ini langsung dipakai di daftar artikel dan halaman detail artikel.</p>
          </div>
        </div>

        <aside className="rounded-[1.8rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Preview</p>
          <div className="mt-4 flex items-center gap-4 rounded-[1.4rem] border border-white/70 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
            {settings.profilePhoto ? (
              <img src={settings.profilePhoto} alt={settings.profileName} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-lg font-semibold text-teal-700">
                {(settings.profileName || 'M').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-slate-950 dark:text-slate-100">{settings.profileName || 'Tim Muslim Traveler'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">{settings.profileRole || 'Editor Muslim Traveler'}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{settings.profileBio || 'Tambahkan bio singkat agar pembaca tahu siapa penulis artikel.'}</p>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Media terbaru</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {assets.slice(0, 6).map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => updateField('profilePhoto', asset.url)}
                  className="overflow-hidden rounded-2xl border border-white/70 bg-white transition hover:opacity-90 dark:border-white/10 dark:bg-slate-950/40"
                >
                  <img src={asset.url} alt={asset.altText || asset.filename} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}