const express = require('express');
const router = express.Router();
const { processUserMessage } = require('../ai/nlpProcessor');
const { v4: uuidv4 } = require('uuid');

// POST /api/chat/message - Procesar mensaje del usuario
router.post('/message', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'El mensaje no puede estar vacío'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        error: 'Se requiere un ID de usuario'
      });
    }
    
    // Procesar mensaje con AI
    const response = await processUserMessage(message, userId);
    
    // Agregar metadata
    response.id = uuidv4();
    response.timestamp = new Date().toISOString();
    response.user_message = message;
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Error procesando mensaje de chat:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No pude procesar tu mensaje. Por favor intenta de nuevo.'
    });
  }
});

// GET /api/chat/suggestions - Obtener sugerencias de preguntas
router.get('/suggestions', (req, res) => {
  try {
    const suggestions = [
      "¿Cuál animal ha salido más esta semana?",
      "¿Qué animal me recomiendas para el próximo sorteo?",
      "Analiza los patrones del león",
      "Muéstrame las estadísticas de hoy",
      "¿Cuándo fue la última vez que salió el águila?",
      "Hazme una predicción para la próxima hora",
      "¿Qué tendencia hay en los números pares?",
      "Analiza los patrones de los animales acuáticos",
      "¿Cuáles son los animales más frecuentes del mes?",
      "¿Qué probabilidad tiene el tigre de salir hoy?"
    ];
    
    // Seleccionar 5 sugerencias aleatorias
    const randomSuggestions = suggestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    
    res.json({
      success: true,
      data: randomSuggestions
    });
    
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({
      error: 'Error obteniendo sugerencias'
    });
  }
});

// POST /api/chat/feedback - Recibir feedback del usuario
router.post('/feedback', async (req, res) => {
  try {
    const { messageId, rating, feedback, userId } = req.body;
    
    // Aquí podrías guardar el feedback en la base de datos
    // para mejorar el sistema con el tiempo
    
    console.log('Feedback recibido:', {
      messageId,
      rating,
      feedback,
      userId,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Feedback recibido correctamente'
    });
    
  } catch (error) {
    console.error('Error guardando feedback:', error);
    res.status(500).json({
      error: 'Error guardando feedback'
    });
  }
});

// GET /api/chat/history/:userId - Obtener historial de conversación
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Aquí podrías implementar la lógica para obtener
    // el historial de conversaciones desde la base de datos
    
    res.json({
      success: true,
      data: {
        conversations: [],
        total: 0,
        hasMore: false
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      error: 'Error obteniendo historial'
    });
  }
});

// POST /api/chat/quick-action - Acciones rápidas predefinidas
router.post('/quick-action', async (req, res) => {
  try {
    const { action, userId } = req.body;
    
    let message = '';
    
    switch (action) {
      case 'frequency_analysis':
        message = '¿Cuáles son los animales más frecuentes esta semana?';
        break;
      case 'recommendations':
        message = '¿Qué animales me recomiendas para apostar?';
        break;
      case 'predictions':
        message = 'Hazme una predicción para el próximo sorteo';
        break;
      case 'patterns_today':
        message = 'Analiza los patrones de hoy';
        break;
      case 'recent_results':
        message = '¿Qué animales han salido en los últimos sorteos?';
        break;
      default:
        return res.status(400).json({
          error: 'Acción no válida'
        });
    }
    
    // Procesar como mensaje normal
    const response = await processUserMessage(message, userId);
    
    response.id = uuidv4();
    response.timestamp = new Date().toISOString();
    response.user_message = message;
    response.is_quick_action = true;
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Error procesando acción rápida:', error);
    res.status(500).json({
      error: 'Error procesando acción rápida'
    });
  }
});

// GET /api/chat/status - Estado del sistema de chat
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'online',
        version: '1.0.0',
        features: {
          nlp: true,
          predictions: true,
          patterns: true,
          charts: true,
          openai: !!process.env.OPENAI_API_KEY
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo status:', error);
    res.status(500).json({
      error: 'Error obteniendo status'
    });
  }
});

module.exports = router;