const express = require('express');
const router = express.Router();
const { models } = require('../models');
const moment = require('moment');

// GET /api/results - Obtener resultados recientes
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const results = await models.Results.findAll({
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await models.Results.count();
    
    res.json({
      success: true,
      data: {
        results,
        total,
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({
      error: 'Error obteniendo resultados'
    });
  }
});

// GET /api/results/today - Resultados de hoy
router.get('/today', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    
    const results = await models.Results.findAll({
      where: {
        draw_date: today
      },
      order: [['draw_time', 'ASC']]
    });
    
    res.json({
      success: true,
      data: {
        date: today,
        results,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo resultados de hoy:', error);
    res.status(500).json({
      error: 'Error obteniendo resultados de hoy'
    });
  }
});

// GET /api/results/date/:date - Resultados de una fecha específica
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!moment(date, 'YYYY-MM-DD').isValid()) {
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }
    
    const results = await models.Results.findAll({
      where: {
        draw_date: date
      },
      order: [['draw_time', 'ASC']]
    });
    
    res.json({
      success: true,
      data: {
        date,
        results,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo resultados por fecha:', error);
    res.status(500).json({
      error: 'Error obteniendo resultados por fecha'
    });
  }
});

// GET /api/results/range/:startDate/:endDate - Resultados en un rango de fechas
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    if (!moment(startDate, 'YYYY-MM-DD').isValid() || 
        !moment(endDate, 'YYYY-MM-DD').isValid()) {
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }
    
    const results = await models.Results.findAll({
      where: {
        draw_date: {
          [models.sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['draw_date', 'DESC'], ['draw_time', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        start_date: startDate,
        end_date: endDate,
        results,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo resultados por rango:', error);
    res.status(500).json({
      error: 'Error obteniendo resultados por rango'
    });
  }
});

// GET /api/results/animal/:animal - Resultados de un animal específico
router.get('/animal/:animal', async (req, res) => {
  try {
    const { animal } = req.params;
    const { limit = 100 } = req.query;
    
    const results = await models.Results.findAll({
      where: {
        animal_name: {
          [models.sequelize.Sequelize.Op.iLike]: `%${animal}%`
        }
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });
    
    const total = await models.Results.count({
      where: {
        animal_name: {
          [models.sequelize.Sequelize.Op.iLike]: `%${animal}%`
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        animal,
        results,
        total,
        last_appearance: results[0] || null
      }
    });
  } catch (error) {
    console.error('Error obteniendo resultados por animal:', error);
    res.status(500).json({
      error: 'Error obteniendo resultados por animal'
    });
  }
});

// POST /api/results - Crear nuevo resultado (admin)
router.post('/', async (req, res) => {
  try {
    const { draw_date, draw_time, animal_name, animal_number } = req.body;
    
    if (!draw_date || !draw_time || !animal_name || !animal_number) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: draw_date, draw_time, animal_name, animal_number'
      });
    }
    
    // Generar draw_number único
    const draw_number = `${moment(draw_date).format('YYYYMMDD')}-${draw_time.replace(':', '')}`;
    
    const result = await models.Results.create({
      draw_date,
      draw_time,
      animal_name,
      animal_number,
      draw_number,
      created_at: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creando resultado:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Ya existe un resultado para esa fecha y hora'
      });
    }
    
    res.status(500).json({
      error: 'Error creando resultado'
    });
  }
});

// GET /api/results/stats/summary - Resumen estadístico
router.get('/stats/summary', async (req, res) => {
  try {
    const totalResults = await models.Results.count();
    const todayResults = await models.Results.count({
      where: {
        draw_date: moment().format('YYYY-MM-DD')
      }
    });
    
    const weekResults = await models.Results.count({
      where: {
        created_at: {
          [models.sequelize.Sequelize.Op.gte]: moment().startOf('week').toDate()
        }
      }
    });
    
    const lastResult = await models.Results.findOne({
      order: [['created_at', 'DESC']]
    });
    
    // Obtener estadísticas de animales más frecuentes
    const topAnimals = await models.Results.findAll({
      attributes: [
        'animal_name',
        [models.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['animal_name'],
      order: [[models.sequelize.literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        total_results: totalResults,
        today_results: todayResults,
        week_results: weekResults,
        last_result: lastResult,
        top_animals: topAnimals,
        summary_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo resumen estadístico:', error);
    res.status(500).json({
      error: 'Error obteniendo resumen estadístico'
    });
  }
});

// GET /api/results/search - Búsqueda de resultados
router.get('/search', async (req, res) => {
  try {
    const { 
      animal, 
      date_from, 
      date_to, 
      time_from, 
      time_to,
      limit = 50,
      offset = 0 
    } = req.query;
    
    let whereClause = {};
    
    if (animal) {
      whereClause.animal_name = {
        [models.sequelize.Sequelize.Op.iLike]: `%${animal}%`
      };
    }
    
    if (date_from && date_to) {
      whereClause.draw_date = {
        [models.sequelize.Sequelize.Op.between]: [date_from, date_to]
      };
    } else if (date_from) {
      whereClause.draw_date = {
        [models.sequelize.Sequelize.Op.gte]: date_from
      };
    } else if (date_to) {
      whereClause.draw_date = {
        [models.sequelize.Sequelize.Op.lte]: date_to
      };
    }
    
    if (time_from && time_to) {
      whereClause.draw_time = {
        [models.sequelize.Sequelize.Op.between]: [time_from, time_to]
      };
    }
    
    const results = await models.Results.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await models.Results.count({ where: whereClause });
    
    res.json({
      success: true,
      data: {
        results,
        total,
        filters: req.query,
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error en búsqueda de resultados:', error);
    res.status(500).json({
      error: 'Error en búsqueda de resultados'
    });
  }
});

// DELETE /api/results/:id - Eliminar resultado (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await models.Results.findByPk(id);
    
    if (!result) {
      return res.status(404).json({
        error: 'Resultado no encontrado'
      });
    }
    
    await result.destroy();
    
    res.json({
      success: true,
      message: 'Resultado eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando resultado:', error);
    res.status(500).json({
      error: 'Error eliminando resultado'
    });
  }
});

module.exports = router;