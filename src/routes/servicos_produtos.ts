import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import { Categorias } from "../../generated/prisma/enums"

const router = Router()

const servicoProdutosSchema = z.object({
nome: z.string()
    .min(3, "Nome deve possuir no mínimo 3 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
    quant: z.number()
    .int()
    .positive("Quantidade deve ser positiva"),
    categoria: z.nativeEnum(Categorias),
    preco: z.number()
    .positive("Preço deve ser positivo")
})

router.get("/", async (req, res) => {
    try {
    const servicosProdutos = await prisma.servico_produto.findMany()
    res.status(200).json(servicosProdutos)
    } catch (error) {
    res.status(500).json({
        erro: "Erro no servidor"
    })
    }
})

router.post("/", async (req, res) => {

    const valida = servicoProdutosSchema.safeParse(req.body)

    if (!valida.success) {
        res.status(400).json({
        erro: valida.error.format()
        })
    return
    }

    try {

    const { nome, quant, categoria, preco } = valida.data

    const servicoProduto = await prisma.servico_produto.create({
    data: {
        nome,
        quant,
        categoria,
        preco
        }
    })

    res.status(201).json(servicoProduto)

} catch (error) {
    res.status(500).json({
    erro: "Erro ao cadastrar serviço/produto"
    })
}
})

router.put("/:id", async (req, res) => {

    const { id } = req.params

    const valida = servicoProdutosSchema.safeParse(req.body)

    if (!valida.success) {
    res.status(400).json({
        erro: valida.error.format()
    })
    return
    }

    try {

    const { nome, quant, categoria, preco } = valida.data

    const servicoProdutoAtualizado =
        await prisma.servico_produto.update({
        where: {
            id: Number(id)
        },
        data: {
        nome,
        quant,
        categoria,
        preco
        }
        })

    res.status(200).json(servicoProdutoAtualizado)

    } catch (error) {
    res.status(500).json({
    erro: "Erro ao atualizar"
    })
    }
})

router.delete("/:id", async (req, res) => {

    const { id } = req.params
    try {
    await prisma.servico_produto.delete({
        where: {
            id: Number(id)
        }
    })
    res.status(200).json({
    mensagem: "Serviço/Produto excluído com sucesso"
    })
    } catch (error) {
    res.status(500).json({
    erro: "Erro ao excluir"
    })
    }
})

export default router