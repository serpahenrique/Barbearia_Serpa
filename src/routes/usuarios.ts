import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "node:crypto"
import { transporter } from "./cliente"
import { autenticacao } from "../middlewares/autenticacao"
import { registrarLog } from "../utilitarios/registrarLog"
import { senhaEhForte, mensagemRegrasSenha } from "../utilitarios/validarSenha"

const router = Router()

const numeroDeRodadasCriptografia = 10
const quantidadeMaximaTentativasLogin = 3
const validadeCodigoRecuperacaoEmMinutos = 15

const usuarioSchema = z.object({
  nome: z.string()
    .min(3, "Nome deve possuir no mínimo 3 caracteres")
    .max(60, "Nome deve ter no máximo 60 caracteres"),
  email: z.string().email({ message: "Email inválido" }),
  senha: z.string().min(8, mensagemRegrasSenha).refine(senhaEhForte, mensagemRegrasSenha),
  barbeiroId: z.number().optional()
})

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  senha: z.string().min(1, "Senha é obrigatória")
})

const solicitarRecuperacaoSenhaSchema = z.object({
  email: z.string().email({ message: "Email inválido" })
})

const redefinirSenhaSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  codigoRecuperacao: z.string().min(1, "Código de recuperação é obrigatório"),
  novaSenha: z.string().min(8, mensagemRegrasSenha).refine(senhaEhForte, mensagemRegrasSenha)
})

function gerarCodigoAtivacao() {
  return crypto.randomBytes(32).toString("hex")
}

function gerarCodigoRecuperacaoSenha() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function formatarDataHora(data: Date) {
  return new Date(data).toLocaleString("pt-BR")
}

async function enviarEmailAtivacaoConta(nome: string, email: string, codigoAtivacao: string) {
  const enderecoBase = process.env.URL_BASE_APLICACAO ?? "http://localhost:3001"
  const linkAtivacao = `${enderecoBase}/usuarios/ativar/${codigoAtivacao}`

  const mensagemHTML = `
    <div style="font-family: Helvetica, sans-serif; color:#333;">
      <div style="background:#333; color:white; padding:20px; text-align:center;">
        <h2>💈 Barbearia Serpa</h2>
        <h3>Ativação de Cadastro</h3>
      </div>
      <div style="padding:20px;">
        <p>Olá, ${nome}!</p>
        <p>Para ativar o seu cadastro no sistema, clique no link abaixo:</p>
        <p><a href="${linkAtivacao}">${linkAtivacao}</a></p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: '"Barbearia Serpa" <sistema@barbearia.com>',
    to: email,
    subject: "💈 Ative o seu cadastro",
    html: mensagemHTML
  })
}

async function enviarEmailRecuperacaoSenha(nome: string, email: string, codigoRecuperacao: string) {
  const mensagemHTML = `
    <div style="font-family: Helvetica, sans-serif; color:#333;">
      <div style="background:#333; color:white; padding:20px; text-align:center;">
        <h2>💈 Barbearia Serpa</h2>
        <h3>Recuperação de Senha</h3>
      </div>
      <div style="padding:20px;">
        <p>Olá, ${nome}!</p>
        <p>Utilize o código abaixo para redefinir a sua senha. Este código é válido por ${validadeCodigoRecuperacaoEmMinutos} minutos:</p>
        <h2 style="text-align:center;">${codigoRecuperacao}</h2>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: '"Barbearia Serpa" <sistema@barbearia.com>',
    to: email,
    subject: "💈 Código de recuperação de senha",
    html: mensagemHTML
  })
}

router.post("/", async (req, res) => {
  const valida = usuarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email, senha, barbeiroId } = valida.data

  try {
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } })
    if (usuarioExistente) {
      res.status(400).json({ erro: "Já existe um usuário cadastrado com este e-mail" })
      return
    }

    const senhaCriptografada = await bcrypt.hash(senha, numeroDeRodadasCriptografia)
    const codigoAtivacao = gerarCodigoAtivacao()

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        status: "INATIVO",
        codigoAtivacao,
        barbeiroId
      }
    })

    await registrarLog(usuario.id, "CADASTRO_USUARIO", `Usuário ${email} cadastrado no sistema`, req.ip)

    try {
      await enviarEmailAtivacaoConta(nome, email, codigoAtivacao)
    } catch (erroEnvioEmail) {
      console.log("Erro ao enviar e-mail de ativação:", erroEnvioEmail)
    }

    const { senha: senhaOmitida, codigoAtivacao: codigoOmitido, ...usuarioSemDadosSensiveis } = usuario

    res.status(201).json({
      usuario: usuarioSemDadosSensiveis,
      mensagem: "Usuário cadastrado com sucesso. Verifique seu e-mail para ativar a conta."
    })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao cadastrar usuário" })
  }
})

router.get("/", autenticacao, async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
        usuarioBloqueado: true,
        ultimoLogin: true,
        barbeiroId: true,
        criadoEm: true
      },
      orderBy: { id: "desc" }
    })

    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" })
  }
})

router.get("/ativar/:codigoAtivacao", async (req, res) => {
  const { codigoAtivacao } = req.params

  try {
    const usuario = await prisma.usuario.findFirst({ where: { codigoAtivacao } })

    if (!usuario) {
      res.status(400).json({ erro: "Código de ativação inválido" })
      return
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { status: "ATIVO", codigoAtivacao: null }
    })

    await registrarLog(usuario.id, "ATIVACAO_CONTA", `Conta do usuário ${usuario.email} ativada`, req.ip)

    res.status(200).json({ mensagem: "Conta ativada com sucesso. Você já pode realizar o login." })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao ativar conta" })
  }
})

router.post("/login", async (req, res) => {
  const valida = loginSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { email, senha } = valida.data

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      await registrarLog(null, "LOGIN_FALHA", `Tentativa de login com e-mail não cadastrado: ${email}`, req.ip)
      res.status(401).json({ erro: "E-mail ou senha inválidos" })
      return
    }

    if (usuario.usuarioBloqueado) {
      await registrarLog(usuario.id, "LOGIN_BLOQUEADO", `Tentativa de login de usuário bloqueado: ${email}`, req.ip)
      res.status(403).json({ erro: "Usuário bloqueado por excesso de tentativas inválidas. Solicite o desbloqueio a um administrador." })
      return
    }

    if (usuario.status !== "ATIVO") {
      res.status(403).json({ erro: "Usuário inativo. Verifique seu e-mail para ativar a conta antes de realizar o login." })
      return
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

    if (!senhaCorreta) {
      const tentativasAtualizadas = usuario.tentativasLoginInvalidas + 1
      const deveBloquear = tentativasAtualizadas >= quantidadeMaximaTentativasLogin

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          tentativasLoginInvalidas: tentativasAtualizadas,
          usuarioBloqueado: deveBloquear
        }
      })

      if (deveBloquear) {
        await registrarLog(usuario.id, "USUARIO_BLOQUEADO", `Usuário ${email} bloqueado após ${tentativasAtualizadas} tentativas inválidas`, req.ip)
        res.status(403).json({ erro: "Usuário bloqueado por excesso de tentativas inválidas. Solicite o desbloqueio a um administrador." })
        return
      }

      await registrarLog(usuario.id, "LOGIN_FALHA", `Senha inválida informada para o e-mail ${email}`, req.ip)
      res.status(401).json({ erro: "E-mail ou senha inválidos" })
      return
    }

    const ultimoLoginAnterior = usuario.ultimoLogin

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tentativasLoginInvalidas: 0,
        ultimoLogin: new Date()
      }
    })

    const chaveSecreta = process.env.JWT_SECRET as string
    const tempoExpiracaoToken = process.env.JWT_EXPIRACAO ?? "7d"

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      chaveSecreta,
      { expiresIn: tempoExpiracaoToken } as jwt.SignOptions
    )

    const mensagemBoasVindas = ultimoLoginAnterior
      ? `Bem-vindo, ${usuario.nome}. Seu último acesso ao sistema foi em ${formatarDataHora(ultimoLoginAnterior)}`
      : `Bem-vindo, ${usuario.nome}. Este é o seu primeiro acesso ao sistema`

    await registrarLog(usuario.id, "LOGIN_SUCESSO", `Login realizado com sucesso pelo usuário ${email}`, req.ip)

    res.status(200).json({
      token,
      mensagem: mensagemBoasVindas,
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email
      }
    })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao realizar login" })
  }
})

router.post("/recuperar-senha", async (req, res) => {
  const valida = solicitarRecuperacaoSenhaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { email } = valida.data

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      res.status(404).json({ erro: "Usuário não encontrado" })
      return
    }

    const codigoRecuperacaoSenha = gerarCodigoRecuperacaoSenha()
    const validadeCodigoRecuperacaoSenha = new Date(Date.now() + validadeCodigoRecuperacaoEmMinutos * 60 * 1000)

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { codigoRecuperacaoSenha, validadeCodigoRecuperacaoSenha }
    })

    await registrarLog(usuario.id, "SOLICITACAO_RECUPERACAO_SENHA", `Código de recuperação de senha solicitado para ${email}`, req.ip)

    try {
      await enviarEmailRecuperacaoSenha(usuario.nome, email, codigoRecuperacaoSenha)
    } catch (erroEnvioEmail) {
      console.log("Erro ao enviar e-mail de recuperação de senha:", erroEnvioEmail)
    }

    res.status(200).json({ mensagem: "Código de recuperação de senha enviado para o seu e-mail" })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao solicitar recuperação de senha" })
  }
})

router.post("/redefinir-senha", async (req, res) => {
  const valida = redefinirSenhaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { email, codigoRecuperacao, novaSenha } = valida.data

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario || usuario.codigoRecuperacaoSenha !== codigoRecuperacao) {
      res.status(400).json({ erro: "Código de recuperação inválido" })
      return
    }

    if (!usuario.validadeCodigoRecuperacaoSenha || usuario.validadeCodigoRecuperacaoSenha < new Date()) {
      res.status(400).json({ erro: "Código de recuperação expirado. Solicite um novo código." })
      return
    }

    const novaSenhaCriptografada = await bcrypt.hash(novaSenha, numeroDeRodadasCriptografia)

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: novaSenhaCriptografada,
        codigoRecuperacaoSenha: null,
        validadeCodigoRecuperacaoSenha: null,
        tentativasLoginInvalidas: 0,
        usuarioBloqueado: false
      }
    })

    await registrarLog(usuario.id, "REDEFINICAO_SENHA", `Senha redefinida através do código de recuperação para ${email}`, req.ip)

    res.status(200).json({ mensagem: "Senha redefinida com sucesso" })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao redefinir senha" })
  }
})

router.patch("/:id/desbloquear", autenticacao, async (req, res) => {
  const { id } = req.params

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { usuarioBloqueado: false, tentativasLoginInvalidas: 0 }
    })

    await registrarLog(usuario.id, "DESBLOQUEIO_USUARIO", `Usuário ${usuario.email} desbloqueado`, req.ip)

    res.status(200).json({ mensagem: "Usuário desbloqueado com sucesso" })
  } catch (error) {
    res.status(400).json({ erro: "Erro ao desbloquear usuário" })
  }
})


export default router
