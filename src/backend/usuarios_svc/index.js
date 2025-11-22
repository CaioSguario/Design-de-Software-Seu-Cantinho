const express = require('express');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const path = require('path');
const { get_next_id } = require('./utils');
const app = express();
const PORT = 3003;

app.use(express.json());
const db_path = path.join(__dirname, 'db', 'usuarios.json');

function load_usuarios() {
  const data = fs.readFileSync(db_path);
  return JSON.parse(data);
} 

function save_usuarios(usuario) {
  fs.writeFileSync(db_path, JSON.stringify(usuario, null, 2));
}

app.get('/usuarios/', (req, res) => {
  const usuarios = load_usuarios();
  res.json(usuarios);
});


app.get('/usuarios/:id', (req, res) => {
  const usuarios = load_usuarios();
  const usuario = usuarios.find(c => c.id === Number(req.params.id));
  if (!usuario) return res.status(404).json({ erro: 'Não encontrado' });
  res.json(usuario);
});

app.post('/usuarios', async (req, res) =>{
  const { nome, cpf_cnpj, email, telefone, endereco, cargo } = req.body;
    try {
      const usuarios = load_usuarios();
      const novo = {id : get_next_id(db_path), nome, cpf_cnpj, email, telefone, endereco, cargo};
      usuarios.push(novo);
      save_usuarios(usuarios);
  
      res.status(201).json(novo);
    } catch {
      res.status(400).json({ erro: 'Dados inválidos' });
    }
});


app.put('/usuarios/:id', (req, res) => {
  const usuarios = load_usuarios();
  const index = usuarios.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  usuarios[index] = { id: Number(req.params.id), ...req.body };
  save_usuarios(usuarios);

  res.json(usuarios[index]);
});

app.patch('/usuarios/:id', (req, res) => {
  const usuarios = load_usuarios();
  const usuario = usuarios.find(c => c.id === Number(req.params.id));
  if (!usuario) return res.status(404).json({ erro: 'Não encontrada' });

  Object.assign(usuario, req.body);
  save_usuarios(usuarios);

  res.json(usuario);
});

app.delete('/usuarios/:id', (req, res) => {
  const usuarios = load_usuarios();
  const index = usuarios.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });

  usuarios.splice(index, 1);
  save_usuarios(usuarios);

  res.status(204).send();
});


app.head('/usuarios/:id', (req, res) => {
  const usuarios = load_usuarios();
  const exists = usuarios.some(c => c.id === Number(req.params.id));
  res.sendStatus(exists ? 200 : 404);
});

app.options('/usuarios', (req, res) => {
  res.set('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.send();
});

const doc = yaml.load(fs.readFileSync('../openapi.yaml', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));

app.listen(PORT, () => {
  console.log(`usuarios_svc rodando em http://localhost:${PORT}`);
});

