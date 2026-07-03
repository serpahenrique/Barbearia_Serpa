export function senhaEhForte(senha: string): boolean {
  const possuiTamanhoMinimo = senha.length >= 8
  const possuiLetraMinuscula = /[a-z]/.test(senha)
  const possuiLetraMaiuscula = /[A-Z]/.test(senha)
  const possuiNumero = /[0-9]/.test(senha)
  const possuiSimbolo = /[^A-Za-z0-9]/.test(senha)

  return (
    possuiTamanhoMinimo &&
    possuiLetraMinuscula &&
    possuiLetraMaiuscula &&
    possuiNumero &&
    possuiSimbolo
  )
}

export const mensagemRegrasSenha =
  "A senha deve ter no mínimo 8 caracteres e conter letra maiúscula, letra minúscula, número e símbolo"
