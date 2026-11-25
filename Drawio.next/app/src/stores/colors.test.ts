import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { PALETTE_16, recentColors, addRecentColor, isValidHex, normalizeHex } from './colors'

describe('colors store', () => {
  beforeEach(() => {
    recentColors.set(['#0284C7', '#F08705'])
  })

  it('PALETTE_16 contiene exactamente 16 colores válidos', () => {
    expect(PALETTE_16).toHaveLength(16)
    PALETTE_16.forEach(swatch => {
      expect(isValidHex(swatch.hex)).toBe(true)
      expect(swatch.name).toBeTypeOf('string')
      expect(swatch.hex.startsWith('#')).toBe(true)
    })
  })

  it('isValidHex valida correctamente formatos hexadecimales', () => {
    expect(isValidHex('#FFF')).toBe(true)
    expect(isValidHex('#0284C7')).toBe(true)
    expect(isValidHex('0284C7')).toBe(true)
    expect(isValidHex('#0284C7FF')).toBe(true)

    expect(isValidHex('')).toBe(false)
    expect(isValidHex('xyz')).toBe(false)
    expect(isValidHex('#12345')).toBe(false)
    expect(isValidHex('none')).toBe(false)
  })

  it('normalizeHex agrega el prefijo # cuando falta', () => {
    expect(normalizeHex('0284C7')).toBe('#0284C7')
    expect(normalizeHex('#0284C7')).toBe('#0284C7')
    expect(normalizeHex('   #FFF   ')).toBe('#FFF')
  })

  it('addRecentColor agrega al inicio y evita duplicados', () => {
    addRecentColor('#10B981')
    let list = get(recentColors)
    expect(list[0]).toBe('#10B981')
    expect(list).toContain('#0284C7')

    // Volver a agregar el mismo color lo mueve al frente
    addRecentColor('#0284C7')
    list = get(recentColors)
    expect(list[0]).toBe('#0284C7')
    expect(list.filter(c => c === '#0284C7')).toHaveLength(1)
  })

  it('addRecentColor ignora none, transparent y valores vacíos', () => {
    const before = get(recentColors)
    addRecentColor('none')
    addRecentColor('transparent')
    addRecentColor('')
    expect(get(recentColors)).toEqual(before)
  })
})
