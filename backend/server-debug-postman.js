const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { runPostmanWithRetry } = require('./dist/controllers/postman.controller.js');

const app = express();
const PORT = 4100;

app.use(cors());
app.use(express.json());

app.post('/api/postman/test-retry', async (req, res) => {
  
  try {
    await runPostmanWithRetry(req, res);
  } catch (error) {
    console.error('❌ Error en endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Servidor con diagnóstico mejorado funcionando',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
});