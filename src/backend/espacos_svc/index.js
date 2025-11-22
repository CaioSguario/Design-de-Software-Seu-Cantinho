const express = require('express');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const path = require('path');
const { get_next_id, check_bd } = require('./utils/utils');
const app = express();
const PORT = 3001;

app.use(express.json());
const db_path = path.join(__dirname, 'db', 'espacos.json');
const db_dir = path.join(__dirname, 'db');

function load_espacos() {
  check_bd(db_dir, db_path);
  const data = fs.readFileSync(db_path);
  return JSON.parse(data);
}

function save_espacos(espaco) {
  check_bd(db_dir, db_path);
  fs.writeFileSync(db_path, JSON.stringify(espaco, null, 2));
}

app.get('/espacos/', (req, res) => {
  const espacos = load_espacos();
  res.json(espacos);
});


app.get('/espacos/:id', (req, res) => {
  const espacos = load_espacos();
  const espaco = espacos.find(c => c.id === Number(req.params.id));
  if (!espaco) return res.status(404).json({ erro: 'Não encontrado' });
  res.json(espaco);
});

app.post('/espacos', async (req, res) => {
  const { nome, descricao, capacidade, preco_por_hora, ativo } = req.body;
  try {
    const espacos = load_espacos();
    const novo = { id: get_next_id(db_path), nome, descricao, capacidade, preco_por_hora, ativo };
    espacos.push(novo);
    save_espacos(espacos);

    res.status(201).json(novo);
  } catch {
    res.status(400).json({ erro: 'Dados inválidos' });
  }
});


app.put('/espacos/:id', (req, res) => {
  const espacos = load_espacos();
  const index = espacos.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  espacos[index] = { id: Number(req.params.id), ...req.body };
  save_espacos(espacos);

  res.json(espacos[index]);
});

app.patch('/espacos/:id', (req, res) => {
  const espacos = load_espacos();
  const espaco = espacos.find(c => c.id === Number(req.params.id));
  if (!espaco) return res.status(404).json({ erro: 'Não encontrada' });

  Object.assign(espaco, req.body);
  save_espacos(espacos);

  res.json(espaco);
});

app.delete('/espacos/:id', (req, res) => {
  const espacos = load_espacos();
  const index = espacos.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  espacos.splice(index, 1);
  save_espacos(espacos);

  res.status(204).send();
});


app.head('/espacos/:id', (req, res) => {
  const espacos = load_espacos();
  const exists = espacos.some(c => c.id === Number(req.params.id));
  res.sendStatus(exists ? 200 : 404);
});

app.options('/espacos', (req, res) => {
  res.set('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.send();
});
const doc = yaml.load(
  fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8')
);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`espacos_svc rodando em http://localhost:${PORT}`);
});

