/**
 * Valida o dígito verificador de um CNPJ.
 * Recebe apenas os 14 dígitos, sem formatação.
 */
export function validarCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false // Todos iguais

  const calc = (nums: string, weights: number[]) => {
    const sum = nums
      .split('')
      .reduce((acc, d, i) => acc + parseInt(d, 10) * (weights[i] ?? 0), 0)
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const d1 = calc(digits.slice(0, 12), w1)
  const d2 = calc(digits.slice(0, 13), w2)

  return parseInt(digits[12]!, 10) === d1 && parseInt(digits[13]!, 10) === d2
}

/**
 * Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX.
 */
export function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '')
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}
