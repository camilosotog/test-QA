const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar las funciones mejoradas
const { runPostmanWithRetry, getPostmanResultsWithAssertions } = require('./dist/controllers/postman.controller.js');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Ruta para ejecutar con el nuevo sistema de assertions
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

// Ruta para obtener resultados con assertions detalladas
app.get('/api/postman/results-detailed', async (req, res) => {
  try {
    await getPostmanResultsWithAssertions(req, res);
  } catch (error) {
    console.error('❌ Error obteniendo resultados detallados:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Servidor con sistema de assertions detalladas funcionando',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/test',
      'POST /api/postman/test-retry (Ejecutar con assertions detalladas)',
      'GET /api/postman/results-detailed (Ver resultados con assertions)'
    ]
  });
});

app.listen(PORT, () => {

});