const express = require('express');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const path = require('path');
const { get_next_id } = require('../utils/utils');
const { load_reservas } = require('../reservas_svc');
const app = express();
const PORT = 3002;

app.use(express.json());
const db_path = path.join(__dirname, 'db', 'pagamentos.json');

function load_pagamentos() {
  const data = fs.readFileSync(db_path);
  return JSON.parse(data);
} 

function save_pagamentos(espaco) {
  fs.writeFileSync(db_path, JSON.stringify(espaco, null, 2));
}

app.get('/pagamentos/', (req, res) => {
  const pagamentos = load_pagamentos();
  res.json(pagamentos);
});


app.get('/pagamentos/:id', (req, res) => {
  const reservas = load_reservas();
  const pagamentos = reservas.find(c => c.id === Number(req.params.id)).pagamentos;
  if (!pagamentos) return res.status(404).json({ erro: 'Não encontrado' });
  res.json();
  res.json(pagamentos);
});

app.post('/pagamentos', async (req, res) =>{
  const { reserva_id, quantidade, pago_em, metodo} = req.body;
    try {
      const resposta = await axios.get(`http://localhost:3001/reservas/${reserva_id}`);
      const reserva = resposta.data;
    
      const pagamentos = load_pagamentos();
      const novo = {id : get_next_id(db_path), reserva_id, quantidade, pago_em, metodo};
      pagamentos.push(novo);
      save_pagamentos(pagamentos);
  
      res.status(201).json(novo);
    } catch {
      res.status(400).json({ erro: 'Dados inválidos' });
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

const doc = yaml.load(fs.readFileSync('../openapi.yaml', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`pagamentos_svc rodando em http://localhost:${PORT}`);
});

