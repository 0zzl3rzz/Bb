const cron = require('node-cron');
const moment = require('moment');
const { models } = require('../models');

// Configurar trabajos programados
function setupCronJobs() {
  console.log('🕐 Configurando trabajos programados...');

  // Trabajo cada hora para limpiar datos antiguos (solo en producción)
  if (process.env.NODE_ENV === 'production') {
    cron.schedule('0 * * * *', async () => {
      console.log('🧹 Ejecutando limpieza de datos antiguos...');
      await cleanOldData();
    });
  }

  // Trabajo diario para generar estadísticas
  cron.schedule('0 6 * * *', async () => {
    console.log('📊 Generando estadísticas diarias...');
    await generateDailyStats();
  });

  // Trabajo cada 15 minutos para actualizar patrones en tiempo real
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 Actualizando patrones en tiempo real...');
    await updateRealtimePatterns();
  });

  console.log('✅ Trabajos programados configurados');
}

// Limpiar datos antiguos (más de 90 días)
async function cleanOldData() {
  try {
    const cutoffDate = moment().subtract(90, 'days').toDate();
    
    const deletedCount = await models.Results.destroy({
      where: {
        created_at: {
          [models.sequelize.Sequelize.Op.lt]: cutoffDate
        }
      }
    });

    if (deletedCount > 0) {
      console.log(`🗑️  Eliminados ${deletedCount} registros antiguos`);
    }
  } catch (error) {
    console.error('Error limpiando datos antiguos:', error);
  }
}

// Generar estadísticas diarias
async function generateDailyStats() {
  try {
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    
    // Obtener resultados de ayer
    const yesterdayResults = await models.Results.findAll({
      where: {
        draw_date: yesterday
      }
    });

    console.log(`📈 Procesados ${yesterdayResults.length} resultados de ${yesterday}`);
    
    // Aquí podrías agregar lógica para:
    // - Calcular métricas de rendimiento del modelo
    // - Actualizar patrones detectados
    // - Generar reportes automáticos
    
  } catch (error) {
    console.error('Error generando estadísticas diarias:', error);
  }
}

// Actualizar patrones en tiempo real
async function updateRealtimePatterns() {
  try {
    // Obtener datos recientes para análisis
    const recentResults = await models.Results.getRecentResults(100);
    
    if (recentResults.length > 0) {
      // Aquí podrías ejecutar análisis de patrones ligeros
      // y actualizar caché si es necesario
      console.log(`🔍 Analizados ${recentResults.length} resultados recientes`);
    }
  } catch (error) {
    console.error('Error actualizando patrones:', error);
  }
}

// Función para ejecutar trabajos bajo demanda
async function runMaintenanceTasks() {
  console.log('🔧 Ejecutando tareas de mantenimiento...');
  
  await Promise.all([
    cleanOldData(),
    generateDailyStats(),
    updateRealtimePatterns()
  ]);
  
  console.log('✅ Tareas de mantenimiento completadas');
}

module.exports = {
  setupCronJobs,
  runMaintenanceTasks,
  cleanOldData,
  generateDailyStats,
  updateRealtimePatterns
};