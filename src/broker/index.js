const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = 4000;

const ROUTES = {
  reservas: "http://reservas_svc:3000",
  espacos:  "http://espacos_svc:3001",
  pagamentos: "http://pagamentos_svc:3002",
  usuarios:   "http://usuarios_svc:3003"
};

// Captura requisições sem path adicional
app.all('/:service', async (req, res) => {
  proxy(req, res, req.params.service, '');
});

// Captura requisições COM path depois do service
app.all('/:service/*', async (req, res) => {
  const service = req.params.service;
  const path = req.params[0]; // wildcard capturado
  proxy(req, res, service, path);
});

async function proxy(req, res, service, path) {
  const base = ROUTES[service];
  if (!base)
    return res.status(404).json({ error: "Serviço Desconhecido" });

  const forwardUrl = `${base}/${path}`;
  console.log(`BROKER encaminhou para ${forwardUrl}`);

  try {
    const response = await axios({
      method: req.method,
      url: forwardUrl,
      data: req.body,
      params: req.query,
      headers: req.headers,
    });

    res.status(response.status).json(response.data);

  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Broker falhou", details: err.message });
  }
}

app.listen(PORT, () => {
  console.log(`BROKER rodando em http://localhost:${PORT}`);
});

