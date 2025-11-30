const express = require('express');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const path = require('path');
const axios = require("axios");
const { get_next_id, check_bd } = require('./utils/utils');
const app = express();
const PORT = 3002;

app.use(express.json());
const db_path = path.join(__dirname, 'db', 'pagamentos.json');
const db_dir = path.join(__dirname, 'db');

const RESERVAS_URL = process.env.RESERVAS_URL || "http://reservas_svc:3000";

async function getReservas() {
  const resp = await axios.get(`${RESERVAS_URL}/reservas`);
  return resp.data;
}

function load_pagamentos() {
  check_bd(db_dir, db_path);
  const data = fs.readFileSync(db_path);
  return JSON.parse(data);
}

function save_pagamentos(espaco) {
  check_bd(db_dir, db_path);
  fs.writeFileSync(db_path, JSON.stringify(espaco, null, 2));
}

app.get('/pagamentos/', (req, res) => {
  const pagamentos = load_pagamentos();
  res.json(pagamentos);
});


app.get('/pagamentos/:id', (req, res) => {
  const pagamentos = load_pagamentos();
  const pagamento = pagamentos.find(c => c.id === Number(req.params.id));
  if (!pagamento) return res.status(404).json({ erro: 'Não encontrado' });
  res.json(pagamento);
});

app.post('/pagamentos', async (req, res) => {
  const { reserva_id, quantia, pago_em, metodo } = req.body;
  try {
    try {
      const resposta = await axios.get(`http://reservas_svc:3000/reservas/${reserva_id}`);
    } catch (error) {
      return res.status(400).json({ erro: 'Reserva inválida' });      
    }

    const pagamentos = load_pagamentos();
    const novo = { id: get_next_id(db_path), reserva_id, quantia, pago_em, metodo };
    pagamentos.push(novo);
    save_pagamentos(pagamentos);

    res.status(201).json(novo);
  } catch {
    console.error("Erro interno:", error.message);
    return res.status(500).json({ erro: "Erro interno no servidor" });
  }
});


app.put('/pagamentos/:id', (req, res) => {
  const pagamentos = load_pagamentos();
  const index = pagamentos.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  pagamentos[index] = { id: Number(req.params.id), ...req.body };
  save_pagamentos(pagamentos);

  res.json(pagamentos[index]);
});

app.patch('/pagamentos/:id', (req, res) => {
  const pagamentos = load_pagamentos();
  const pagamento = pagamentos.find(c => c.id === Number(req.params.id));
  if (!pagamento) return res.status(404).json({ erro: 'Não encontrada' });

  Object.assign(pagamento, req.body);
  save_pagamentos(pagamentos);

  res.json(pagamento);
});

app.delete('/pagamentos/:id', (req, res) => {
  let pagamentos = load_pagamentos();
  const index = pagamentos.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  pagamentos.splice(index, 1);
  save_pagamentos(pagamentos);

  res.status(204).send();
});


app.head('/pagamentos/:id', (req, res) => {
  const pagamentos = load_pagamentos();
  const exists = pagamentos.some(c => c.id === Number(req.params.id));
  res.sendStatus(exists ? 200 : 404);
});

app.options('/pagamentos', (req, res) => {
  res.set('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.send();
});
const doc = yaml.load(
  fs.readFileSync('/openapi/openapi.yaml', 'utf8')
);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`pagamentos_svc rodando em http://localhost:${PORT}`);
});

