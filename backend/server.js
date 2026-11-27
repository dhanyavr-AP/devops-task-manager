import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let nextId = 4;
let tasks = [
  { id: 1, title: 'Explore the project dashboard', completed: true },
  { id: 2, title: 'Connect frontend to backend API', completed: false },
  { id: 3, title: 'Deploy containers to AWS EC2', completed: false }
];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'task-manager-backend', timestamp: new Date().toISOString() });
});

app.get('/api/tasks', (_req, res) => res.json(tasks));

app.post('/api/tasks', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'Task title is required.' });
  const task = { id: nextId++, title, completed: false };
  tasks.push(task);
  return res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = tasks.find(item => item.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  task.completed = !task.completed;
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const before = tasks.length;
  tasks = tasks.filter(item => item.id !== Number(req.params.id));
  if (tasks.length === before) return res.status(404).json({ error: 'Task not found.' });
  res.status(204).end();
});

app.listen(PORT, '0.0.0.0', () => console.log(`Task Manager API listening on ${PORT}`));
