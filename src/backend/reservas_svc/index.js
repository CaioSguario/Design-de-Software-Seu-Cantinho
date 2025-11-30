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
    return { ok: false, erro: "Intervalo de datas inválido" };
  }

  // Checa se existe concomitancia
  const conflito = reservas.some(r =>
    r.id !== self_id &&
    r.espaco_id === espaco_id &&
    new Date(r.data_inicio).getTime() < fim &&
    new Date(r.data_fim).getTime() > inicio
  );

  if (conflito) {
    return { ok: false, erro: "Conflito: espaço já reservado neste horário" };
  }
  return { ok: true };
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
    try {
      const respostaEspaco = await axios.get(`http://espacos_svc:3001/espacos/${espaco_id}`);

      if (respostaEspaco.status === 404) {
        throw new Error("ESPACO_NAO_ENCONTRADO");
      }

      if (!respostaEspaco.data.ativo) {
        throw new Error("ESPACO_INATIVO");
      }
    } catch (error) {
      if (error.response?.status === 404) 
        return res.status(400).json({ erro: "Espaço não existe" });
      
      if (error.message === "ESPACO_INATIVO") 
        return res.status(400).json({ erro: "Espaço está inativo" });

      return res.status(400).json({ erro: "Erro ao validar espaço" });
    }

    try {
      const respostaCliente = await axios.get(`http://usuarios_svc:3003/usuarios/${cliente_id}`);
      if (respostaCliente.data.cargo != 'Cliente') throw Error();
    } catch (error) {
      return res.status(400).json({ erro: 'Cliente inválido' });
    }

    const reservas = load_reservas();

    const valid = validate_reserva(res, espaco_id, null, inicio, fim, reservas);
    if (!valid.ok) {
      return res.status(400).json({ erro: valid.erro });
    }

    const nova = { id: get_next_id(db_path), espaco_id, cliente_id, data_inicio, data_fim, status, status_pagamento, preco_total, criado_em: Date.now() };

    reservas.push(nova);
    save_reservas(reservas);

    res.status(201).json(nova);
  } catch (error) {
    console.error("Erro interno:", error.message);
    return res.status(500).json({ erro: "Erro interno no servidor" });
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

  const valid = validate_reserva(res, espaco_id, null, inicio, fim, reservas);
  if (!valid.ok) {
    return res.status(400).json({ erro: valid.erro });
  }

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

  const valid = validate_reserva(res, espaco_id, null, inicio, fim, reservas);
  if (!valid.ok) {
    return res.status(400).json({ erro: valid.erro });
  }

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
  fs.readFileSync('/openapi/openapi.yaml', 'utf8')
);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`reservas_svc rodando em http://localhost:${PORT}`);
});

module.exports = {
  load_reservas
};
