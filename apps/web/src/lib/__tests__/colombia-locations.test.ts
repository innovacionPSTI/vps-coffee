/**
 * Tests for colombia-locations.ts
 * Covers: DEPARTMENTS list, getCitiesForDepartment, completeness
 */

import { DEPARTMENTS, getCitiesForDepartment, COLOMBIA_LOCATIONS } from '../colombia-locations'

describe('DEPARTMENTS', () => {
  it('contains 33 departments', () => {
    expect(DEPARTMENTS).toHaveLength(33)
  })

  it('is sorted alphabetically', () => {
    const sorted = [...DEPARTMENTS].sort((a, b) => a.localeCompare(b, 'es'))
    expect(DEPARTMENTS).toEqual(sorted)
  })

  it('includes major departments', () => {
    expect(DEPARTMENTS).toContain('Antioquia')
    expect(DEPARTMENTS).toContain('Bogotá D.C.')
    expect(DEPARTMENTS).toContain('Valle del Cauca')
    expect(DEPARTMENTS).toContain('Cundinamarca')
    expect(DEPARTMENTS).toContain('Nariño')
    expect(DEPARTMENTS).toContain('Huila')
  })

  it('has no duplicates', () => {
    expect(new Set(DEPARTMENTS).size).toBe(DEPARTMENTS.length)
  })
})

describe('getCitiesForDepartment', () => {
  it('returns cities for a valid department', () => {
    const cities = getCitiesForDepartment('Antioquia')
    expect(cities.length).toBeGreaterThan(0)
    expect(cities).toContain('Medellín')
  })

  it('returns empty array for unknown department', () => {
    expect(getCitiesForDepartment('Narnia')).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(getCitiesForDepartment('')).toEqual([])
  })

  it('includes Bogotá for Bogotá D.C.', () => {
    const cities = getCitiesForDepartment('Bogotá D.C.')
    expect(cities).toContain('Bogotá')
  })

  it('includes Cali for Valle del Cauca', () => {
    expect(getCitiesForDepartment('Valle del Cauca')).toContain('Cali')
  })

  it('returns a sorted list', () => {
    const cities = getCitiesForDepartment('Cundinamarca')
    const sorted = [...cities].sort((a, b) => a.localeCompare(b, 'es'))
    expect(cities).toEqual(sorted)
  })
})

describe('COLOMBIA_LOCATIONS completeness', () => {
  it('every department entry has at least one city', () => {
    COLOMBIA_LOCATIONS.forEach(({ department, cities }) => {
      expect(cities.length).toBeGreaterThan(0, `${department} has no cities`)
    })
  })

  it('has no department with duplicate cities', () => {
    COLOMBIA_LOCATIONS.forEach(({ department, cities }) => {
      const unique = new Set(cities)
      expect(unique.size).toBe(cities.length, `${department} has duplicate cities`)
    })
  })
})
