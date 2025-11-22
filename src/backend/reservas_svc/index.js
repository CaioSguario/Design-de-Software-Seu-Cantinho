const express = require('express');
const axios = require('axios');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const path = require('path');
const { get_next_id, check_bd } = require('../utils/utils');
const app = express();
const PORT = 3000;

app.use(express.json());
const db_path = path.join(__dirname, 'db', 'reservas.json');
const db_dir = path.join(__dirname, 'db');

function load_reservas() {
  check_bd(db_dir, db_path);
  const data = fs.readFileSync(db_path);
  return JSON.parse(data);
} 

function save_reservas(consultas) {
  check_bd(db_dir, db_path);
  fs.writeFileSync(db_path, JSON.stringify(consultas, null, 2));
}

app.get('/reservas/', (req, res) => {
  const reservas = load_reservas();
  res.json(reservas);
});


app.get('/reservas/:id', (req, res) => {
  const reservas = load_reservas();
  const reserva = reservas.find(c => c.id === Number(req.params.id));
  if (!reserva) return res.status(404).json({ erro: 'Não encontrada' });
  res.json(reserva);
});

app.post('/reservas', async (req, res) =>{
  const { espaco_id, cliente_id, data_inicio, data_fim, status, status_pagamento, preco_total } = req.body;
    try {
      const resposta = await axios.get(`http://localhost:3001/espacos/${espaco_id}`);
      const espaco = resposta.data;
  
      const reservas = load_reservas();
      const nova = { id : get_next_id(db_path), espaco_id, cliente_id, data_inicio, data_fim, status, status_pagamento, preco_total, criado_em : Date.now()};
      reservas.push(nova);
      save_reservas(reservas);
  
      res.status(201).json(nova);
    } catch {
      res.status(400).json({ erro: 'Espaço inválido' });
    }
});


app.put('/reservas/:id', (req, res) => {
  const reservas = load_reservas();
  const index = reservas.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  reservas[index] = { id: Number(req.params.id), ...req.body };
  save_reservas(reservas);

  res.json(reservas[index]);
});

app.patch('/reservas/:id', (req, res) => {
  const reservas = load_reservas();
  const reserva = reservas.find(c => c.id === Number(req.params.id));
  if (!reserva) return res.status(404).json({ erro: 'Não encontrada' });

  Object.assign(reserva, req.body);
  save_reservas(reservas);

  res.json(reserva);
});

app.delete('/reservas/:id', (req, res) => {
  let reservas = load_reservas();
  const index = reservas.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  reservas.splice(index, 1);
  save_reservas(reservas);

  res.status(204).send();
});


app.head('/reservas/:id', (req, res) => {
  const reservas = load_reservas();
  const exists = reservas.some(c => c.id === Number(req.params.id));
  res.sendStatus(exists ? 200 : 404);
});

app.options('/reservas', (req, res) => {
  res.set('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.send();
});
const doc = yaml.load(fs.readFileSync(path.join(__dirname, '../openapi.yaml'), 'utf8'));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`reservas_svc rodando em http://localhost:${PORT}`);
});

module.exports = {
  load_reservas
};
