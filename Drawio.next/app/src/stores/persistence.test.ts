import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  saveDiagram,
  loadSavedDiagram,
  scheduleAutoSave,
  clearSavedDiagram,
  saveStatus,
  lastSavedTime,
  AUTOSAVE_STORAGE_KEY
} from './persistence'

describe('persistence store and autosave', () => {
  let mockStorage: Record<string, string> = {}
  let mockController: any

  beforeEach(() => {
    vi.useFakeTimers()
    mockStorage = {}
    mockController = {
      exportToXml: vi.fn(() => '<mxfile><diagram>test</diagram></mxfile>'),
      importXml: vi.fn((_xml: string) => true)
    }

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => { mockStorage[key] = val },
      removeItem: (key: string) => { delete mockStorage[key] }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('saveDiagram guarda el xml en localStorage y actualiza el estado', () => {
    saveDiagram(mockController)
    expect(mockController.exportToXml).toHaveBeenCalled()
    expect(mockStorage[AUTOSAVE_STORAGE_KEY]).toContain('<mxfile>')

    let status = ''
    saveStatus.subscribe(v => status = v)()
    expect(status).toBe('saved')

    let time: string | null = null
    lastSavedTime.subscribe(v => time = v)()
    expect(time).not.toBeNull()
  })

  it('loadSavedDiagram restaura el xml guardado si existe', () => {
    mockStorage[AUTOSAVE_STORAGE_KEY] = '<mxfile>existente</mxfile>'
    const restored = loadSavedDiagram(mockController)

    expect(restored).toBe(true)
    expect(mockController.importXml).toHaveBeenCalledWith(
      '<mxfile>existente</mxfile>',
      expect.any(Function)
    )
  })

  it('loadSavedDiagram retorna false si no hay contenido en localStorage', () => {
    const restored = loadSavedDiagram(mockController)
    expect(restored).toBe(false)
    expect(mockController.importXml).not.toHaveBeenCalled()
  })

  it('scheduleAutoSave ejecuta saveDiagram tras el debounce', () => {
    scheduleAutoSave(mockController, 300)
    expect(mockController.exportToXml).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(mockController.exportToXml).toHaveBeenCalled()
    expect(mockStorage[AUTOSAVE_STORAGE_KEY]).toBeDefined()
  })

  it('clearSavedDiagram elimina la clave de localStorage', () => {
    mockStorage[AUTOSAVE_STORAGE_KEY] = 'test'
    clearSavedDiagram()
    expect(mockStorage[AUTOSAVE_STORAGE_KEY]).toBeUndefined()
  })
})
