const express = require('express');
const cors = require('cors');

// Importar rutas compiladas
const authRoutes = require('./dist/routes/auth.routes.js');
const postmanRoutes = require('./dist/routes/postman.routes.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/postman', postmanRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/test',
      'POST /api/postman/test-run',
      'POST /api/postman/test-retry',
      'POST /api/postman/test-long'
    ]
  });
});

app.listen(PORT, () => {

});