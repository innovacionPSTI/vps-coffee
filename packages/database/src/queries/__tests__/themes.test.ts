/**
 * Unit tests — themes queries
 *
 * Mocks createServerClient so no real DB connection is needed.
 */

import { getThemes, getActiveTheme, createTheme, updateTheme, setActiveTheme, deleteTheme } from '../themes'

// ── Supabase chain mock ────────────────────────────────────────────────────────

const mockSingle = jest.fn()
const mockMaybeSingle = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockEq = jest.fn()
const mockOrder = jest.fn()

// Chain builder: each method returns an object with the next expected method(s)
function chain(finalMethod: jest.Mock) {
  const obj: Record<string, jest.Mock> = {}
  obj.select = jest.fn().mockReturnValue(obj)
  obj.insert = jest.fn().mockReturnValue(obj)
  obj.update = jest.fn().mockReturnValue(obj)
  obj.delete = jest.fn().mockReturnValue(obj)
  obj.eq = jest.fn().mockReturnValue(obj)
  obj.order = jest.fn().mockReturnValue(obj)
  obj.single = finalMethod
  obj.maybeSingle = finalMethod
  return obj
}

const mockFrom = jest.fn()

jest.mock('../../client', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

const SAMPLE_THEME = {
  id: 1,
  name: 'VPS Coffee',
  is_active: true,
  is_default: true,
  color_primary: '#614A2A',
  color_dark: '#604B30',
  color_cream: '#FFF0D1',
  color_cream_warm: '#FFF1D3',
  color_yellow: '#FFF6B8',
  color_yellow_pale: '#FDF8B9',
  color_text: '#2D1A0A',
  font_display: 'cormorant',
  font_body: 'dm-sans',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// Helpers to set up the mock chain
function setupChain(resolvedValue: unknown) {
  const terminal = jest.fn().mockResolvedValue(resolvedValue)
  const c = chain(terminal)
  mockFrom.mockReturnValue(c)
  return { terminal, c }
}

beforeEach(() => jest.clearAllMocks())

// ── getThemes ─────────────────────────────────────────────────────────────────

describe('getThemes', () => {
  it('devuelve lista de temas ordenados por created_at', async () => {
    setupChain({ data: [SAMPLE_THEME], error: null })
    // getThemes uses .order(), no terminal (returns data directly)
    const c = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [SAMPLE_THEME], error: null }),
    }
    mockFrom.mockReturnValue(c)

    const result = await getThemes()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('VPS Coffee')
  })

  it('devuelve array vacío si data es null', async () => {
    const c = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockFrom.mockReturnValue(c)

    const result = await getThemes()
    expect(result).toEqual([])
  })

  it('lanza error si Supabase retorna error', async () => {
    const c = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
    }
    mockFrom.mockReturnValue(c)

    await expect(getThemes()).rejects.toThrow('DB error')
  })
})

// ── getActiveTheme ────────────────────────────────────────────────────────────

describe('getActiveTheme', () => {
  it('devuelve el tema activo', async () => {
    const c = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: SAMPLE_THEME }),
    }
    mockFrom.mockReturnValue(c)

    const result = await getActiveTheme()
    expect(result).not.toBeNull()
    expect(result?.is_active).toBe(true)
  })

  it('devuelve null si no hay tema activo', async () => {
    const c = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    }
    mockFrom.mockReturnValue(c)

    const result = await getActiveTheme()
    expect(result).toBeNull()
  })
})

// ── createTheme ───────────────────────────────────────────────────────────────

describe('createTheme', () => {
  it('crea un tema con is_active = false forzado', async () => {
    const insertMock = jest.fn().mockReturnThis()
    const selectMock = jest.fn().mockReturnThis()
    const singleMock = jest.fn().mockResolvedValue({
      data: { ...SAMPLE_THEME, id: 2, name: 'Nuevo', is_active: false },
      error: null,
    })
    const c = { insert: insertMock, select: selectMock, single: singleMock }
    mockFrom.mockReturnValue(c)

    const result = await createTheme({
      name: 'Nuevo',
      is_active: true, // debería ser ignorado / sobreescrito
      color_primary: '#000000',
      color_dark: '#111111',
      color_cream: '#FFFFFF',
      color_cream_warm: '#FFFFFE',
      color_yellow: '#FFFF00',
      color_yellow_pale: '#FFFFE0',
      color_text: '#333333',
      font_display: 'playfair',
      font_body: 'inter',
    })

    // El insert fue llamado con is_active: false, sin importar lo que se pasó
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }))
    expect(result.is_active).toBe(false)
  })

  it('lanza error si falla la inserción', async () => {
    const c = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error('insert failed') }),
    }
    mockFrom.mockReturnValue(c)

    await expect(createTheme({
      name: 'Roto',
      is_active: false,
      color_primary: '#000', color_dark: '#000', color_cream: '#FFF',
      color_cream_warm: '#FFF', color_yellow: '#FF0', color_yellow_pale: '#FF0',
      color_text: '#000', font_display: 'cormorant', font_body: 'dm-sans',
    })).rejects.toThrow('insert failed')
  })
})

// ── updateTheme ───────────────────────────────────────────────────────────────

describe('updateTheme', () => {
  it('actualiza un campo y devuelve el tema actualizado', async () => {
    const updated = { ...SAMPLE_THEME, name: 'Renombrado' }
    const c = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: updated, error: null }),
    }
    mockFrom.mockReturnValue(c)

    const result = await updateTheme(1, { name: 'Renombrado' })
    expect(result.name).toBe('Renombrado')
  })
})

// ── setActiveTheme ────────────────────────────────────────────────────────────

describe('setActiveTheme', () => {
  it('desactiva todos y activa el elegido (dos llamadas a from)', async () => {
    const deactivateEq = jest.fn().mockResolvedValue({ error: null })
    const activateEq = jest.fn().mockResolvedValue({ error: null })

    const deactivateChain = { update: jest.fn().mockReturnThis(), eq: deactivateEq }
    const activateChain   = { update: jest.fn().mockReturnThis(), eq: activateEq }

    mockFrom
      .mockReturnValueOnce(deactivateChain)  // primera llamada: desactivar activo
      .mockReturnValueOnce(activateChain)    // segunda llamada: activar el elegido

    await setActiveTheme(2)

    expect(mockFrom).toHaveBeenCalledTimes(2)
    expect(deactivateChain.update).toHaveBeenCalledWith({ is_active: false })
    expect(activateChain.update).toHaveBeenCalledWith({ is_active: true })
    expect(activateEq).toHaveBeenCalledWith('id', 2)
  })

  it('lanza error si la activación falla', async () => {
    const deactivateChain = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) }
    const activateChain   = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: new Error('activate failed') }) }

    mockFrom
      .mockReturnValueOnce(deactivateChain)
      .mockReturnValueOnce(activateChain)

    await expect(setActiveTheme(99)).rejects.toThrow('activate failed')
  })
})

// ── deleteTheme ───────────────────────────────────────────────────────────────

describe('deleteTheme', () => {
  it('lanza error si el tema es activo', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { is_active: true, is_default: false } }),
    }
    mockFrom.mockReturnValue(selectChain)

    await expect(deleteTheme(1)).rejects.toThrow('No se puede eliminar el tema activo')
  })

  it('lanza error si el tema es el predeterminado', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { is_active: false, is_default: true } }),
    }
    mockFrom.mockReturnValue(selectChain)

    await expect(deleteTheme(1)).rejects.toThrow('No se puede eliminar el tema por defecto')
  })

  it('lanza error si el tema no existe', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    }
    mockFrom.mockReturnValue(selectChain)

    await expect(deleteTheme(999)).rejects.toThrow('Tema no encontrado')
  })

  it('elimina el tema si no es activo ni predeterminado', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { is_active: false, is_default: false } }),
    }
    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }
    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(deleteChain)

    await expect(deleteTheme(2)).resolves.toBeUndefined()
    expect(deleteChain.delete).toHaveBeenCalled()
  })
})
