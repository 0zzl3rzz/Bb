const moment = require('moment');
const { models } = require('../models');
const { analyzePatterns } = require('./patternAnalyzer');
const _ = require('lodash');

async function generatePredictions() {
  try {
    const predictions = {
      next_draw: [],
      recommendations: [],
      trend: '',
      model_confidence: 0,
      analysis_timestamp: new Date().toISOString()
    };

    // Obtener datos base para análisis
    const recentStats = await models.Results.getAnimalStats('recent_days');
    const weeklyStats = await models.Results.getAnimalStats('this_week');
    const patterns = await analyzePatterns('recent_days');
    const sequentialPatterns = await models.Results.getSequentialPatterns();

    // Algoritmo 1: Análisis de frecuencia inversa (animales con baja frecuencia reciente)
    const inverseFrequencyPreds = calculateInverseFrequencyPredictions(recentStats, weeklyStats);
    
    // Algoritmo 2: Análisis de ciclos temporales
    const cyclicalPreds = calculateCyclicalPredictions(patterns.cycles);
    
    // Algoritmo 3: Análisis de secuencias
    const sequentialPreds = calculateSequentialPredictions(sequentialPatterns);
    
    // Algoritmo 4: Análisis de días de la semana y horas
    const temporalPreds = await calculateTemporalPredictions();
    
    // Algoritmo 5: Análisis de tendencias matemáticas
    const trendPreds = await calculateTrendPredictions();

    // Combinar todas las predicciones con pesos
    const combinedPredictions = combineAlgorithmResults([
      { results: inverseFrequencyPreds, weight: 0.25 },
      { results: cyclicalPreds, weight: 0.20 },
      { results: sequentialPreds, weight: 0.15 },
      { results: temporalPreds, weight: 0.25 },
      { results: trendPreds, weight: 0.15 }
    ]);

    // Calcular predicciones finales
    predictions.next_draw = combinedPredictions.slice(0, 10);
    predictions.recommendations = generateRecommendations(combinedPredictions.slice(0, 5), patterns);
    predictions.trend = calculateOverallTrend(recentStats, weeklyStats);
    predictions.model_confidence = calculateModelConfidence(combinedPredictions);

    return predictions;
  } catch (error) {
    console.error('Error generando predicciones:', error);
    return {
      next_draw: [],
      recommendations: [],
      trend: 'No disponible',
      model_confidence: 0,
      error: 'Error generando predicciones'
    };
  }
}

function calculateInverseFrequencyPredictions(recentStats, weeklyStats) {
  const predictions = [];
  const { animals } = require('../../ai-training/guacharo-knowledge.json');
  
  // Crear mapa de frecuencias recientes
  const recentMap = {};
  recentStats.forEach(stat => {
    recentMap[stat.animal_name] = parseInt(stat.count);
  });

  // Calcular predicciones basadas en ausencia (animales que no han salido recientemente)
  animals.forEach(animal => {
    const recentCount = recentMap[animal.name] || 0;
    const expectedFrequency = 7 / 36; // Frecuencia esperada en una semana (7 días, 36 animales)
    
    // Mayor peso a animales con baja frecuencia reciente
    const absenceScore = Math.max(0, expectedFrequency - recentCount);
    const probability = Math.min(15, absenceScore * 10); // Máximo 15%
    
    if (probability > 1) {
      predictions.push({
        animal: animal.name,
        probability: Math.round(probability * 100) / 100,
        algorithm: 'inverse_frequency',
        confidence: 70,
        reason: `Baja frecuencia reciente: ${recentCount} apariciones`
      });
    }
  });

  return predictions.sort((a, b) => b.probability - a.probability);
}

function calculateCyclicalPredictions(cycles) {
  const predictions = [];
  const today = moment();

  cycles.forEach(cycle => {
    if (cycle.next_expected) {
      const expectedDate = moment(cycle.next_expected);
      const daysUntil = expectedDate.diff(today, 'days');
      
      // Si la fecha esperada es hoy o mañana, aumentar probabilidad
      if (daysUntil >= 0 && daysUntil <= 2) {
        const probability = Math.max(5, cycle.confidence / 10);
        predictions.push({
          animal: cycle.animal,
          probability: probability,
          algorithm: 'cyclical',
          confidence: cycle.confidence,
          reason: `Ciclo ${cycle.type} sugiere aparición en ${daysUntil} días`
        });
      }
    }
  });

  return predictions.sort((a, b) => b.probability - a.probability);
}

function calculateSequentialPredictions(sequentialPatterns) {
  const predictions = [];
  
  // Obtener los últimos 2 resultados para predecir el siguiente en la secuencia
  models.Results.getRecentResults(2).then(recentResults => {
    if (recentResults.length >= 2) {
      const last = recentResults[0].animal_name;
      const secondLast = recentResults[1].animal_name;
      
      // Buscar patrones que coincidan con los últimos 2 resultados
      const matchingPatterns = sequentialPatterns.filter(pattern => 
        pattern.prev_2 === secondLast && pattern.prev_1 === last
      );
      
      matchingPatterns.forEach(pattern => {
        const probability = Math.min(12, pattern.frequency * 2);
        predictions.push({
          animal: pattern.current,
          probability: probability,
          algorithm: 'sequential',
          confidence: Math.min(80, pattern.frequency * 15),
          reason: `Secuencia detectada: ${pattern.prev_2} → ${pattern.prev_1} → ${pattern.current}`
        });
      });
    }
  }).catch(error => {
    console.error('Error en predicciones secuenciales:', error);
  });

  return predictions.sort((a, b) => b.probability - a.probability);
}

async function calculateTemporalPredictions() {
  const predictions = [];
  const currentHour = moment().hour();
  const currentDay = moment().day(); // 0 = domingo, 1 = lunes, etc.
  
  try {
    // Obtener frecuencias por hora y día
    const hourlyFreq = await models.Results.getFrequencyByHour('this_week');
    const dailyFreq = await models.Results.getFrequencyByDay('this_week');
    
    // Filtrar por hora actual
    const currentHourData = hourlyFreq.filter(item => item.hour === currentHour);
    const currentDayData = dailyFreq.filter(item => item.day_of_week === currentDay);
    
    // Combinar datos temporales
    const temporalAnimals = {};
    
    currentHourData.forEach(item => {
      if (!temporalAnimals[item.animal_name]) {
        temporalAnimals[item.animal_name] = { hourCount: 0, dayCount: 0 };
      }
      temporalAnimals[item.animal_name].hourCount = parseInt(item.count);
    });
    
    currentDayData.forEach(item => {
      if (!temporalAnimals[item.animal_name]) {
        temporalAnimals[item.animal_name] = { hourCount: 0, dayCount: 0 };
      }
      temporalAnimals[item.animal_name].dayCount = parseInt(item.count);
    });
    
    // Calcular probabilidades basadas en patrones temporales
    Object.keys(temporalAnimals).forEach(animal => {
      const data = temporalAnimals[animal];
      const totalScore = data.hourCount * 0.6 + data.dayCount * 0.4;
      const probability = Math.min(10, totalScore);
      
      if (probability > 2) {
        predictions.push({
          animal: animal,
          probability: probability,
          algorithm: 'temporal',
          confidence: 65,
          reason: `Patrón horario/diario favorable: ${currentHour}:00 hrs, día ${currentDay}`
        });
      }
    });
  } catch (error) {
    console.error('Error en predicciones temporales:', error);
  }

  return predictions.sort((a, b) => b.probability - a.probability);
}

async function calculateTrendPredictions() {
  const predictions = [];
  
  try {
    // Análisis de tendencias de los últimos 7 días
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const dayResults = await models.Results.findAll({
        where: {
          draw_date: date
        },
        attributes: ['animal_name']
      });
      
      last7Days.push({
        date,
        animals: dayResults.map(r => r.animal_name)
      });
    }
    
    // Calcular tendencias matemáticas (regresión lineal simple)
    const animalTrends = {};
    const { animals } = require('../../ai-training/guacharo-knowledge.json');
    
    animals.forEach(animal => {
      const frequencies = last7Days.map(day => 
        day.animals.filter(a => a === animal.name).length
      );
      
      const trend = calculateLinearTrend(frequencies);
      
      if (trend > 0.1) { // Tendencia positiva
        const probability = Math.min(8, trend * 10);
        predictions.push({
          animal: animal.name,
          probability: probability,
          algorithm: 'trend',
          confidence: 60,
          reason: `Tendencia matemática positiva: +${(trend * 100).toFixed(1)}%`
        });
      }
    });
  } catch (error) {
    console.error('Error en predicciones de tendencia:', error);
  }

  return predictions.sort((a, b) => b.probability - a.probability);
}

function calculateLinearTrend(values) {
  const n = values.length;
  const xSum = n * (n - 1) / 2; // 0 + 1 + 2 + ... + (n-1)
  const ySum = values.reduce((sum, val) => sum + val, 0);
  const xySum = values.reduce((sum, val, index) => sum + (val * index), 0);
  const x2Sum = (n - 1) * n * (2 * n - 1) / 6; // 0² + 1² + 2² + ... + (n-1)²
  
  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
  return slope;
}

function combineAlgorithmResults(algorithmResults) {
  const combined = {};
  
  algorithmResults.forEach(({ results, weight }) => {
    results.forEach(prediction => {
      if (!combined[prediction.animal]) {
        combined[prediction.animal] = {
          animal: prediction.animal,
          probability: 0,
          confidence: 0,
          reasons: [],
          algorithms: []
        };
      }
      
      combined[prediction.animal].probability += prediction.probability * weight;
      combined[prediction.animal].confidence += prediction.confidence * weight;
      combined[prediction.animal].reasons.push(prediction.reason);
      combined[prediction.animal].algorithms.push(prediction.algorithm);
    });
  });
  
  // Convertir a array y ordenar
  const finalPredictions = Object.values(combined)
    .map(pred => ({
      ...pred,
      probability: Math.round(pred.probability * 100) / 100,
      confidence: Math.round(pred.confidence)
    }))
    .sort((a, b) => b.probability - a.probability);
  
  return finalPredictions;
}

function generateRecommendations(topPredictions, patterns) {
  const recommendations = [];
  
  topPredictions.forEach((pred, index) => {
    let recommendation = {
      animal: pred.animal,
      confidence: pred.confidence,
      reason: pred.reasons[0] || 'Análisis combinado de múltiples algoritmos',
      priority: index + 1
    };
    
    // Agregar contexto adicional basado en patrones
    if (patterns.cycles.find(c => c.animal === pred.animal)) {
      recommendation.reason += ' + Ciclo temporal detectado';
    }
    
    recommendations.push(recommendation);
  });
  
  return recommendations;
}

function calculateOverallTrend(recentStats, weeklyStats) {
  if (recentStats.length === 0 || weeklyStats.length === 0) {
    return 'Datos insuficientes';
  }
  
  // Comparar distribución de frecuencias
  const recentTop = recentStats.slice(0, 5);
  const weeklyTop = weeklyStats.slice(0, 5);
  
  const recentTopAnimals = recentTop.map(s => s.animal_name);
  const weeklyTopAnimals = weeklyTop.map(s => s.animal_name);
  
  const overlap = recentTopAnimals.filter(animal => weeklyTopAnimals.includes(animal)).length;
  
  if (overlap >= 4) {
    return 'Tendencia estable - Animales consistentes en el top';
  } else if (overlap <= 2) {
    return 'Tendencia volátil - Cambios frecuentes en animales dominantes';
  } else {
    return 'Tendencia moderada - Algunos cambios en frecuencias';
  }
}

function calculateModelConfidence(predictions) {
  if (predictions.length === 0) return 0;
  
  // Confianza basada en:
  // 1. Número de algoritmos que coinciden
  // 2. Consistencia en las predicciones
  // 3. Calidad de los datos
  
  const topPrediction = predictions[0];
  const algorithmCount = topPrediction.algorithms ? topPrediction.algorithms.length : 1;
  const probabilitySpread = predictions.length > 1 ? 
    predictions[0].probability - predictions[predictions.length - 1].probability : 10;
  
  let confidence = 40; // Base
  confidence += algorithmCount * 10; // +10 por cada algoritmo que coincide
  confidence += Math.min(20, probabilitySpread * 2); // +puntos por dispersión
  
  return Math.min(85, Math.max(30, Math.round(confidence)));
}

module.exports = {
  generatePredictions,
  calculateInverseFrequencyPredictions,
  calculateCyclicalPredictions,
  calculateSequentialPredictions,
  calculateTemporalPredictions,
  calculateTrendPredictions
};