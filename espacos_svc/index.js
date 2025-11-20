const express = require('express');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json());
const filePath = path.join(__dirname, 'db', 'espacos.json');

function loadEspacos() {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
} 

function saveEspacos(espaco) {
  fs.writeFileSync(filePath, JSON.stringify(espaco, null, 2));
}

app.get('/espacos/', (req, res) => {
  const reservas = loadEspacos();
  res.json(reservas);
});


app.get('/espacos/:id', (req, res) => {
  const espacos = loadEspacos();
  const espaco = espacos.find(c => c.id === Number(req.params.id));
  if (!espaco) return res.status(404).json({ erro: 'Não encontrada' });
  res.json();
  res.json(users);
});

app.post('/espacos', async (req, res) =>{
  const { nome, descricao, capacidade, preco_por_hora, ativo } = req.body;
    try {
      espacos = loadEspacos();
      const novo = {id, nome, descricao, capacidade, preco_por_hora, ativo};
      espacos.push(novo);
      saveEspacos(espacos);
  
      res.status(201).json(novo);
    } catch {
      res.status(400).json({ erro: 'Dados inválidos' });
    }
});


app.put('/espacos/:id', (req, res) => {
  const espacos = loadEspacos();
  const index = espacos.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  espacos[index] = { id: Number(req.params.id), ...req.body };
  saveEspacos(espacos);

  res.json(espacos[index]);
});

app.patch('/espacos/:id', (req, res) => {
  const espacos = loadEspacos();
  const espaco = espacos.find(c => c.id === Number(req.params.id));
  if (!espaco) return res.status(404).json({ erro: 'Não encontrada' });

  Object.assign(espaco, req.body);
  saveEspacos(espacos);

  res.json(espaco);
});

app.delete('/espacos/:id', (req, res) => {
  let espacos = loadEspacos();
  const index = espacos.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  espacos.splice(index, 1);
  saveEspacos(espacos);

  res.status(204).send();
});


app.head('/espacos/:id', (req, res) => {
  const espacos = loadEspacos();
  const exists = espacos.some(c => c.id === Number(req.params.id));
  res.sendStatus(exists ? 200 : 404);
});

app.options('/espacos', (req, res) => {
  res.set('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.send();
});

const doc = yaml.load(fs.readFileSync('./openapi.yaml', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`espacos_svc rodando em http://localhost:${PORT}`);
});

