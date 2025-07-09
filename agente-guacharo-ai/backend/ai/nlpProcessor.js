const natural = require('natural');
const compromise = require('compromise');
const moment = require('moment');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');

const { analyzePatterns } = require('./patternAnalyzer');
const { generatePredictions } = require('./predictionEngine');
const { getRecentResults, getAnimalStats } = require('../models/Results');

let openai;
let guacharoKnowledge;

// Inicializar el sistema de AI
async function initializeAI() {
  try {
    // Configurar OpenAI si está disponible
    if (process.env.OPENAI_API_KEY) {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // Cargar base de conocimiento
    const knowledgePath = path.join(__dirname, '../../ai-training/guacharo-knowledge.json');
    const knowledgeData = await fs.readFile(knowledgePath, 'utf8');
    guacharoKnowledge = JSON.parse(knowledgeData);

    console.log('✅ Sistema de AI inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando AI:', error);
    throw error;
  }
}

// Procesar mensaje del usuario
async function processUserMessage(message, userId) {
  try {
    const userInput = normalizeMessage(message);
    const intent = await detectIntent(userInput);
    const entities = extractEntities(userInput);
    
    let response;
    
    switch (intent.type) {
      case 'frequency_analysis':
        response = await handleFrequencyAnalysis(entities, intent);
        break;
      case 'animal_recommendation':
        response = await handleAnimalRecommendation(entities, intent);
        break;
      case 'pattern_analysis':
        response = await handlePatternAnalysis(entities, intent);
        break;
      case 'prediction_request':
        response = await handlePredictionRequest(entities, intent);
        break;
      case 'animal_stats':
        response = await handleAnimalStats(entities, intent);
        break;
      case 'recent_results':
        response = await handleRecentResults(entities, intent);
        break;
      case 'general_question':
        response = await handleGeneralQuestion(userInput, entities);
        break;
      default:
        response = await handleDefaultResponse(userInput);
    }

    // Agregar contexto conversacional
    response.conversationContext = {
      userId,
      timestamp: new Date().toISOString(),
      intent: intent.type,
      entities: entities
    };

    return response;
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    return {
      text: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
      type: 'error'
    };
  }
}

// Normalizar mensaje del usuario
function normalizeMessage(message) {
  return message
    .toLowerCase()
    .trim()
    .replace(/[¿?¡!]/g, '')
    .replace(/\s+/g, ' ');
}

// Detectar intención del usuario
async function detectIntent(message) {
  const intents = {
    frequency_analysis: [
      'cuál animal ha salido más', 'más frecuente', 'mayor frecuencia', 
      'animales que más salen', 'estadísticas de frecuencia', 'ranking'
    ],
    animal_recommendation: [
      'qué animal me recomiendas', 'recomienda', 'sugerir', 'aconseja',
      'cuál jugar', 'mejor opción', 'qué apostar'
    ],
    pattern_analysis: [
      'analiza patrones', 'patrón', 'tendencia', 'ciclo', 'secuencia',
      'análisis de', 'comportamiento'
    ],
    prediction_request: [
      'predicción', 'predice', 'próximo sorteo', 'va a salir',
      'probabilidad', 'chances', 'posibilidades'
    ],
    animal_stats: [
      'estadísticas del', 'datos del', 'información del', 'historial del',
      'cuántas veces', 'última vez que salió'
    ],
    recent_results: [
      'resultados de', 'qué salió', 'sorteos de', 'últimos resultados',
      'hoy', 'ayer', 'esta semana'
    ]
  };

  let bestMatch = { type: 'general_question', confidence: 0 };

  for (const [intentType, keywords] of Object.entries(intents)) {
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        const confidence = calculateConfidence(message, keyword);
        if (confidence > bestMatch.confidence) {
          bestMatch = { type: intentType, confidence, keyword };
        }
      }
    }
  }

  return bestMatch;
}

// Extraer entidades del mensaje
function extractEntities(message) {
  const entities = {
    animals: [],
    timeframe: null,
    numbers: [],
    days: []
  };

  // Extraer animales mencionados
  for (const animal of guacharoKnowledge.animals) {
    if (message.includes(animal.name.toLowerCase())) {
      entities.animals.push(animal);
    }
  }

  // Extraer marco temporal
  const timeframes = {
    'hoy': 'today',
    'ayer': 'yesterday',
    'esta semana': 'this_week',
    'semana pasada': 'last_week',
    'este mes': 'this_month',
    'últimos días': 'recent_days'
  };

  for (const [phrase, timeframe] of Object.entries(timeframes)) {
    if (message.includes(phrase)) {
      entities.timeframe = timeframe;
      break;
    }
  }

  // Extraer números
  const numberMatches = message.match(/\d+/g);
  if (numberMatches) {
    entities.numbers = numberMatches.map(num => parseInt(num));
  }

  // Extraer días de la semana
  const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  for (const day of days) {
    if (message.includes(day)) {
      entities.days.push(day);
    }
  }

  return entities;
}

// Manejar análisis de frecuencia
async function handleFrequencyAnalysis(entities, intent) {
  try {
    const timeframe = entities.timeframe || 'this_week';
    const stats = await getAnimalStats(timeframe);
    
    const topAnimals = stats.slice(0, 5);
    
    let text = `📊 **Análisis de Frecuencias**\n\n`;
    text += `Los animales más frecuentes ${getTimeframeText(timeframe)} son:\n\n`;
    
    topAnimals.forEach((animal, index) => {
      const emoji = getAnimalEmoji(animal.name);
      text += `${index + 1}. ${emoji} **${animal.name}** - ${animal.count} veces (${animal.percentage}%)\n`;
    });

    text += `\n💡 **Observación**: ${generateFrequencyInsight(topAnimals)}`;

    const chartData = {
      type: 'bar',
      data: {
        labels: topAnimals.map(a => a.name),
        datasets: [{
          label: 'Frecuencia',
          data: topAnimals.map(a => a.count),
          backgroundColor: topAnimals.map(a => getAnimalColor(a.name))
        }]
      }
    };

    return {
      text,
      charts: [chartData],
      recommendations: generateFrequencyRecommendations(topAnimals),
      type: 'analysis'
    };
  } catch (error) {
    console.error('Error en análisis de frecuencia:', error);
    return {
      text: 'No pude realizar el análisis de frecuencias en este momento.',
      type: 'error'
    };
  }
}

// Manejar recomendación de animales
async function handleAnimalRecommendation(entities, intent) {
  try {
    const predictions = await generatePredictions();
    const patterns = await analyzePatterns(entities.timeframe || 'recent');
    
    const recommendations = predictions.recommendations.slice(0, 3);
    
    let text = `🎯 **Recomendaciones Personalizadas**\n\n`;
    text += `Basándome en el análisis de patrones y tendencias actuales:\n\n`;
    
    recommendations.forEach((rec, index) => {
      const emoji = getAnimalEmoji(rec.animal);
      text += `${index + 1}. ${emoji} **${rec.animal}**\n`;
      text += `   📈 Confianza: ${rec.confidence}%\n`;
      text += `   🔍 Razón: ${rec.reason}\n\n`;
    });

    text += `⚠️ **Recordatorio**: Los sorteos son aleatorios. Estas recomendaciones se basan en análisis estadístico.`;

    return {
      text,
      recommendations: recommendations,
      charts: patterns.charts || [],
      type: 'recommendation'
    };
  } catch (error) {
    console.error('Error en recomendación:', error);
    return {
      text: 'No pude generar recomendaciones en este momento.',
      type: 'error'
    };
  }
}

// Manejar análisis de patrones
async function handlePatternAnalysis(entities, intent) {
  try {
    const animal = entities.animals.length > 0 ? entities.animals[0].name : null;
    const timeframe = entities.timeframe || 'this_week';
    
    const patterns = await analyzePatterns(timeframe, animal);
    
    let text = `🔍 **Análisis de Patrones**\n\n`;
    
    if (animal) {
      text += `Analizando patrones para: **${animal}**\n\n`;
    } else {
      text += `Análisis general de patrones ${getTimeframeText(timeframe)}:\n\n`;
    }
    
    text += `📊 **Patrones Detectados**:\n`;
    patterns.detected.forEach(pattern => {
      text += `• ${pattern}\n`;
    });
    
    if (patterns.insights.length > 0) {
      text += `\n💡 **Insights**:\n`;
      patterns.insights.forEach(insight => {
        text += `• ${insight}\n`;
      });
    }

    return {
      text,
      charts: patterns.charts || [],
      type: 'pattern_analysis'
    };
  } catch (error) {
    console.error('Error en análisis de patrones:', error);
    return {
      text: 'No pude realizar el análisis de patrones en este momento.',
      type: 'error'
    };
  }
}

// Manejar solicitud de predicción
async function handlePredictionRequest(entities, intent) {
  try {
    const predictions = await generatePredictions();
    
    let text = `🔮 **Predicciones para el Próximo Sorteo**\n\n`;
    text += `Basándome en algoritmos de análisis predictivo:\n\n`;
    
    const topPredictions = predictions.next_draw.slice(0, 5);
    
    topPredictions.forEach((pred, index) => {
      const emoji = getAnimalEmoji(pred.animal);
      text += `${index + 1}. ${emoji} **${pred.animal}** - ${pred.probability}%\n`;
    });
    
    text += `\n📈 **Tendencia Actual**: ${predictions.trend}\n`;
    text += `🎲 **Confianza del Modelo**: ${predictions.model_confidence}%\n\n`;
    text += `⚠️ **Importante**: Las predicciones son estimaciones estadísticas, no garantías.`;

    const chartData = {
      type: 'doughnut',
      data: {
        labels: topPredictions.map(p => p.animal),
        datasets: [{
          data: topPredictions.map(p => p.probability),
          backgroundColor: topPredictions.map(p => getAnimalColor(p.animal))
        }]
      }
    };

    return {
      text,
      charts: [chartData],
      predictions: topPredictions,
      type: 'prediction'
    };
  } catch (error) {
    console.error('Error en predicción:', error);
    return {
      text: 'No pude generar predicciones en este momento.',
      type: 'error'
    };
  }
}

// Manejar pregunta general con OpenAI
async function handleGeneralQuestion(message, entities) {
  if (!openai) {
    return handleDefaultResponse(message);
  }

  try {
    const context = buildContextForAI(entities);
    
    const prompt = `
    Eres un experto en análisis de la lotería Guacharo Activo de Venezuela. 
    Tienes conocimiento profundo sobre los 36 animales y sus patrones.
    
    Contexto: ${context}
    
    Pregunta del usuario: ${message}
    
    Responde de manera conversacional, amigable y informativa. 
    Incluye datos específicos cuando sea posible y mantén un tono profesional pero cercano.
    `;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    });

    return {
      text: completion.choices[0].message.content,
      type: 'ai_response'
    };
  } catch (error) {
    console.error('Error con OpenAI:', error);
    return handleDefaultResponse(message);
  }
}

// Respuesta por defecto
function handleDefaultResponse(message) {
  const responses = [
    "Puedo ayudarte con análisis de patrones del Guacharo Activo. ¿Qué te gustaría saber?",
    "Pregúntame sobre estadísticas, patrones o recomendaciones de animales.",
    "Estoy aquí para analizar datos del Guacharo Activo. ¿En qué puedo asistirte?",
    "Puedo hacer análisis de frecuencias, patrones y predicciones. ¿Qué necesitas?"
  ];
  
  return {
    text: responses[Math.floor(Math.random() * responses.length)],
    type: 'default'
  };
}

// Funciones auxiliares
function calculateConfidence(message, keyword) {
  const words = message.split(' ');
  const keywordWords = keyword.split(' ');
  let matches = 0;
  
  for (const kw of keywordWords) {
    if (words.includes(kw)) matches++;
  }
  
  return (matches / keywordWords.length) * 100;
}

function getTimeframeText(timeframe) {
  const texts = {
    'today': 'hoy',
    'yesterday': 'ayer', 
    'this_week': 'esta semana',
    'last_week': 'la semana pasada',
    'this_month': 'este mes',
    'recent_days': 'los últimos días'
  };
  return texts[timeframe] || 'en el período seleccionado';
}

function getAnimalEmoji(animalName) {
  const emojis = {
    'León': '🦁', 'Tigre': '🐅', 'Águila': '🦅', 'Perro': '🐕',
    'Gato': '🐱', 'Caballo': '🐎', 'Elefante': '🐘', 'Mono': '🐵',
    'Delfín': '🐬', 'Mariposa': '🦋', 'Pescado': '🐟', 'Rana': '🐸'
  };
  return emojis[animalName] || '🔸';
}

function getAnimalColor(animalName) {
  const colors = {
    'León': '#FFD700', 'Tigre': '#FF6B35', 'Águila': '#8B4513',
    'Perro': '#D2691E', 'Gato': '#000000', 'Caballo': '#8B4513',
    'Elefante': '#808080', 'Mono': '#A0522D', 'Delfín': '#1E90FF'
  };
  return colors[animalName] || '#6C757D';
}

function generateFrequencyInsight(topAnimals) {
  const leader = topAnimals[0];
  return `${leader.name} lidera con ${leader.count} apariciones, mostrando una tendencia ${leader.percentage > 15 ? 'muy alta' : 'moderada'}.`;
}

function generateFrequencyRecommendations(topAnimals) {
  return [
    `Considera ${topAnimals[0].name} por su alta frecuencia reciente`,
    `${topAnimals[topAnimals.length - 1].name} podría estar en ciclo de aparición`,
    'Analiza patrones de días de la semana para mejor precisión'
  ];
}

function buildContextForAI(entities) {
  let context = 'Información del Guacharo Activo: 36 animales, sorteos diarios cada 2 horas.';
  
  if (entities.animals.length > 0) {
    context += ` Animales mencionados: ${entities.animals.map(a => a.name).join(', ')}.`;
  }
  
  if (entities.timeframe) {
    context += ` Marco temporal: ${entities.timeframe}.`;
  }
  
  return context;
}

module.exports = {
  initializeAI,
  processUserMessage
};