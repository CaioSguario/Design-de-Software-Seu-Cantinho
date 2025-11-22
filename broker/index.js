const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = 4000;

const ROUTES = {
  reservas: "http://localhost:3000",
  espacos:  "http://localhost:3001",
  pagamentos: "http://localhost:3002",
  usuarios:   "http://localhost:3003"
};

app.all('/:service/*?', async (req, res) => {
  const service = req.params.service;

  const base = ROUTES[service];
  if (!base)
    return res.status(404).json({ error: "Serviço Desconhecido" });

  const forwardUrl = base + req.originalUrl;
  console.log(`BROKER: Recebeu ${req.originalUrl}, mandou ${forwardUrl}`);
  try {
    const response = await axios({
      method: req.method,
      url: forwardUrl,
      data: req.body,
      headers: req.headers
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Broker falhou", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`BROKER rodando em http://localhost:${PORT}`);
});