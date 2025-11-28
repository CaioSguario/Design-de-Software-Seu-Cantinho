const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

app.use(cors()); 
app.use(express.json());

const PORT = 4000;

const ROUTES = {
  reservas: "http://reservas_svc:3000",
  espacos:  "http://espacos_svc:3001",
  pagamentos: "http://pagamentos_svc:3002",
  usuarios:   "http://usuarios_svc:3003"
};

app.all('/:service', async (req, res) => {
  proxy(req, res, req.params.service, req.params.service);
});

app.all('/:service/*', async (req, res) => {
  const service = req.params.service;
  const path = req.params[0];
  
  const fullPath = `${service}/${path}`;
  proxy(req, res, service, fullPath);
});

async function proxy(req, res, service, path) {
  const base = ROUTES[service];
  if (!base)
    return res.status(404).json({ error: "Serviço Desconhecido" });

  const forwardUrl = `${base}/${path}`;
  console.log(`BROKER encaminhou para ${forwardUrl}`);

  const forwardHeaders = { ...req.headers };
  
  delete forwardHeaders.host;
  delete forwardHeaders.connection;
  
  delete forwardHeaders['content-length']; 
  delete forwardHeaders['Content-Length']; 


  try {
    const response = await axios({
      method: req.method,
      url: forwardUrl,
      data: req.body, 
      params: req.query,
      headers: forwardHeaders,
    });

    res.status(response.status).json(response.data);

  } catch (err) {
    if (err.response) {
      console.error(`Erro no Microsserviço (${service}): Status ${err.response.status}`);
      return res.status(err.response.status).json(err.response.data);
    }
    console.error("Erro de Rede ou Conexão:", err.message);
    res.status(500).json({ error: "Broker falhou", details: err.message });
  }
}

app.listen(PORT, () => {
  console.log(`BROKER rodando em http://localhost:${PORT}`);
});