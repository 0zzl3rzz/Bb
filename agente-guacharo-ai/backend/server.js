const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const chatRoutes = require('./routes/chat');
const analysisRoutes = require('./routes/analysis');
const predictionsRoutes = require('./routes/predictions');
const resultsRoutes = require('./routes/results');

const { initializeDatabase } = require('./models');
const { setupCronJobs } = require('./utils/cronJobs');
const { initializeAI } = require('./ai/nlpProcessor');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana por IP
});
app.use('/api/', limiter);

// Middlewares generales
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas de API
app.use('/api/chat', chatRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/results', resultsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Manejo de Socket.IO para chat en tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('join-chat', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Usuario ${userId} se unió al chat`);
  });

  socket.on('chat-message', async (data) => {
    try {
      // Procesar mensaje con AI
      const { processUserMessage } = require('./ai/nlpProcessor');
      const response = await processUserMessage(data.message, data.userId);
      
      // Enviar respuesta de vuelta al usuario
      socket.to(`user-${data.userId}`).emit('ai-response', {
        id: require('uuid').v4(),
        message: response.text,
        charts: response.charts || [],
        recommendations: response.recommendations || [],
        timestamp: new Date().toISOString(),
        type: 'ai'
      });
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      socket.to(`user-${data.userId}`).emit('ai-response', {
        id: require('uuid').v4(),
        message: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date().toISOString(),
        type: 'error'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicialización del servidor
async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    console.log('✅ Base de datos inicializada');

    // Inicializar sistema de AI
    await initializeAI();
    console.log('✅ Sistema de AI inicializado');

    // Configurar trabajos programados
    setupCronJobs();
    console.log('✅ Trabajos programados configurados');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Servidor Guacharo AI iniciado en puerto ${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejar cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

startServer();