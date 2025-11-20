const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

function loadReservas() {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
} 

app.get('/reservas/', (req, res) => {
  res.json(users);
});


app.get('/reservas/:id', (req, res) => {
  res.json(users);
});

app.post('/reservas', (req, res) =>{
    res.json();
});

app.put('/reservas', (req, res) =>{
    res.json();
});


app.put('/reservas/:id', (req, res) => {
  const consultas = loadReservas();
  const index = consultas.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  consultas[index] = { id: Number(req.params.id), ...req.body };
  saveConsultas(consultas);

  res.json(consultas[index]);
});

app.patch('/reservas/:id', (req, res) => {
  const consultas = loadReservas();
  const consulta = consultas.find(c => c.id === Number(req.params.id));
  if (!consulta) return res.status(404).json({ erro: 'Não encontrada' });

  Object.assign(consulta, req.body);
  saveConsultas(consultas);

  res.json(consulta);
});

app.delete('/reservas/:id', (req, res) => {
  let consultas = loadReservas();
  const index = consultas.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  consultas.splice(index, 1);
  saveConsultas(consultas);

  res.status(204).send();
});


app.head('/reservas/:id', (req, res) => {
  const consultas = loadConsultas();
  const exists = consultas.some(c => c.id === Number(req.params.id));
  res.sendStatus(exists ? 200 : 404);
});

app.options('/reservas', (req, res) => {
  res.set('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.send();
});
const doc = yaml.load(fs.readFileSync('./openapi.yaml', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`seu_cantinho rodando em http://localhost:${PORT}`);
});

