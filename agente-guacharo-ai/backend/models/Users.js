const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Users = sequelize.define('Users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        theme: 'light',
        language: 'es',
        notifications: true
      }
    },
    last_active: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['session_id']
      },
      {
        fields: ['email']
      },
      {
        fields: ['last_active']
      }
    ]
  });

  // Asociaciones
  Users.associate = function(models) {
    Users.hasMany(models.Conversations, {
      foreignKey: 'user_id',
      as: 'conversations'
    });
  };

  // Métodos estáticos
  Users.findOrCreateBySession = async function(sessionId) {
    const [user, created] = await this.findOrCreate({
      where: { session_id: sessionId },
      defaults: {
        session_id: sessionId,
        last_active: new Date()
      }
    });

    if (!created) {
      await user.update({ last_active: new Date() });
    }

    return user;
  };

  return Users;
};