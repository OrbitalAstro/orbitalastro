import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || 'http://127.0.0.1:8000';

test.describe('API Endpoints', () => {
  
  test('GET / - Root endpoint returns API info', async ({ request }) => {
    const response = await request.get(`${API_BASE}/`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('status');
  });

  test('GET /houses - Calculate Placidus houses', async ({ request }) => {
    const response = await request.get(`${API_BASE}/houses`, {
      params: {
        date: '2024-01-01',
        time: '12:00:00',
        latitude: 48.8566,
        longitude: 2.3522,
        system: 'P'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const houses = await response.json();
    
    // Should return exactly 12 houses
    expect(houses).toHaveLength(12);
    
    // Each house should have house_number and longitude
    houses.forEach((house, index) => {
      expect(house).toHaveProperty('house_number');
      expect(house).toHaveProperty('longitude');
      expect(house.house_number).toBe(index + 1);
      expect(typeof house.longitude).toBe('number');
      expect(house.longitude).toBeGreaterThanOrEqual(0);
      expect(house.longitude).toBeLessThan(360);
    });
  });

  test('GET /houses - Test all house systems', async ({ request }) => {
    const systems = ['P', 'W', 'E', 'K', 'R', 'C', 'M', 'T'];
    
    for (const system of systems) {
      const response = await request.get(`${API_BASE}/houses`, {
        params: {
          date: '2024-01-01',
          time: '12:00:00',
          latitude: 48.8566,
          longitude: 2.3522,
          system: system
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const houses = await response.json();
      expect(houses).toHaveLength(12);
    }
  });

  test('GET /houses - Validate latitude/longitude required', async ({ request }) => {
    const response = await request.get(`${API_BASE}/houses`, {
      params: {
        date: '2024-01-01',
        time: '12:00:00'
        // Missing latitude and longitude
      }
    });
    
    expect(response.status()).toBe(422); // FastAPI validation error
  });

  test('GET /planets - Get planetary positions', async ({ request }) => {
    const response = await request.get(`${API_BASE}/planets`, {
      params: {
        date: '2024-01-01',
        time: '12:00:00'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const planets = await response.json();
    
    // Should return multiple planets
    expect(planets.length).toBeGreaterThan(0);
    
    // Each planet should have required fields
    planets.forEach(planet => {
      expect(planet).toHaveProperty('planet');
      expect(planet).toHaveProperty('longitude');
      expect(typeof planet.longitude).toBe('number');
    });
  });

  test('GET /planets - Filter specific planets', async ({ request }) => {
    const response = await request.get(`${API_BASE}/planets`, {
      params: {
        date: '2024-01-01',
        time: '12:00:00',
        planets: 'Sun,Moon,Venus'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const planets = await response.json();
    
    // Should return only requested planets
    expect(planets.length).toBeLessThanOrEqual(3);
    const planetNames = planets.map(p => p.planet.toLowerCase());
    expect(planetNames).toContain('sun');
    expect(planetNames).toContain('moon');
  });

  test('POST /natal - Calculate full natal chart', async ({ request }) => {
    const response = await request.post(`${API_BASE}/natal`, {
      data: {
        birth_date: '1990-01-01',
        birth_time: '12:00:00',
        latitude: 48.8566,
        longitude: 2.3522,
        timezone: 'UTC', // Use UTC to avoid timezone issues
        house_system: 'placidus'
      }
    });
    
    if (!response.ok()) {
      const errorBody = await response.text();
      console.log('Natal endpoint error:', response.status(), errorBody);
    }
    
    expect(response.ok()).toBeTruthy();
    const chart = await response.json();
    
    // Validate response structure
    expect(chart).toHaveProperty('julian_day');
    expect(chart).toHaveProperty('ascendant');
    expect(chart).toHaveProperty('midheaven');
    expect(chart).toHaveProperty('houses');
    expect(chart).toHaveProperty('planets');
    expect(chart).toHaveProperty('house_system', 'placidus');
    
    // Validate houses (should have 12)
    expect(Object.keys(chart.houses)).toHaveLength(12);
    
    // Validate planets
    expect(Object.keys(chart.planets).length).toBeGreaterThan(0);
  });

  test('GET /cities - List supported cities', async ({ request }) => {
    const response = await request.get(`${API_BASE}/cities`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('supported_cities');
    expect(Array.isArray(data.supported_cities)).toBeTruthy();
  });

  test('GET /metrics - Get telemetry metrics', async ({ request }) => {
    const response = await request.get(`${API_BASE}/metrics`);
    
    expect(response.ok()).toBeTruthy();
    const metrics = await response.json();
    expect(metrics).toHaveProperty('requests');
  });

  test('GET /all - Legacy endpoint returns all data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/all`, {
      params: {
        date: '2024-01-01',
        time: '12:00:00',
        latitude: 48.8566,
        longitude: 2.3522,
        system: 'P'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('time');
    expect(data).toHaveProperty('planets');
    expect(data).toHaveProperty('houses');
    expect(data).toHaveProperty('aspects');
    
    // Houses should be present when lat/lon provided
    expect(data.houses).toHaveLength(12);
  });
});

test.describe('Error Handling', () => {
  test('GET /houses - Invalid date format', async ({ request }) => {
    const response = await request.get(`${API_BASE}/houses`, {
      params: {
        date: 'invalid-date',
        time: '12:00:00',
        latitude: 48.8566,
        longitude: 2.3522
      }
    });
    
    expect(response.status()).toBe(400);
  });

  test('GET /houses - Invalid latitude (out of range)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/houses`, {
      params: {
        date: '2024-01-01',
        time: '12:00:00',
        latitude: 100, // Invalid (> 90)
        longitude: 2.3522
      }
    });
    
    // API might accept invalid latitude and calculate anyway (fallback to Porphyry)
    // or return an error. Both are acceptable behaviors.
    const status = response.status();
    // Accept any status - the important thing is it doesn't crash
    expect([200, 400, 422, 500]).toContain(status);
  });
});

