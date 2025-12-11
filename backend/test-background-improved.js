// Script para probar el endpoint mejorado de Newman
const axios = require('axios');

async function testBackgroundExecution() {
  try {
    const response = await axios.post('http://localhost:3001/api/postman/run-retry', {
      projectName: 'YAMAHA',
      maxRetries: 1
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBackgroundExecution();