'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Search, X, Loader2, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/lib/useTranslation'

interface City {
  name: string
  aliases?: string[]
  latitude: number
  longitude: number
  timezone: string
}

interface GeocodedPlace {
  name: string
  display_name: string
  latitude: number
  longitude: number
  timezone?: string
  type: 'geocoded'
}

type LocationResult = City | GeocodedPlace

interface LocationInputProps {
  value: string
  onChange: (location: string) => void
  onLocationSelect?: (location: { name: string; latitude: number; longitude: number; timezone?: string }) => void
  label?: string
  placeholder?: string
  error?: string
  success?: boolean
  required?: boolean
  tooltip?: string
}

export default function LocationInput({
  value,
  onChange,
  onLocationSelect,
  label,
  placeholder,
  error,
  success,
  required = false,
  tooltip,
}: LocationInputProps) {
  const t = useTranslation()
  const defaultLabel = label || t.dashboard.birthPlace
  const defaultPlaceholder = placeholder || t.tooltips.locationSearch
  const [cities, setCities] = useState<City[]>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([])
  const [geocodedPlaces, setGeocodedPlaces] = useState<GeocodedPlace[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load cities data
  useEffect(() => {
    const loadCities = async () => {
      try {
        console.log('[LocationInput] Loading cities from public folder...')
        // Try public folder first
        const response = await fetch('/data/resources/cities.json')
        if (!response.ok) throw new Error('Not found in public folder')
        const data = await response.json()
        console.log('[LocationInput] Loaded', data.length, 'cities from public folder')
        setCities(data)
      } catch (error) {
        console.error('[LocationInput] Failed to load cities from public folder:', error)
        // Fallback: try API endpoint
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          console.log('[LocationInput] Trying API endpoint:', `${apiUrl}/cities`)
          const apiResponse = await fetch(`${apiUrl}/cities`)
          if (!apiResponse.ok) throw new Error('API endpoint failed')
          const apiData = await apiResponse.json()
          console.log('[LocationInput] Loaded', apiData.length, 'cities from API')
          setCities(apiData)
        } catch (apiError) {
          console.error('[LocationInput] Failed to load cities from API:', apiError)
        }
      }
    }
    loadCities()
  }, [])

  // Geocode place using Nominatim (OpenStreetMap)
  const geocodePlace = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setGeocodedPlaces([])
      return
    }

    setIsGeocoding(true)
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    // Set timeout to abort after 10 seconds
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, 10000)
    
    try {
      console.log('[LocationInput] Geocoding query:', query)
      // Use Nominatim API (free, no API key required)
      // Note: Nominatim requires a User-Agent header and has rate limits (1 req/sec)
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=5&` +
        `addressdetails=1&` +
        `extratags=1`
      
      console.log('[LocationInput] Geocoding URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OrbitalAstro/1.0 (https://orbitalastro.com)',
          'Accept': 'application/json',
        },
        signal: abortController.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[LocationInput] Geocoding failed:', response.status, response.statusText, errorText)
        
        // Handle rate limiting (429)
        if (response.status === 429) {
          console.warn('[LocationInput] Rate limited by Nominatim, will retry later')
          setGeocodedPlaces([])
          return
        }
        
        throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[LocationInput] Geocoding results:', data.length, 'places found', data)
      
      if (!Array.isArray(data)) {
        console.error('[LocationInput] Invalid response format:', data)
        setGeocodedPlaces([])
        return
      }
      
      const places: GeocodedPlace[] = data.map((item: any) => ({
        name: item.display_name,
        display_name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: 'geocoded' as const,
      }))
      
      console.log('[LocationInput] Processed places:', places)
      setGeocodedPlaces(places)
    } catch (error: any) {
      // Clear timeout if still active
      clearTimeout(timeoutId)
      
      console.error('[LocationInput] Geocoding error:', error)
      
      // Handle timeout or abort
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.warn('[LocationInput] Geocoding request timed out or was aborted')
      } else if (error.message?.includes('fetch')) {
        console.warn('[LocationInput] Network error during geocoding')
      }
      
      setGeocodedPlaces([])
    } finally {
      setIsGeocoding(false)
      abortControllerRef.current = null
    }
  }, [])

  // Filter cities and geocode places based on input
  useEffect(() => {
    if (!value || value.trim() === '') {
      setFilteredCities([])
      setGeocodedPlaces([])
      setIsOpen(false)
      return
    }

    const searchTerm = value.toLowerCase().trim()
    
    // Filter cities
    const filtered = cities.filter((city) => {
      const nameMatch = city.name.toLowerCase().includes(searchTerm)
      const aliasMatch = city.aliases?.some((alias) =>
        alias.toLowerCase().includes(searchTerm)
      )
      return nameMatch || aliasMatch
    })

    setFilteredCities(filtered.slice(0, 5)) // Limit to 5 city results

    // Geocode for specific places (debounced)
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current)
    }

    // Only geocode if it looks like a specific place (not just a city name)
    // or if no cities match
    // Also geocode if the search term is longer (likely a specific address/place)
    const shouldGeocode = filtered.length === 0 || 
      searchTerm.length > 10 || 
      searchTerm.includes('hospital') || 
      searchTerm.includes('clinic') || 
      searchTerm.includes('center') || 
      searchTerm.includes('centre') ||
      searchTerm.includes('street') ||
      searchTerm.includes('avenue') ||
      searchTerm.includes('road') ||
      searchTerm.includes('rue') ||
      searchTerm.includes('avenue')
    
    if (shouldGeocode) {
      geocodeTimeoutRef.current = setTimeout(() => {
        geocodePlace(value)
      }, 800) // Increased debounce to 800ms to respect Nominatim rate limits
    } else {
      setGeocodedPlaces([])
    }

    // Don't set isOpen here - let the separate effect handle it

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [value, cities, geocodePlace])

  // Update isOpen when filtered cities or geocoded places change
  useEffect(() => {
    if (value && value.trim().length > 0) {
      setIsOpen(filteredCities.length > 0 || geocodedPlaces.length > 0 || isGeocoding)
    } else {
      setIsOpen(false)
    }
  }, [filteredCities.length, geocodedPlaces.length, isGeocoding, value])

  // Get timezone from coordinates (approximate based on latitude/longitude)
  const getTimezoneFromCoords = (lat: number, lon: number): string => {
    // Simple timezone approximation - in production, you'd use a proper timezone lookup
    // For now, return a common timezone based on region
    if (lat >= 24 && lat <= 49 && lon >= -125 && lon <= -66) {
      // USA/Canada
      if (lon >= -85) return 'America/New_York'
      if (lon >= -100) return 'America/Chicago'
      if (lon >= -115) return 'America/Denver'
      return 'America/Los_Angeles'
    }
    if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 40) {
      // Europe
      return 'Europe/Paris'
    }
    // Default fallback
    return 'UTC'
  }

  // Handle location selection
  const handleSelectLocation = (location: LocationResult) => {
    setSelectedLocation(location)
    const displayName = 'display_name' in location ? location.display_name : location.name
    onChange(displayName)
    setIsOpen(false)
    if (onLocationSelect) {
      const timezone = 'timezone' in location && location.timezone 
        ? location.timezone 
        : getTimezoneFromCoords(location.latitude, location.longitude)
      onLocationSelect({
        name: displayName,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone,
      })
    }
    inputRef.current?.blur()
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    if (selectedLocation) {
      const currentName = 'display_name' in selectedLocation ? selectedLocation.display_name : selectedLocation.name
      if (newValue !== currentName) {
        setSelectedLocation(null)
      }
    }
  }

  // Handle clear
  const handleClear = () => {
    onChange('')
    setSelectedLocation(null)
    setGeocodedPlaces([])
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative z-20">
      {defaultLabel && (
        <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
          {defaultLabel}
          {required && <span className="text-eclipse-red">*</span>}
          {tooltip && (
            <span className="ml-1 text-cosmic-gold cursor-help" title={tooltip}>
              ?
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
          <Search className="h-5 w-5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (filteredCities.length > 0 && value.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={defaultPlaceholder}
          required={required}
          suppressHydrationWarning
          className={` 
            w-full pl-10 pr-10 py-2 rounded-lg bg-white/10 border text-white placeholder-white/50
            focus:outline-none focus:ring-2 transition relative z-20
            ${error
              ? 'border-eclipse-red focus:ring-eclipse-red'
              : success
              ? 'border-aurora-teal focus:ring-aurora-teal'
              : 'border-white/20 focus:ring-cosmic-pink'
            }
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${defaultLabel}-error` : undefined}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
            aria-label="Clear location"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (filteredCities.length > 0 || geocodedPlaces.length > 0 || isGeocoding) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl max-h-80 overflow-y-auto"
          >
            {/* Cities Section */}
            {filteredCities.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-black/60 bg-white/50 border-b border-white/20">
                  {t.tooltips.cities}
                </div>
                {filteredCities.map((city, index) => (
                  <button
                    key={`city-${city.name}-${index}`}
                    type="button"
                    onClick={() => handleSelectLocation(city)}
                    className="w-full px-4 py-3 text-left hover:bg-white/20 transition flex items-center gap-3 text-black"
                  >
                    <MapPin className="h-5 w-5 text-cosmic-purple flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-black">{city.name}</div>
                      <div className="text-sm text-black/60">
                        {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)} • {city.timezone}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Geocoded Places Section */}
            {isGeocoding && (
              <div className="px-4 py-3 text-center text-black/60">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                <div className="text-sm">{t.tooltips.searchingPlaces}</div>
              </div>
            )}

            {geocodedPlaces.length > 0 && (
              <>
                {filteredCities.length > 0 && (
                  <div className="px-4 py-2 text-xs font-semibold text-black/60 bg-white/50 border-t border-b border-white/20">
                    {t.tooltips.specificPlaces}
                  </div>
                )}
                {geocodedPlaces.map((place, index) => (
                  <button
                    key={`place-${place.display_name}-${index}`}
                    type="button"
                    onClick={() => handleSelectLocation(place)}
                    className="w-full px-4 py-3 text-left hover:bg-white/20 transition flex items-start gap-3 text-black"
                  >
                    <Globe className="h-5 w-5 text-aurora-teal flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-black text-sm">{place.display_name}</div>
                      <div className="text-xs text-black/60 mt-1">
                        {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          id={`${defaultLabel}-error`}
          className="mt-1 text-sm text-eclipse-red flex items-center gap-1"
          role="alert"
        >
          {error}
        </motion.p>
      )}

      {/* Selected location info */}
      {selectedLocation && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-1 text-xs text-white/60 flex items-center gap-1"
        >
          <MapPin className="h-3 w-3" />
          {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          {'timezone' in selectedLocation && selectedLocation.timezone && (
            <> • {selectedLocation.timezone}</>
          )}
        </motion.div>
      )}
    </div>
  )
}

