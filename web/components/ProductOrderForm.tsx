'use client'

import { FormEvent, useState } from 'react'
import LocationInput from '@/components/LocationInput'
import { useSettingsStore } from '@/lib/store'
import { recipientLabelFromName, type CartRecipientProfile } from '@/lib/cart-types'
import { isRecipientComplete } from '@/lib/cart-rules'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'
import { Loader2 } from 'lucide-react'

type Props = {
  productName: string
  showEmail?: boolean
  submitLabel?: string
  onSubmit: (recipient: CartRecipientProfile) => void | Promise<void>
}

export default function ProductOrderForm({
  productName,
  showEmail = true,
  submitLabel = 'Ajouter au panier',
  onSubmit,
}: Props) {
  const settings = useSettingsStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    display_name: settings.defaultFirstName || '',
    email: '',
    birth_date: settings.defaultBirthDate || '',
    birth_time: settings.defaultBirthTime || '12:00',
    birth_place: '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone || 'UTC',
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const display_name = form.display_name.trim()
    const recipient: CartRecipientProfile = {
      display_name,
      label: recipientLabelFromName(display_name),
      birth_date: form.birth_date,
      birth_time: form.birth_time,
      birth_place: form.birth_place,
      latitude: form.latitude,
      longitude: form.longitude,
      timezone: form.timezone,
      email: form.email.trim() || undefined,
    }
    if (!isRecipientComplete(recipient)) {
      setError('Complétez la date, l’heure et le lieu de naissance.')
      return
    }
    setSaving(true)
    try {
      await onSubmit(recipient)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <p className="text-sm text-cosmic-silver">
        Entrez les informations de naissance pour <strong className="text-white">{productName}</strong>,
        puis ajoutez au panier. Pour commander le même produit pour une autre personne, ajoutez une
        nouvelle entrée avec d&apos;autres coordonnées.
      </p>

      <div>
        <label className="mb-1 block text-sm text-cosmic-silver">Prénom ou surnom</label>
        <input
          value={form.display_name}
          onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
          placeholder="Prénom ou surnom de la personne concernée"
        />
      </div>

      {showEmail ? (
        <div>
          <label className="mb-1 block text-sm text-cosmic-silver">Courriel (optionnel)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            placeholder="vous@exemple.com"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-cosmic-silver">Date de naissance</label>
          <input
            type="text"
            inputMode="numeric"
            value={form.birth_date}
            onChange={(e) => setForm((p) => ({ ...p, birth_date: formatBirthDateInput(e.target.value) }))}
            placeholder="AAAA-MM-JJ"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-cosmic-silver">Heure de naissance</label>
          <input
            type="time"
            value={form.birth_time}
            onChange={(e) => setForm((p) => ({ ...p, birth_time: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            required
          />
        </div>
      </div>

      <LocationInput
        value={form.birth_place}
        onChange={(birth_place) => setForm((p) => ({ ...p, birth_place }))}
        onLocationSelect={(location) =>
          setForm((p) => ({
            ...p,
            birth_place: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            timezone: location.timezone || 'UTC',
          }))
        }
        label="Lieu de naissance"
        required
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-cosmic-gold py-3 font-semibold text-cosmic-purple hover:bg-cosmic-gold/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {submitLabel}
      </button>
    </form>
  )
}
