import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'
import nodemailer from "nodemailer"

const router = Router()

export const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  secure:false,
  auth: {
    user: process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_SENHA
  }})

const clienteSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve possuir no mínimo com 3 caracteres')
      .max(50, 'Nome deve ter no máximo== 50 caracteres'),
  email: z.string().email({ message: "Email inválido" })
})

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email } = valida.data

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email }
    })
    res.status(201).json(cliente)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email } = valida.data

  try {
    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { nome, email }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({ error })
  }
})

function gerarTabelaHTML_Vendas(vendas: any[]) {

  let html = `
  <div style="font-family: Helvetica, sans-serif; color:#333;">

    <div style="
      background:#333;
      color:white;
      padding:20px;
      text-align:center;
    ">
      <h2>💈 Barbearia Serpa</h2>
      <h3>Relatório de Vendas</h3>
    </div>

    <div style="padding:20px;">

      <table
        style="
          width:100%;
          border-collapse:collapse;
        "
      >

        <thead>

          <tr>

            <th style="padding:10px;border-bottom:2px solid #ccc;">Data</th>
            <th style="padding:10px;border-bottom:2px solid #ccc;">Cliente</th>
            <th style="padding:10px;border-bottom:2px solid #ccc;">Serviço</th>
            <th style="padding:10px;border-bottom:2px solid #ccc;">Barbeiro</th>
            <th style="padding:10px;border-bottom:2px solid #ccc;">Pagamento</th>
            <th style="padding:10px;border-bottom:2px solid #ccc;">Valor</th>

          </tr>

        </thead>

        <tbody>
  `

  let valorTotal = 0

  vendas.forEach((venda) => {

    valorTotal += Number(venda.preco)

    html += `
      <tr>

        <td style="padding:10px;">
          ${new Date(venda.data).toLocaleDateString("pt-BR")}
        </td>

        <td style="padding:10px;">
          ${venda.cliente?.nome ?? "-"}
        </td>

        <td style="padding:10px;">
          ${venda.servico?.nome ?? "-"}
        </td>

        <td style="padding:10px;">
          ${venda.barbeiro?.nome ?? "-"}
        </td>

        <td style="padding:10px;">
          ${venda.fPagamento ?? "-"}
        </td>

        <td style="padding:10px;">
          R$ ${Number(venda.preco).toFixed(2)}
        </td>

      </tr>
    `
  })

  html += `
        </tbody>

      </table>

      <h3 style="
        text-align:right;
        margin-top:20px;
      ">
        Total Faturado: R$ ${valorTotal.toFixed(2)}
      </h3>

    </div>

  </div>
  `

  return html
}

async function enviaEmailVendas(vendas: any[]) {

  const mensagemHTML = gerarTabelaHTML_Vendas(vendas)

  const info = await transporter.sendMail({

    from: '"Barbearia Serpa" <sistema@barbearia.com>',

    to: "Gabriel schug <gabriel.schug@exemplo.com>",

    subject: "💈 Relatório de Vendas",

    html: mensagemHTML

  })

  console.log("Email enviado:", info.messageId)
}

router.get("/email", async (req, res) => {

  try {

    const vendas = await prisma.venda.findMany({

      include: {
        cliente: true,
        barbeiro: true,
        servico: true
      }

    })

    await enviaEmailVendas(vendas)

    return res.status(200).json({

      mensagem: "Email enviado com sucesso!"

    })

  } catch (error) {

    console.error(error)

    return res.status(500).json({

      erro: "Erro ao enviar email"

    })
  
  }
})
export default router