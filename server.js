const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

// ensure data directory
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open DB', err);
    process.exit(1);
  }
});

// initialize tables
const initSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
`;

db.exec(initSql, (err) => {
  if (err) console.error('DB init error', err);
  else console.log('Database initialized.');
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Customers CRUD
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const sql = `INSERT INTO customers (name,email,phone,address) VALUES (?,?,?,?)`;
  db.run(sql, [name, email || null, phone || null, address || null], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (e, row) => {
      res.status(201).json(row);
    });
  });
});

app.get('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  });
});

app.put('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  const { name, email, phone, address } = req.body;
  const sql = `UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?`;
  db.run(sql, [name, email, phone, address, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM customers WHERE id = ?', [id], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      if (!row) return res.status(404).json({ error: 'not found' });
      res.json(row);
    });
  });
});

app.delete('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM customers WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Invoices: list and create (simple)
app.get('/api/invoices', (req, res) => {
  db.all('SELECT * FROM invoices ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/invoices', (req, res) => {
  const { customer_id, amount, status } = req.body;
  if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
  const sql = `INSERT INTO invoices (customer_id, amount, status) VALUES (?,?,?)`;
  db.run(sql, [customer_id, amount || 0, status || 'draft'], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM invoices WHERE id = ?', [this.lastID], (e, row) => {
      res.status(201).json(row);
    });
  });
});

// Fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
