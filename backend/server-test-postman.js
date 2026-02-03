const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar solo el controlador de postman directamente
const { runPostmanWithRetry } = require('./dist/controllers/postman.controller.js');

const app = express();
const PORT = process.env.PORT || 4100;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta específica para test de postman
app.post('/api/postman/test-retry', async (req, res) => {
  
  try {
    await runPostmanWithRetry(req, res);
  } catch (error) {
    console.error('❌ Error en endpoint:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Servidor de prueba funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/test',
      'POST /api/postman/test-retry'
    ]
  });
});

app.listen(PORT, () => {
});