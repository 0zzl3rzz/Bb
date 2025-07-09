const moment = require('moment');
const { models } = require('../models');

async function analyzePatterns(timeframe = 'this_week', animal = null) {
  try {
    const patternData = await models.Results.getPatternData(animal, timeframe);
    const frequencyByHour = await models.Results.getFrequencyByHour(timeframe);
    const frequencyByDay = await models.Results.getFrequencyByDay(timeframe);
    const sequentialPatterns = await models.Results.getSequentialPatterns();
    
    const analysis = {
      detected: [],
      insights: [],
      charts: [],
      trends: [],
      cycles: []
    };

    // Análisis de patrones horarios
    const hourlyPatterns = analyzeHourlyPatterns(frequencyByHour);
    analysis.detected.push(...hourlyPatterns.patterns);
    analysis.insights.push(...hourlyPatterns.insights);
    analysis.charts.push(hourlyPatterns.chart);

    // Análisis de patrones por día de la semana
    const dailyPatterns = analyzeDailyPatterns(frequencyByDay);
    analysis.detected.push(...dailyPatterns.patterns);
    analysis.insights.push(...dailyPatterns.insights);
    analysis.charts.push(dailyPatterns.chart);

    // Análisis de secuencias
    const sequenceAnalysis = analyzeSequentialPatterns(sequentialPatterns);
    analysis.detected.push(...sequenceAnalysis.patterns);
    analysis.insights.push(...sequenceAnalysis.insights);

    // Análisis de ciclos temporales
    const cyclicalAnalysis = analyzeCyclicalPatterns(patternData);
    analysis.cycles = cyclicalAnalysis.cycles;
    analysis.detected.push(...cyclicalAnalysis.patterns);

    // Si es análisis específico de un animal
    if (animal) {
      const animalSpecific = await analyzeAnimalSpecificPatterns(animal, timeframe);
      analysis.detected.push(...animalSpecific.patterns);
      analysis.insights.push(...animalSpecific.insights);
      if (animalSpecific.chart) {
        analysis.charts.push(animalSpecific.chart);
      }
    }

    return analysis;
  } catch (error) {
    console.error('Error en análisis de patrones:', error);
    return {
      detected: ['Error analizando patrones'],
      insights: [],
      charts: [],
      trends: [],
      cycles: []
    };
  }
}

function analyzeHourlyPatterns(hourlyData) {
  const patterns = [];
  const insights = [];
  
  // Agrupar por hora
  const byHour = {};
  hourlyData.forEach(item => {
    const hour = item.hour;
    if (!byHour[hour]) byHour[hour] = [];
    byHour[hour].push(item);
  });

  // Encontrar horas con mayor actividad
  const hourlyTotals = Object.keys(byHour).map(hour => ({
    hour: parseInt(hour),
    total: byHour[hour].reduce((sum, item) => sum + parseInt(item.count), 0),
    animals: byHour[hour].length
  })).sort((a, b) => b.total - a.total);

  if (hourlyTotals.length > 0) {
    const topHour = hourlyTotals[0];
    patterns.push(`Mayor actividad en las ${topHour.hour}:00 hrs con ${topHour.total} sorteos`);
    
    // Detectar tendencias horarias
    const morningActivity = hourlyTotals.filter(h => h.hour >= 6 && h.hour < 12).reduce((sum, h) => sum + h.total, 0);
    const afternoonActivity = hourlyTotals.filter(h => h.hour >= 12 && h.hour < 18).reduce((sum, h) => sum + h.total, 0);
    const eveningActivity = hourlyTotals.filter(h => h.hour >= 18 || h.hour < 6).reduce((sum, h) => sum + h.total, 0);
    
    const maxActivity = Math.max(morningActivity, afternoonActivity, eveningActivity);
    if (maxActivity === morningActivity) {
      insights.push('Tendencia matutina: Mayor frecuencia en horas de la mañana');
    } else if (maxActivity === afternoonActivity) {
      insights.push('Tendencia vespertina: Mayor frecuencia en horas de la tarde');
    } else {
      insights.push('Tendencia nocturna: Mayor frecuencia en horas de la noche');
    }
  }

  // Crear gráfico de barras por hora
  const chartData = {
    type: 'bar',
    title: 'Frecuencia por Hora del Día',
    data: {
      labels: hourlyTotals.map(h => `${h.hour}:00`),
      datasets: [{
        label: 'Sorteos',
        data: hourlyTotals.map(h => h.total),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    }
  };

  return { patterns, insights, chart: chartData };
}

function analyzeDailyPatterns(dailyData) {
  const patterns = [];
  const insights = [];
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Agrupar por día de la semana
  const byDay = {};
  dailyData.forEach(item => {
    const day = item.day_of_week;
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(item);
  });

  // Calcular totales por día
  const dailyTotals = Object.keys(byDay).map(day => ({
    day: parseInt(day),
    dayName: dayNames[parseInt(day)],
    total: byDay[day].reduce((sum, item) => sum + parseInt(item.count), 0),
    animals: byDay[day].length
  })).sort((a, b) => b.total - a.total);

  if (dailyTotals.length > 0) {
    const topDay = dailyTotals[0];
    patterns.push(`${topDay.dayName} es el día más activo con ${topDay.total} sorteos`);
    
    // Detectar patrones de fin de semana vs días laborables
    const weekdayActivity = dailyTotals.filter(d => d.day >= 1 && d.day <= 5).reduce((sum, d) => sum + d.total, 0);
    const weekendActivity = dailyTotals.filter(d => d.day === 0 || d.day === 6).reduce((sum, d) => sum + d.total, 0);
    
    if (weekendActivity > weekdayActivity) {
      insights.push('Patrón de fin de semana: Mayor actividad sábados y domingos');
    } else {
      insights.push('Patrón laboral: Mayor actividad en días de semana');
    }
  }

  // Crear gráfico circular por día
  const chartData = {
    type: 'doughnut',
    title: 'Distribución por Día de la Semana',
    data: {
      labels: dailyTotals.map(d => d.dayName),
      datasets: [{
        data: dailyTotals.map(d => d.total),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384'
        ]
      }]
    }
  };

  return { patterns, insights, chart: chartData };
}

function analyzeSequentialPatterns(sequentialData) {
  const patterns = [];
  const insights = [];
  
  if (sequentialData.length > 0) {
    // Top 3 secuencias más frecuentes
    const topSequences = sequentialData.slice(0, 3);
    
    topSequences.forEach((seq, index) => {
      patterns.push(`Secuencia ${index + 1}: ${seq.prev_2} → ${seq.prev_1} → ${seq.current} (${seq.frequency} veces)`);
    });
    
    // Análisis de repeticiones
    const repetitions = sequentialData.filter(seq => 
      seq.prev_2 === seq.prev_1 || seq.prev_1 === seq.current || seq.prev_2 === seq.current
    );
    
    if (repetitions.length > 0) {
      insights.push(`Se detectaron ${repetitions.length} patrones con repeticiones de animales`);
    }
    
    // Detectar animales que aparecen frecuentemente en secuencias
    const animalFrequency = {};
    sequentialData.forEach(seq => {
      [seq.prev_2, seq.prev_1, seq.current].forEach(animal => {
        if (animal) {
          animalFrequency[animal] = (animalFrequency[animal] || 0) + 1;
        }
      });
    });
    
    const topAnimal = Object.keys(animalFrequency).reduce((a, b) => 
      animalFrequency[a] > animalFrequency[b] ? a : b
    );
    
    insights.push(`${topAnimal} aparece más frecuentemente en secuencias detectadas`);
  }

  return { patterns, insights };
}

function analyzeCyclicalPatterns(patternData) {
  const cycles = [];
  const patterns = [];
  
  // Agrupar por animal para detectar ciclos
  const animalData = {};
  patternData.forEach(item => {
    if (!animalData[item.animal_name]) {
      animalData[item.animal_name] = [];
    }
    animalData[item.animal_name].push({
      date: moment(item.date),
      hour: item.hour,
      frequency: item.frequency
    });
  });

  // Detectar ciclos de 3, 7 y 14 días
  Object.keys(animalData).forEach(animal => {
    const data = animalData[animal].sort((a, b) => a.date - b.date);
    
    if (data.length >= 3) {
      // Ciclo de 3 días
      const threeDayCycle = detectCycle(data, 3);
      if (threeDayCycle.detected) {
        cycles.push({
          animal,
          type: '3-day',
          confidence: threeDayCycle.confidence,
          next_expected: threeDayCycle.nextExpected
        });
        patterns.push(`${animal}: Ciclo de 3 días detectado (${threeDayCycle.confidence}% confianza)`);
      }
      
      // Ciclo semanal
      if (data.length >= 7) {
        const weeklyCycle = detectCycle(data, 7);
        if (weeklyCycle.detected) {
          cycles.push({
            animal,
            type: 'weekly',
            confidence: weeklyCycle.confidence,
            next_expected: weeklyCycle.nextExpected
          });
          patterns.push(`${animal}: Ciclo semanal detectado (${weeklyCycle.confidence}% confianza)`);
        }
      }
    }
  });

  return { cycles, patterns };
}

function detectCycle(data, cycleDays) {
  let matches = 0;
  let total = 0;
  
  for (let i = cycleDays; i < data.length; i++) {
    const current = data[i].date;
    const previous = data[i - cycleDays].date;
    const dayDiff = current.diff(previous, 'days');
    
    total++;
    if (Math.abs(dayDiff - cycleDays) <= 1) { // Tolerancia de 1 día
      matches++;
    }
  }
  
  const confidence = total > 0 ? Math.round((matches / total) * 100) : 0;
  const detected = confidence >= 60; // 60% de confianza mínima
  
  let nextExpected = null;
  if (detected && data.length > 0) {
    const lastDate = data[data.length - 1].date;
    nextExpected = lastDate.clone().add(cycleDays, 'days').format('YYYY-MM-DD');
  }
  
  return { detected, confidence, nextExpected };
}

async function analyzeAnimalSpecificPatterns(animal, timeframe) {
  const patterns = [];
  const insights = [];
  
  try {
    // Obtener última aparición
    const lastAppearance = await models.Results.getLastAppearance(animal);
    if (lastAppearance) {
      const daysSince = moment().diff(moment(lastAppearance.created_at), 'days');
      patterns.push(`Última aparición: ${daysSince} días atrás`);
      
      if (daysSince > 7) {
        insights.push(`${animal} lleva ${daysSince} días sin aparecer, podría estar en ciclo de aparición`);
      } else if (daysSince < 2) {
        insights.push(`${animal} apareció recientemente, verificar si hay tendencia de repetición`);
      }
    }
    
    // Obtener estadísticas específicas del animal
    const animalStats = await models.Results.getAnimalStats(timeframe);
    const animalStat = animalStats.find(stat => stat.animal_name === animal);
    
    if (animalStat) {
      patterns.push(`Frecuencia ${timeframe}: ${animalStat.count} veces (${animalStat.percentage}%)`);
      
      if (animalStat.percentage > 5) {
        insights.push(`${animal} está mostrando alta frecuencia en el período analizado`);
      } else if (animalStat.percentage < 1) {
        insights.push(`${animal} está mostrando baja frecuencia, posible oportunidad`);
      }
    }
    
    // Crear gráfico de tendencia temporal
    const patternData = await models.Results.getPatternData(animal, timeframe);
    if (patternData.length > 0) {
      const timelineData = patternData.map(item => ({
        date: moment(item.date).format('DD/MM'),
        frequency: parseInt(item.frequency)
      }));
      
      const chart = {
        type: 'line',
        title: `Tendencia Temporal: ${animal}`,
        data: {
          labels: timelineData.map(item => item.date),
          datasets: [{
            label: 'Frecuencia',
            data: timelineData.map(item => item.frequency),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true
          }]
        }
      };
      
      return { patterns, insights, chart };
    }
    
  } catch (error) {
    console.error(`Error analizando patrones para ${animal}:`, error);
  }
  
  return { patterns, insights };
}

module.exports = {
  analyzePatterns,
  analyzeAnimalSpecificPatterns,
  detectCycle
};