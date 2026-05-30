import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import { Categorias, Tipos } from "../../generated/prisma/enums"

const router = Router()

const vendaSchema = z.object({
  clienteId: z.number(),
  barbeiroId: z.number(),
  categoria: z.nativeEnum(Categorias),
  fPagamento: z.nativeEnum(Tipos),
  servicoId: z.number(),
  quant: z.number().positive({
    message: "Quantidade deve ser positiva"
  })

})

router.get("/", async (req, res) => {

  try {

    const vendas = await prisma.venda.findMany({

      include: {
        cliente: true,
        barbeiro: true,
        servico: true
      }

    })

    res.status(200).json(vendas)

  } catch (error) {

    console.log(error)

    res.status(500).json({
      erro: String(error)
    })

  }

})

router.post("/", async (req, res) => {

  const valida = vendaSchema.safeParse(req.body)

  if (!valida.success) {

    res.status(400).json({
      erro: valida.error.format()
    })

    return
  }

  const {
    clienteId,
    barbeiroId,
    categoria,
    fPagamento,
    servicoId,
    quant
  } = valida.data

  try {

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: clienteId
      }
    })
    if (!cliente) {
      res.status(400).json({
        erro: "Cliente inválido"
      })
      return
    }
    const barbeiro = await prisma.barbeiro.findUnique({
      where: {
        id: barbeiroId
      }
    })
    if (!barbeiro) {
      res.status(400).json({
        erro: "Barbeiro inválido"
      })
      return
    }

    const servicoProduto = await prisma.servico_produto.findUnique({

      where: {
        id: servicoId
      }

    })

    if (!servicoProduto) {

      res.status(400).json({
        erro: "Serviço ou produto inválido"
      })

      return
    }

    if (servicoProduto.categoria !== categoria) {
      res.status(400).json({
        erro: "Categoria incompatível com o item"
      })
      return
    }
    if (categoria === Categorias.Produto) {
      if (servicoProduto.quant < quant) {
        res.status(400).json({
          erro: `Tem apenas ${servicoProduto.quant} unidades em estoque`
        })
        return
      }
    }

    const valorVenda = Number(servicoProduto.preco) * quant

    const transactionItems: any[] = []

    transactionItems.push(

      prisma.venda.create({

        data: {
          clienteId,
          barbeiroId,
          servicoId,
          categoria,
          fPagamento,
          quant,
          preco: servicoProduto.preco
        }
      })
    )

    if (categoria === Categorias.Produto) {

      transactionItems.push(
        prisma.servico_produto.update({
          where: {
            id: servicoId
          },
          data: {
            quant: {
              decrement: quant
            }
          }
        })
      )
    }

    transactionItems.push(
      prisma.barbeiro.update({
        where: {
          id: barbeiroId
        },
        data: {
          saldo: {
            increment: valorVenda
          }
        }
      })
    )

    const resultado = await prisma.$transaction(transactionItems)

    res.status(201).json(resultado)

  } catch (error) {

    console.log(error)

    res.status(500).json({
      erro: String(error)
    })

  }

})

router.delete("/:id", async (req, res) => {

  const { id } = req.params

  try {
    const venda = await prisma.venda.findUnique({
      where: {
        id: Number(id)
      }
    })
    if (!venda) {
      res.status(404).json({
        erro: "Venda não encontrada"
      })
      return
    }
    const valorVenda = Number(venda.preco) * venda.quant
    const transactionItems: any[] = []
    transactionItems.push(
      prisma.venda.delete({
        where: {
          id: venda.id
        }
      })
    )

    if (venda.categoria === Categorias.Produto) {
      transactionItems.push(
        prisma.servico_produto.update({
          where: {
            id: venda.servicoId
          },
          data: {
            quant: {
              increment: venda.quant
            }
          }
        })
      )
    }

    transactionItems.push(
      prisma.barbeiro.update({
        where: {
          id: venda.barbeiroId
        },
        data: {
          saldo: {
            decrement: valorVenda
          }
        }
      })
    )
    const resultado = await prisma.$transaction(transactionItems)
    res.status(200).json(resultado)

  } catch (error) {

    console.log(error)

    res.status(500).json({
      erro: String(error)
    })

  }

})

export default router