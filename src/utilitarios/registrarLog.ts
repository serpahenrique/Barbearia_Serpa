import { prisma } from "../../lib/prisma"

export async function registrarLog(
  usuarioId: number | null,
  acao: string,
  descricao: string,
  enderecoIp?: string
) {
  try {
    await prisma.log.create({
      data: {
        usuarioId: usuarioId ?? undefined,
        acao,
        descricao,
        enderecoIp
      }
    })
  } catch (erro) {
    console.log("Erro ao registrar log de auditoria:", erro)
  }
}
