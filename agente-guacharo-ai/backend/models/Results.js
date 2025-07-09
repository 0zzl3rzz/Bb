const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize) => {
  const Results = sequelize.define('Results', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    draw_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      index: true
    },
    draw_time: {
      type: DataTypes.TIME,
      allowNull: false,
      index: true
    },
    animal_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      index: true
    },
    animal_number: {
      type: DataTypes.STRING(2),
      allowNull: false,
      index: true
    },
    draw_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'results',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['draw_date', 'draw_time']
      },
      {
        fields: ['animal_name']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Métodos estáticos del modelo
  Results.getRecentResults = async function(limit = 50) {
    return await this.findAll({
      order: [['created_at', 'DESC']],
      limit: limit
    });
  };

  Results.getAnimalStats = async function(timeframe = 'this_week') {
    const dateRange = getDateRange(timeframe);
    
    const stats = await sequelize.query(`
      SELECT 
        animal_name,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM results WHERE created_at >= :startDate AND created_at <= :endDate)), 2) as percentage,
        MAX(created_at) as last_appearance
      FROM results 
      WHERE created_at >= :startDate AND created_at <= :endDate
      GROUP BY animal_name
      ORDER BY count DESC
    `, {
      replacements: {
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      type: sequelize.QueryTypes.SELECT
    });

    return stats;
  };

  Results.getPatternData = async function(animal = null, timeframe = 'this_week') {
    const dateRange = getDateRange(timeframe);
    let whereClause = 'WHERE created_at >= :startDate AND created_at <= :endDate';
    let replacements = {
      startDate: dateRange.start,
      endDate: dateRange.end
    };

    if (animal) {
      whereClause += ' AND animal_name = :animal';
      replacements.animal = animal;
    }

    const patterns = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        EXTRACT(HOUR FROM created_at) as hour,
        EXTRACT(DOW FROM created_at) as day_of_week,
        animal_name,
        animal_number,
        COUNT(*) as frequency
      FROM results 
      ${whereClause}
      GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at), EXTRACT(DOW FROM created_at), animal_name, animal_number
      ORDER BY date DESC, hour ASC
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return patterns;
  };

  Results.getFrequencyByHour = async function(timeframe = 'this_week') {
    const dateRange = getDateRange(timeframe);
    
    return await sequelize.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        animal_name,
        COUNT(*) as count
      FROM results 
      WHERE created_at >= :startDate AND created_at <= :endDate
      GROUP BY EXTRACT(HOUR FROM created_at), animal_name
      ORDER BY hour, count DESC
    `, {
      replacements: {
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      type: sequelize.QueryTypes.SELECT
    });
  };

  Results.getFrequencyByDay = async function(timeframe = 'this_week') {
    const dateRange = getDateRange(timeframe);
    
    return await sequelize.query(`
      SELECT 
        EXTRACT(DOW FROM created_at) as day_of_week,
        animal_name,
        COUNT(*) as count
      FROM results 
      WHERE created_at >= :startDate AND created_at <= :endDate
      GROUP BY EXTRACT(DOW FROM created_at), animal_name
      ORDER BY day_of_week, count DESC
    `, {
      replacements: {
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      type: sequelize.QueryTypes.SELECT
    });
  };

  Results.getLastAppearance = async function(animalName) {
    return await this.findOne({
      where: { animal_name: animalName },
      order: [['created_at', 'DESC']]
    });
  };

  Results.getSequentialPatterns = async function(length = 3) {
    return await sequelize.query(`
      WITH sequential_results AS (
        SELECT 
          animal_name,
          animal_number,
          created_at,
          LAG(animal_name, 1) OVER (ORDER BY created_at) as prev_1,
          LAG(animal_name, 2) OVER (ORDER BY created_at) as prev_2
        FROM results
        ORDER BY created_at DESC
        LIMIT 1000
      )
      SELECT 
        prev_2, prev_1, animal_name as current,
        COUNT(*) as frequency
      FROM sequential_results
      WHERE prev_2 IS NOT NULL AND prev_1 IS NOT NULL
      GROUP BY prev_2, prev_1, animal_name
      HAVING COUNT(*) >= 2
      ORDER BY frequency DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
  };

  return Results;
};

// Función auxiliar para obtener rangos de fechas
function getDateRange(timeframe) {
  const now = moment();
  let start, end;

  switch (timeframe) {
    case 'today':
      start = now.clone().startOf('day');
      end = now.clone().endOf('day');
      break;
    case 'yesterday':
      start = now.clone().subtract(1, 'day').startOf('day');
      end = now.clone().subtract(1, 'day').endOf('day');
      break;
    case 'this_week':
      start = now.clone().startOf('week');
      end = now.clone().endOf('week');
      break;
    case 'last_week':
      start = now.clone().subtract(1, 'week').startOf('week');
      end = now.clone().subtract(1, 'week').endOf('week');
      break;
    case 'this_month':
      start = now.clone().startOf('month');
      end = now.clone().endOf('month');
      break;
    case 'recent_days':
      start = now.clone().subtract(7, 'days');
      end = now.clone();
      break;
    default:
      start = now.clone().startOf('week');
      end = now.clone().endOf('week');
  }

  return {
    start: start.toDate(),
    end: end.toDate()
  };
}