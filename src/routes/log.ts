import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import { autenticacao } from "../middlewares/autenticacao"

const router = Router()

router.get('/', autenticacao, async (req, res) => {

    try {
        const logs = await prisma.log.findMany({ 
        })

        res.status(200).json(logs)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})

export default router