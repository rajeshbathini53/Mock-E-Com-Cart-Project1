const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Create / open SQLite DB file
const dbFile = path.join(__dirname, 'vibe.db');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to open DB', err);
  } else {
    console.log('Connected to SQLite DB:', dbFile);
  }
});

// Init tables and seed product data
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    qty INTEGER NOT NULL,
    createdAt INTEGER
  );`);

  db.get('SELECT COUNT(*) as c FROM products', (err, row) => {
    if (err) return console.error(err);
    if (row.c === 0) {
      const products = [
        { id: 'p1', name: 'Vibe Tee - Black', price: 499.0, description: 'Cotton t-shirt' },
        { id: 'p2', name: 'Vibe Hoodie', price: 1299.0, description: 'Warm and cozy' },
        { id: 'p3', name: 'Vibe Sneakers', price: 2599.0, description: 'Comfortable everyday shoes' },
        { id: 'p4', name: 'Vibe Cap', price: 249.0, description: 'Adjustable cap' },
        { id: 'p5', name: 'Vibe Backpack', price: 1999.0, description: 'Durable laptop backpack' },
        { id: 'p6', name: 'Vibe Mug', price: 199.0, description: 'Ceramic mug' }
      ];
      const stmt = db.prepare('INSERT INTO products (id, name, price, description) VALUES (?, ?, ?, ?)');
      products.forEach(p => stmt.run(p.id, p.name, p.price, p.description));
      stmt.finalize(() => console.log('Seeded products'));
    }
  });
});

// Helper: compute cart total
function computeCartTotal(cartItems, callback) {
  if (!cartItems || cartItems.length === 0) return callback(null, 0);
  const ids = cartItems.map(ci => `'${ci.productId}'`).join(',');
  db.all(`SELECT id, name, price FROM products WHERE id IN (${ids})`, (err, rows) => {
    if (err) return callback(err);
    let total = 0;
    const productsById = {};
    rows.forEach(r => { productsById[r.id] = r; });
    for (const ci of cartItems) {
      const p = productsById[ci.productId];
      if (p) total += p.price * ci.qty;
    }
    callback(null, total);
  });
}

// API: get products
app.get('/api/products', (req, res) => {
  db.all('SELECT id, name, price, description FROM products', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// API: add to cart
// body: { productId, qty }
app.post('/api/cart', (req, res) => {
  const { productId, qty } = req.body;
  if (!productId || !qty || qty <= 0) return res.status(400).json({ error: 'productId and qty required' });

  // If product already in cart, update qty
  db.get('SELECT id, qty FROM cart WHERE productId = ?', [productId], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (row) {
      const newQty = row.qty + qty;
      db.run('UPDATE cart SET qty = ? WHERE id = ?', [newQty, row.id], function (uerr) {
        if (uerr) return res.status(500).json({ error: 'DB update error' });
        res.json({ id: row.id, productId, qty: newQty });
      });
    } else {
      const id = uuidv4();
      const createdAt = Date.now();
      db.run('INSERT INTO cart (id, productId, qty, createdAt) VALUES (?, ?, ?, ?)', [id, productId, qty, createdAt], function (ierr) {
        if (ierr) return res.status(500).json({ error: 'DB insert error' });
        res.json({ id, productId, qty });
      });
    }
  });
});

// API: delete cart item by cart id
app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM cart WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ success: true, id });
  });
});

// API: get cart (items + total)
app.get('/api/cart', (req, res) => {
  db.all('SELECT c.id as cartId, c.productId, c.qty, p.name, p.price FROM cart c JOIN products p ON c.productId = p.id', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const items = rows.map(r => ({
      id: r.cartId,
      productId: r.productId,
      name: r.name,
      price: r.price,
      qty: r.qty,
      lineTotal: +(r.price * r.qty).toFixed(2)
    }));
    const total = items.reduce((s, it) => s + it.lineTotal, 0);
    res.json({ items, total: +total.toFixed(2) });
  });
});

// API: update cart item qty (optional)
// POST /api/cart/update { id, qty }
app.post('/api/cart/update', (req, res) => {
  const { id, qty } = req.body;
  if (!id || qty == null) return res.status(400).json({ error: 'id and qty required' });
  if (qty <= 0) {
    db.run('DELETE FROM cart WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      return res.json({ success: true, removed: true });
    });
  } else {
    db.run('UPDATE cart SET qty = ? WHERE id = ?', [qty, id], function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Cart item not found' });
      res.json({ success: true, id, qty });
    });
  }
});

// API: checkout
// POST /api/checkout { name, email } or { cartItems }
// We'll read the DB cart and create a mock receipt
app.post('/api/checkout', (req, res) => {
  const { name, email } = req.body;
  db.all('SELECT c.id as cartId, c.productId, c.qty, p.name as productName, p.price FROM cart c JOIN products p ON c.productId = p.id', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const items = rows.map(r => ({
      productId: r.productId,
      name: r.productName,
      qty: r.qty,
      price: r.price,
      lineTotal: +(r.price * r.qty).toFixed(2)
    }));
    const total = +(items.reduce((s, it) => s + it.lineTotal, 0)).toFixed(2);
    const receipt = {
      id: uuidv4(),
      name: name || null,
      email: email || null,
      items,
      total,
      timestamp: new Date().toISOString()
    };

    // Clear the cart after checkout
    db.run('DELETE FROM cart', [], function (derr) {
      if (derr) console.error('Failed to clear cart after checkout', derr);
      // respond with mock receipt
      res.json({ receipt });
    });
  });
});

// Health check
app.get('/', (req, res) => {
  res.send('Vibe backend running');
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
