const express = require('express');
const axios = require('axios');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const path = require('path');
const { get_next_id, check_bd } = require('./utils/utils');
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

function validate_reserva(res, espaco_id, self_id, inicio, fim, reservas) {

  if (inicio >= fim) {
    res.status(400).json({ erro: "Intervalo de datas inválido" });
    return false;
  }

  // Checa se existe concomitancia
  const conflito = reservas.some(r =>
    r.id !== self_id &&
    r.espaco_id === espaco_id &&
    new Date(r.data_inicio).getTime() < fim &&
    new Date(r.data_fim).getTime() > inicio
  );

  if (conflito) {
    res.status(409).json({ erro: "Conflito: espaço já reservado neste horário" });
    return false;
  }
  return true;
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

app.post('/reservas', async (req, res) => {
  const { espaco_id, cliente_id, data_inicio, data_fim, status, status_pagamento, preco_total } = req.body;

  const inicio = new Date(data_inicio).getTime();
  const fim = new Date(data_fim).getTime();

  try {
    const resposta = await axios.get(`http://espacos_svc:3001/espacos/${espaco_id}`);

    const reservas = load_reservas();

    const valid = validate_reserva(res, espaco_id, null, inicio, fim, reservas);
    if(!valid) return;

    const nova = { id: get_next_id(db_path), espaco_id, cliente_id, data_inicio, data_fim, status, status_pagamento, preco_total, criado_em: Date.now() };

    reservas.push(nova);
    save_reservas(reservas);

    res.status(201).json(nova);
  } catch(error) {
    console.error("Erro ao buscar espaço:", error.message);
    res.status(400).json({ erro: 'Espaço inválido' });
  }
});


app.put('/reservas/:id', (req, res) => {
  const reservas = load_reservas();
  const index = reservas.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  const { espaco_id, data_inicio, data_fim } = req.body;
  const id = Number(req.params.id);
  
  const inicio = new Date(data_inicio).getTime();
  const fim = new Date(data_fim).getTime();

  const valid = validate_reserva(res, espaco_id, id, inicio, fim, reservas);
  if(!valid) return;

  reservas[index] = { id: Number(req.params.id), ...req.body };
  save_reservas(reservas);

  res.json(reservas[index]);
});

app.patch('/reservas/:id', (req, res) => {
  const reservas = load_reservas();
  const reserva = reservas.find(c => c.id === Number(req.params.id));
  if (!reserva) return res.status(404).json({ erro: 'Não encontrada' });

  const { espaco_id, data_inicio, data_fim } = req.body;
  const id = Number(req.params.id);

  const inicio = new Date(data_inicio).getTime();
  const fim = new Date(data_fim).getTime();

  const valid = validate_reserva(res, espaco_id, id, inicio, fim, reservas);
  if(!valid) return;

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
const doc = yaml.load(
  fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8')
);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`reservas_svc rodando em http://localhost:${PORT}`);
});

module.exports = {
  load_reservas
};
