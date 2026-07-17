import { describe, it, expect } from 'vitest';
import { calcularImc, clasificarImc } from '../imc';

describe('calcularImc', () => {
  it('calculates BMI from kg and cm', () => {
    expect(calcularImc(70, 170)).toBeCloseTo(24.22, 1);
  });
  it('returns null for invalid input', () => {
    expect(calcularImc(0, 170)).toBeNull();
    expect(calcularImc(70, 0)).toBeNull();
  });
});

describe('clasificarImc', () => {
  it('classifies categories', () => {
    expect(clasificarImc(17)).toBe('Bajo peso');
    expect(clasificarImc(22)).toBe('Normal');
    expect(clasificarImc(27)).toBe('Sobrepeso');
    expect(clasificarImc(32)).toBe('Obesidad');
  });
});
