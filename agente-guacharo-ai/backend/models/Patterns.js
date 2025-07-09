const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Patterns = sequelize.define('Patterns', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pattern_type: {
      type: DataTypes.ENUM('cyclical', 'sequential', 'temporal', 'frequency', 'trend'),
      allowNull: false,
      index: true
    },
    animal_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      index: true
    },
    pattern_data: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    timeframe_start: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },
    timeframe_end: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },
    occurrences: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    last_validated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      index: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'patterns',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['pattern_type', 'animal_name']
      },
      {
        fields: ['confidence']
      },
      {
        fields: ['timeframe_start', 'timeframe_end']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Métodos estáticos
  Patterns.getActivePatterns = async function(animalName = null, patternType = null) {
    let whereClause = { is_active: true };
    
    if (animalName) {
      whereClause.animal_name = animalName;
    }
    
    if (patternType) {
      whereClause.pattern_type = patternType;
    }
    
    return await this.findAll({
      where: whereClause,
      order: [['confidence', 'DESC'], ['updated_at', 'DESC']]
    });
  };

  Patterns.getBestPatterns = async function(limit = 10) {
    return await this.findAll({
      where: { 
        is_active: true,
        confidence: {
          [sequelize.Sequelize.Op.gte]: 60
        }
      },
      order: [['confidence', 'DESC']],
      limit
    });
  };

  Patterns.getPatternsByTimeframe = async function(startDate, endDate) {
    return await this.findAll({
      where: {
        is_active: true,
        [sequelize.Sequelize.Op.or]: [
          {
            timeframe_start: {
              [sequelize.Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            timeframe_end: {
              [sequelize.Sequelize.Op.between]: [startDate, endDate]
            }
          },
          {
            [sequelize.Sequelize.Op.and]: [
              {
                timeframe_start: {
                  [sequelize.Sequelize.Op.lte]: startDate
                }
              },
              {
                timeframe_end: {
                  [sequelize.Sequelize.Op.gte]: endDate
                }
              }
            ]
          }
        ]
      }
    });
  };

  Patterns.validatePattern = async function(patternId, isValid) {
    const pattern = await this.findByPk(patternId);
    if (!pattern) return null;

    if (isValid) {
      await pattern.update({
        last_validated: new Date(),
        occurrences: pattern.occurrences + 1
      });
    } else {
      await pattern.update({
        is_active: false,
        last_validated: new Date()
      });
    }

    return pattern;
  };

  Patterns.getPatternStats = async function() {
    const stats = await sequelize.query(`
      SELECT 
        pattern_type,
        COUNT(*) as total_patterns,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_patterns
      FROM patterns
      GROUP BY pattern_type
      ORDER BY avg_confidence DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const totalPatterns = await this.count();
    const activePatterns = await this.count({ where: { is_active: true } });
    const avgConfidence = await this.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('confidence')), 'avg_confidence']
      ],
      where: { is_active: true },
      raw: true
    });

    return {
      total_patterns: totalPatterns,
      active_patterns: activePatterns,
      avg_confidence: parseFloat(avgConfidence?.avg_confidence || 0).toFixed(2),
      by_type: stats
    };
  };

  return Patterns;
};