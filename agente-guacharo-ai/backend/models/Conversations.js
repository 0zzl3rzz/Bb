const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversations = sequelize.define('Conversations', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    intent: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    entities: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    charts: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    recommendations: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    response_time: {
      type: DataTypes.INTEGER, // milliseconds
      allowNull: true
    },
    satisfaction_rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    feedback: {
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
    tableName: 'conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['intent']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['satisfaction_rating']
      }
    ]
  });

  // Asociaciones
  Conversations.associate = function(models) {
    Conversations.belongsTo(models.Users, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  // Métodos estáticos
  Conversations.getRecentByUser = async function(userId, limit = 50) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit
    });
  };

  Conversations.getPopularIntents = async function(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await sequelize.query(`
      SELECT 
        intent,
        COUNT(*) as count,
        AVG(satisfaction_rating) as avg_rating
      FROM conversations 
      WHERE created_at >= :startDate 
        AND intent IS NOT NULL
      GROUP BY intent
      ORDER BY count DESC
      LIMIT 10
    `, {
      replacements: { startDate },
      type: sequelize.QueryTypes.SELECT
    });
  };

  Conversations.getAnalyticsData = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalConversations = await this.count({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      }
    });

    const avgResponseTime = await this.findOne({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        },
        response_time: {
          [sequelize.Sequelize.Op.not]: null
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time']
      ],
      raw: true
    });

    const avgSatisfaction = await this.findOne({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        },
        satisfaction_rating: {
          [sequelize.Sequelize.Op.not]: null
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('satisfaction_rating')), 'avg_satisfaction']
      ],
      raw: true
    });

    const dailyStats = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as conversations,
        AVG(response_time) as avg_response_time,
        AVG(satisfaction_rating) as avg_satisfaction
      FROM conversations
      WHERE created_at >= :startDate
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, {
      replacements: { startDate },
      type: sequelize.QueryTypes.SELECT
    });

    return {
      total_conversations: totalConversations,
      avg_response_time: Math.round(avgResponseTime?.avg_response_time || 0),
      avg_satisfaction: parseFloat(avgSatisfaction?.avg_satisfaction || 0).toFixed(2),
      daily_stats: dailyStats
    };
  };

  return Conversations;
};