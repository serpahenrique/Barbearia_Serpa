import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface RequisicaoAutenticada extends Request {
  usuario?: {
    id: number
    email: string
  }
}

export function autenticacao(req: RequisicaoAutenticada, res: Response, next: NextFunction) {
  const cabecalhoAutorizacao = req.headers.authorization

  if (!cabecalhoAutorizacao) {
    res.status(401).json({ erro: "Token de acesso não informado" })
    return
  }

  const partesCabecalho = cabecalhoAutorizacao.split(" ")

  if (partesCabecalho.length !== 2 || partesCabecalho[0] !== "Bearer") {
    res.status(401).json({ erro: "Token de acesso mal formatado" })
    return
  }

  const token = partesCabecalho[1]

  try {
    const chaveSecreta = process.env.JWT_SECRET as string
    const dadosToken = jwt.verify(token, chaveSecreta) as { id: number; email: string }

    req.usuario = dadosToken
    next()
  } catch (erro) {
    res.status(401).json({ erro: "Token de acesso inválido ou expirado" })
  }
}
