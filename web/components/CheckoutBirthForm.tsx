'use client'

import LocationInput from '@/components/LocationInput'

export type BirthProfileForm = {
  display_name: string
  birth_date: string
  birth_time: string
  birth_place: string
  latitude: number
  longitude: number
  timezone: string
}

type Props = {
  value: BirthProfileForm
  onChange: (next: BirthProfileForm) => void
  showDisplayName?: boolean
}

export function isBirthProfileComplete(form: BirthProfileForm): boolean {
  return Boolean(
    form.birth_date &&
      form.birth_time &&
      form.birth_place &&
      typeof form.latitude === 'number' &&
      typeof form.longitude === 'number' &&
      (form.latitude !== 0 || form.longitude !== 0),
  )
}

export default function CheckoutBirthForm({ value, onChange, showDisplayName = false }: Props) {
  return (
    <div className="space-y-4">
      {showDisplayName ? (
        <div>
          <label className="mb-1 block text-sm text-cosmic-silver">Prénom ou surnom</label>
          <input
            value={value.display_name}
            onChange={(e) => onChange({ ...value, display_name: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            placeholder="Prénom ou surnom"
          />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-cosmic-silver">Date de naissance</label>
          <input
            type="date"
            value={value.birth_date}
            onChange={(e) => onChange({ ...value, birth_date: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-cosmic-silver">Heure de naissance</label>
          <input
            type="time"
            value={value.birth_time}
            onChange={(e) => onChange({ ...value, birth_time: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            required
          />
        </div>
      </div>
      <LocationInput
        value={value.birth_place}
        onChange={(birth_place) => onChange({ ...value, birth_place })}
        onLocationSelect={(location) =>
          onChange({
            ...value,
            birth_place: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            timezone: location.timezone || 'UTC',
          })
        }
        label="Lieu de naissance"
        required
      />
    </div>
  )
}
