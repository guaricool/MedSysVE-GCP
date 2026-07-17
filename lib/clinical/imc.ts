export function calcularImc(pesoKg: number, tallaCm: number): number | null {
  if (!pesoKg || !tallaCm || pesoKg <= 0 || tallaCm <= 0) return null;
  const m = tallaCm / 100;
  return Math.round((pesoKg / (m * m)) * 100) / 100;
}

export function clasificarImc(imc: number): string {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
}
