const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { analyzePatterns } = require('../ai/patternAnalyzer');

// GET /api/analysis/frequency/:timeframe - Análisis de frecuencias
router.get('/frequency/:timeframe?', async (req, res) => {
  try {
    const timeframe = req.params.timeframe || 'this_week';
    const stats = await models.Results.getAnimalStats(timeframe);
    
    res.json({
      success: true,
      data: {
        timeframe,
        statistics: stats,
        total_draws: stats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
        analysis_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en análisis de frecuencias:', error);
    res.status(500).json({
      error: 'Error obteniendo análisis de frecuencias'
    });
  }
});

// GET /api/analysis/patterns/:timeframe?/:animal? - Análisis de patrones
router.get('/patterns/:timeframe?/:animal?', async (req, res) => {
  try {
    const timeframe = req.params.timeframe || 'this_week';
    const animal = req.params.animal || null;
    
    const patterns = await analyzePatterns(timeframe, animal);
    
    res.json({
      success: true,
      data: {
        timeframe,
        animal,
        patterns: patterns.detected,
        insights: patterns.insights,
        charts: patterns.charts,
        cycles: patterns.cycles,
        analysis_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en análisis de patrones:', error);
    res.status(500).json({
      error: 'Error obteniendo análisis de patrones'
    });
  }
});

// GET /api/analysis/hourly/:timeframe? - Análisis por horas
router.get('/hourly/:timeframe?', async (req, res) => {
  try {
    const timeframe = req.params.timeframe || 'this_week';
    const hourlyData = await models.Results.getFrequencyByHour(timeframe);
    
    // Agrupar datos por hora
    const groupedData = {};
    hourlyData.forEach(item => {
      const hour = item.hour;
      if (!groupedData[hour]) {
        groupedData[hour] = {
          hour,
          animals: [],
          total: 0
        };
      }
      groupedData[hour].animals.push({
        name: item.animal_name,
        count: parseInt(item.count)
      });
      groupedData[hour].total += parseInt(item.count);
    });
    
    const hourlyStats = Object.values(groupedData).sort((a, b) => a.hour - b.hour);
    
    res.json({
      success: true,
      data: {
        timeframe,
        hourly_statistics: hourlyStats,
        analysis_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en análisis horario:', error);
    res.status(500).json({
      error: 'Error obteniendo análisis horario'
    });
  }
});

// GET /api/analysis/daily/:timeframe? - Análisis por días de la semana
router.get('/daily/:timeframe?', async (req, res) => {
  try {
    const timeframe = req.params.timeframe || 'this_week';
    const dailyData = await models.Results.getFrequencyByDay(timeframe);
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Agrupar datos por día
    const groupedData = {};
    dailyData.forEach(item => {
      const day = item.day_of_week;
      if (!groupedData[day]) {
        groupedData[day] = {
          day_number: day,
          day_name: dayNames[day],
          animals: [],
          total: 0
        };
      }
      groupedData[day].animals.push({
        name: item.animal_name,
        count: parseInt(item.count)
      });
      groupedData[day].total += parseInt(item.count);
    });
    
    const dailyStats = Object.values(groupedData).sort((a, b) => a.day_number - b.day_number);
    
    res.json({
      success: true,
      data: {
        timeframe,
        daily_statistics: dailyStats,
        analysis_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en análisis diario:', error);
    res.status(500).json({
      error: 'Error obteniendo análisis diario'
    });
  }
});

// GET /api/analysis/animal/:animal/:timeframe? - Análisis específico de un animal
router.get('/animal/:animal/:timeframe?', async (req, res) => {
  try {
    const animal = req.params.animal;
    const timeframe = req.params.timeframe || 'this_week';
    
    // Obtener estadísticas del animal
    const allStats = await models.Results.getAnimalStats(timeframe);
    const animalStat = allStats.find(stat => stat.animal_name.toLowerCase() === animal.toLowerCase());
    
    // Obtener última aparición
    const lastAppearance = await models.Results.getLastAppearance(animal);
    
    // Obtener datos de patrones específicos
    const patternData = await models.Results.getPatternData(animal, timeframe);
    
    if (!animalStat) {
      return res.status(404).json({
        error: 'Animal no encontrado o sin datos en el período especificado'
      });
    }
    
    res.json({
      success: true,
      data: {
        animal,
        timeframe,
        statistics: animalStat,
        last_appearance: lastAppearance,
        pattern_data: patternData,
        analysis_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en análisis de animal:', error);
    res.status(500).json({
      error: 'Error obteniendo análisis del animal'
    });
  }
});

// GET /api/analysis/sequences - Análisis de secuencias
router.get('/sequences', async (req, res) => {
  try {
    const { length = 3 } = req.query;
    const sequences = await models.Results.getSequentialPatterns(parseInt(length));
    
    res.json({
      success: true,
      data: {
        sequence_length: parseInt(length),
        patterns: sequences,
        total_patterns: sequences.length,
        analysis_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en análisis de secuencias:', error);
    res.status(500).json({
      error: 'Error obteniendo análisis de secuencias'
    });
  }
});

// GET /api/analysis/compare/:animal1/:animal2/:timeframe? - Comparar dos animales
router.get('/compare/:animal1/:animal2/:timeframe?', async (req, res) => {
  try {
    const { animal1, animal2 } = req.params;
    const timeframe = req.params.timeframe || 'this_week';
    
    const allStats = await models.Results.getAnimalStats(timeframe);
    
    const animal1Stats = allStats.find(stat => stat.animal_name.toLowerCase() === animal1.toLowerCase());
    const animal2Stats = allStats.find(stat => stat.animal_name.toLowerCase() === animal2.toLowerCase());
    
    if (!animal1Stats || !animal2Stats) {
      return res.status(404).json({
        error: 'Uno o ambos animales no encontrados en el período especificado'
      });
    }
    
    // Calcular comparación
    const comparison = {
      frequency_difference: parseInt(animal1Stats.count) - parseInt(animal2Stats.count),
      percentage_difference: parseFloat(animal1Stats.percentage) - parseFloat(animal2Stats.percentage),
      leader: parseInt(animal1Stats.count) > parseInt(animal2Stats.count) ? animal1 : animal2
    };
    
    res.json({
      success: true,
      data: {
        timeframe,
        animal1: {
          name: animal1,
          statistics: animal1Stats
        },
        animal2: {
          name: animal2,
          statistics: animal2Stats
        },
        comparison,
        analysis_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en comparación de animales:', error);
    res.status(500).json({
      error: 'Error comparando animales'
    });
  }
});

// GET /api/analysis/summary/:timeframe? - Resumen general de análisis
router.get('/summary/:timeframe?', async (req, res) => {
  try {
    const timeframe = req.params.timeframe || 'this_week';
    
    const [stats, patterns, hourlyData, dailyData] = await Promise.all([
      models.Results.getAnimalStats(timeframe),
      analyzePatterns(timeframe),
      models.Results.getFrequencyByHour(timeframe),
      models.Results.getFrequencyByDay(timeframe)
    ]);
    
    const summary = {
      timeframe,
      total_draws: stats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      most_frequent: stats[0],
      least_frequent: stats[stats.length - 1],
      patterns_detected: patterns.detected.length,
      cycles_found: patterns.cycles.length,
      peak_hour: findPeakHour(hourlyData),
      peak_day: findPeakDay(dailyData),
      analysis_timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error en resumen de análisis:', error);
    res.status(500).json({
      error: 'Error obteniendo resumen de análisis'
    });
  }
});

// Funciones auxiliares
function findPeakHour(hourlyData) {
  const hourTotals = {};
  hourlyData.forEach(item => {
    const hour = item.hour;
    hourTotals[hour] = (hourTotals[hour] || 0) + parseInt(item.count);
  });
  
  const peakHour = Object.keys(hourTotals).reduce((a, b) => 
    hourTotals[a] > hourTotals[b] ? a : b
  );
  
  return {
    hour: parseInt(peakHour),
    total: hourTotals[peakHour]
  };
}

function findPeakDay(dailyData) {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayTotals = {};
  
  dailyData.forEach(item => {
    const day = item.day_of_week;
    dayTotals[day] = (dayTotals[day] || 0) + parseInt(item.count);
  });
  
  const peakDay = Object.keys(dayTotals).reduce((a, b) => 
    dayTotals[a] > dayTotals[b] ? a : b
  );
  
  return {
    day_number: parseInt(peakDay),
    day_name: dayNames[parseInt(peakDay)],
    total: dayTotals[peakDay]
  };
}

module.exports = router;