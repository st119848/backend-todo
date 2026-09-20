require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { drizzle } = require('drizzle-orm/libsql');
const { eq, sql } = require('drizzle-orm');
const { integer, sqliteTable, text } = require('drizzle-orm/sqlite-core');

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error(
    'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in the environment',
  );
}

const db = drizzle({
  connection: {
    url: databaseUrl,
    authToken,
  },
});

const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' })
    .notNull()
    .default(false),
});

let initializationPromise;

function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise = db.run(sql`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  return initializationPromise;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
);
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Read all todos
app.get('/todos', async (req, res) => {
  const result = await db.select().from(todos).orderBy(todos.id);
  res.json(result);
});

// Read one todo
app.get('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: 'Invalid todo ID' });
  }

  const [todo] = await db.select().from(todos).where(eq(todos.id, id)).limit(1);

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  res.json(todo);
});

// Create a todo
app.post('/todos', async (req, res) => {
  const { title, completed = false } = req.body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'Completed must be a boolean' });
  }

  const [todo] = await db
    .insert(todos)
    .values({ title: title.trim(), completed })
    .returning();

  res.status(201).json(todo);
});

// Update a todo
app.put('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: 'Invalid todo ID' });
  }

  const { title, completed } = req.body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'Completed must be a boolean' });
  }

  const [todo] = await db
    .update(todos)
    .set({ title: title.trim(), completed })
    .where(eq(todos.id, id))
    .returning();

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  res.json(todo);
});

// Delete a todo
app.delete('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: 'Invalid todo ID' });
  }

  const [todo] = await db
    .delete(todos)
    .where(eq(todos.id, id))
    .returning();

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  res.json(todo);
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Todo API running at http://localhost:${port}`);
  });
}

module.exports = app;
