const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let nextId = 3;
const todos = [
  { id: 1, title: 'Learn Express.js', completed: false },
  { id: 2, title: 'Build a CRUD API', completed: false },
];

function findTodo(id) {
  return todos.find((todo) => todo.id === Number(id));
}

// Read all todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// Read one todo
app.get('/todos/:id', (req, res) => {
  const todo = findTodo(req.params.id);

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  res.json(todo);
});

// Create a todo
app.post('/todos', (req, res) => {
  const { title, completed = false } = req.body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'Completed must be a boolean' });
  }

  const todo = {
    id: nextId++,
    title: title.trim(),
    completed,
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// Update a todo
app.put('/todos/:id', (req, res) => {
  const todo = findTodo(req.params.id);

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  const { title, completed } = req.body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'Completed must be a boolean' });
  }

  todo.title = title.trim();
  todo.completed = completed;

  res.json(todo);
});

// Delete a todo
app.delete('/todos/:id', (req, res) => {
  const index = todos.findIndex((todo) => todo.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  const [deletedTodo] = todos.splice(index, 1);
  res.json(deletedTodo);
});

app.listen(port, () => {
  console.log(`Todo API running at http://localhost:${port}`);
});
