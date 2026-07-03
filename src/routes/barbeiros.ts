import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import { autenticacao } from "../middlewares/autenticacao"

const router = Router()

const barbeiroSchema = z.object({
    nome: z.string()
      .min(3, 'Nome deve possuir no mínimo com 3 caracteres')
      .max(20, 'Nome deve ter no máximo 20 caracteres'),
    obs: z.string().optional(),
    saldo: z.number()
})

router.get("/", async (req, res) => {
    try {
        const barbeiros = await prisma.barbeiro.findMany({ orderBy: { id: "desc" } })
        res.status(200).json(barbeiros)
    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
})

router.post("/", async (req, res) => {
    const valida = barbeiroSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { nome, obs, saldo = "" } = valida.data

    try {
        const barbeiro = await prisma.barbeiro.create({
            data: { nome, obs, saldo }
        })
        res.status(201).json(barbeiro)
    } catch (error) {
        res.status(500).json({ error })
    }
})

router.put("/:id", async (req, res) => {
    const { id } = req.params

    const valida = barbeiroSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { nome, obs, saldo } = valida.data

    try {
        const barbeiro = await prisma.barbeiro.update({
            where: { id: Number(id) },
            data: { nome, obs, saldo }
        })
        res.status(200).json(barbeiro)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.delete("/:id", autenticacao, async (req, res) => {
    const { id } = req.params

    try {
        const barbeiro = await prisma.barbeiro.delete({
            where: { id: Number(id) }
        })
        res.status(200).json(barbeiro)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        res.status(400).json({ erro: 'Código inválido' })
        return
    }

    try {
        const barbeiro = await prisma.barbeiro.findUnique({ 
            where: { id } 
        })

        if (!barbeiro) {
            res.status(404).json({ erro: 'Barbeiro não cadastrado' })
            return
        }

        res.status(200).json(barbeiro)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})



export default router