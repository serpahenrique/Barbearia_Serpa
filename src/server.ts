import express from 'express'
const app = express()
const port = 3001

import routesBarbeiros from "./routes/barbeiros"
import routesClientes from "./routes/cliente"
import routesVendas from "./routes/vendas"
import routesServicosProdutos from "./routes/servicos_produtos"
import routesUsuarios from "./routes/usuarios"

app.use(express.json())

app.use("/barbeiros", routesBarbeiros)
app.use("/clientes", routesClientes)
app.use("/servicos_produtos", routesServicosProdutos)
app.use("/vendas", routesVendas)
app.use("/usuarios", routesUsuarios)

app.get('/', (req, res) => {
  res.send('API: Sistema da Barbearia Serpa')
})

app.listen(port, () => {
  console.log(`Servidor Rodando na Porta: ${port}`)
})
