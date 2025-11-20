const express = require('express');
const axios = require('axios');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
const filePath = path.join(__dirname, 'db', 'reservas.json');

function loadReservas() {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
} 

function saveReservas(consultas) {
  fs.writeFileSync(filePath, JSON.stringify(consultas, null, 2));
}

app.get('/reservas/', (req, res) => {
  const reservas = loadReservas();
  res.json(reservas);
});


app.get('/reservas/:id', (req, res) => {
  const reservas = loadReservas();
  const reserva = reservas.find(c => c.id === Number(req.params.id));
  if (!reserva) return res.status(404).json({ erro: 'Não encontrada' });
  res.json(users);
});

app.post('/reservas', async (req, res) =>{
  const { espacoId, medico, data } = req.body;
    try {
      const resposta = await axios.get(`http://localhost:3001/espacos/${espacoId}`);
      const espaco = resposta.data;
  
      const reservas = loadReservas();
      const nova = { id , espaco, medico, data, created_at : Date.now()};
      reservas.push(nova);
      saveReservas(reservas);
  
      res.status(201).json(nova);
    } catch {
      res.status(400).json({ erro: 'Espaço inválido' });
    }
});


app.put('/reservas/:id', (req, res) => {
  const reservas = loadReservas();
  const index = reservas.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  reservas[index] = { id: Number(req.params.id), ...req.body };
  saveReservas(reservas);

  res.json(reservas[index]);
});

app.patch('/reservas/:id', (req, res) => {
  const reservas = loadReservas();
  const reserva = reservas.find(c => c.id === Number(req.params.id));
  if (!reserva) return res.status(404).json({ erro: 'Não encontrada' });

  Object.assign(reserva, req.body);
  saveReservas(reservas);

  res.json(reserva);
});

app.delete('/reservas/:id', (req, res) => {
  let reservas = loadReservas();
  const index = reservas.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  reservas.splice(index, 1);
  saveReservas(reservas);

  res.status(204).send();
});


app.head('/reservas/:id', (req, res) => {
  const reservas = loadReservas();
  const exists = reservas.some(c => c.id === Number(req.params.id));
  res.sendStatus(exists ? 200 : 404);
});

app.options('/reservas', (req, res) => {
  res.set('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.send();
});
const doc = yaml.load(fs.readFileSync('./openapi.yaml', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`reservas_svc rodando em http://localhost:${PORT}`);
});

