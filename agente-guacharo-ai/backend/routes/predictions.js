const express = require('express');
const router = express.Router();
const { generatePredictions } = require('../ai/predictionEngine');

// GET /api/predictions - Obtener predicciones para el próximo sorteo
router.get('/', async (req, res) => {
  try {
    const predictions = await generatePredictions();
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error generando predicciones:', error);
    res.status(500).json({
      error: 'Error generando predicciones'
    });
  }
});

// GET /api/predictions/detailed - Predicciones detalladas con todos los algoritmos
router.get('/detailed', async (req, res) => {
  try {
    const predictions = await generatePredictions();
    
    // Aquí podrías agregar más detalles sobre cada algoritmo
    const detailedPredictions = {
      ...predictions,
      algorithm_breakdown: {
        inverse_frequency: predictions.next_draw.filter(p => p.algorithms?.includes('inverse_frequency')),
        cyclical: predictions.next_draw.filter(p => p.algorithms?.includes('cyclical')),
        sequential: predictions.next_draw.filter(p => p.algorithms?.includes('sequential')),
        temporal: predictions.next_draw.filter(p => p.algorithms?.includes('temporal')),
        trend: predictions.next_draw.filter(p => p.algorithms?.includes('trend'))
      }
    };
    
    res.json({
      success: true,
      data: detailedPredictions
    });
  } catch (error) {
    console.error('Error generando predicciones detalladas:', error);
    res.status(500).json({
      error: 'Error generando predicciones detalladas'
    });
  }
});

// GET /api/predictions/top/:count? - Top N predicciones
router.get('/top/:count?', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 5;
    const predictions = await generatePredictions();
    
    const topPredictions = predictions.next_draw.slice(0, count);
    
    res.json({
      success: true,
      data: {
        count,
        predictions: topPredictions,
        trend: predictions.trend,
        model_confidence: predictions.model_confidence,
        analysis_timestamp: predictions.analysis_timestamp
      }
    });
  } catch (error) {
    console.error('Error obteniendo top predicciones:', error);
    res.status(500).json({
      error: 'Error obteniendo top predicciones'
    });
  }
});

// GET /api/predictions/animal/:animal - Probabilidad específica de un animal
router.get('/animal/:animal', async (req, res) => {
  try {
    const animal = req.params.animal;
    const predictions = await generatePredictions();
    
    const animalPrediction = predictions.next_draw.find(
      p => p.animal.toLowerCase() === animal.toLowerCase()
    );
    
    if (!animalPrediction) {
      return res.json({
        success: true,
        data: {
          animal,
          probability: 0,
          confidence: 0,
          reason: 'No se encontraron patrones significativos para este animal',
          ranking: null
        }
      });
    }
    
    const ranking = predictions.next_draw.findIndex(
      p => p.animal.toLowerCase() === animal.toLowerCase()
    ) + 1;
    
    res.json({
      success: true,
      data: {
        animal,
        probability: animalPrediction.probability,
        confidence: animalPrediction.confidence,
        reasons: animalPrediction.reasons,
        algorithms: animalPrediction.algorithms,
        ranking,
        total_predictions: predictions.next_draw.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo predicción de animal:', error);
    res.status(500).json({
      error: 'Error obteniendo predicción de animal'
    });
  }
});

// POST /api/predictions/validate - Validar predicciones contra resultados reales
router.post('/validate', async (req, res) => {
  try {
    const { actual_result, prediction_id } = req.body;
    
    if (!actual_result) {
      return res.status(400).json({
        error: 'Se requiere el resultado real'
      });
    }
    
    // Obtener predicciones actuales
    const predictions = await generatePredictions();
    
    // Verificar si el resultado real estaba en las predicciones
    const predictionIndex = predictions.next_draw.findIndex(
      p => p.animal.toLowerCase() === actual_result.toLowerCase()
    );
    
    const validation = {
      actual_result,
      was_predicted: predictionIndex !== -1,
      prediction_rank: predictionIndex !== -1 ? predictionIndex + 1 : null,
      predicted_probability: predictionIndex !== -1 ? predictions.next_draw[predictionIndex].probability : 0,
      model_accuracy: calculateAccuracy(predictions, actual_result),
      validation_timestamp: new Date().toISOString()
    };
    
    // Aquí podrías guardar la validación en la base de datos
    // para mejorar el modelo con el tiempo
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validando predicciones:', error);
    res.status(500).json({
      error: 'Error validando predicciones'
    });
  }
});

// GET /api/predictions/performance - Estadísticas de rendimiento del modelo
router.get('/performance', async (req, res) => {
  try {
    // Aquí podrías implementar métricas de rendimiento basadas en
    // validaciones históricas guardadas en la base de datos
    
    const performance = {
      total_predictions: 0,
      correct_predictions: 0,
      accuracy_percentage: 0,
      top_3_accuracy: 0,
      top_5_accuracy: 0,
      average_confidence: 0,
      best_algorithm: 'inverse_frequency',
      last_updated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error obteniendo rendimiento:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas de rendimiento'
    });
  }
});

// GET /api/predictions/confidence-levels - Niveles de confianza por categorías
router.get('/confidence-levels', async (req, res) => {
  try {
    const predictions = await generatePredictions();
    
    const confidenceLevels = {
      high_confidence: predictions.next_draw.filter(p => p.confidence >= 75),
      medium_confidence: predictions.next_draw.filter(p => p.confidence >= 50 && p.confidence < 75),
      low_confidence: predictions.next_draw.filter(p => p.confidence < 50),
      average_confidence: predictions.next_draw.reduce((sum, p) => sum + p.confidence, 0) / predictions.next_draw.length
    };
    
    res.json({
      success: true,
      data: confidenceLevels
    });
  } catch (error) {
    console.error('Error obteniendo niveles de confianza:', error);
    res.status(500).json({
      error: 'Error obteniendo niveles de confianza'
    });
  }
});

// Función auxiliar para calcular precisión
function calculateAccuracy(predictions, actualResult) {
  // Implementación simple de cálculo de precisión
  // En una implementación real, esto sería basado en datos históricos
  
  const topPrediction = predictions.next_draw[0];
  if (topPrediction && topPrediction.animal.toLowerCase() === actualResult.toLowerCase()) {
    return {
      top_1_hit: true,
      accuracy_score: 100
    };
  }
  
  const top3Predictions = predictions.next_draw.slice(0, 3);
  const isInTop3 = top3Predictions.some(p => p.animal.toLowerCase() === actualResult.toLowerCase());
  
  const top5Predictions = predictions.next_draw.slice(0, 5);
  const isInTop5 = top5Predictions.some(p => p.animal.toLowerCase() === actualResult.toLowerCase());
  
  return {
    top_1_hit: false,
    top_3_hit: isInTop3,
    top_5_hit: isInTop5,
    accuracy_score: isInTop3 ? 60 : (isInTop5 ? 40 : 0)
  };
}

module.exports = router;