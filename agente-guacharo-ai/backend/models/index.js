const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'guacharo_ai',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Importar modelos
const Results = require('./Results');
const Patterns = require('./Patterns');
const Users = require('./Users');
const Conversations = require('./Conversations');

// Inicializar modelos
const models = {
  Results: Results(sequelize),
  Patterns: Patterns(sequelize),
  Users: Users(sequelize),
  Conversations: Conversations(sequelize)
};

// Configurar asociaciones
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    // Poblar datos iniciales si es necesario
    await seedInitialData();
    console.log('✅ Datos iniciales cargados');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

// Poblar datos iniciales
async function seedInitialData() {
  try {
    // Verificar si ya existen datos
    const resultCount = await models.Results.count();
    
    if (resultCount === 0) {
      console.log('📊 Generando datos de ejemplo...');
      await generateSampleData();
    }
  } catch (error) {
    console.error('Error en seed inicial:', error);
  }
}

// Generar datos de ejemplo para pruebas
async function generateSampleData() {
  const { animals } = require('../../ai-training/guacharo-knowledge.json');
  const moment = require('moment');
  
  const sampleResults = [];
  const drawTimes = ['9:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', '23:00'];
  
  // Generar 30 días de datos de ejemplo
  for (let day = 0; day < 30; day++) {
    const date = moment().subtract(day, 'days');
    
    for (const time of drawTimes) {
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      
      sampleResults.push({
        draw_date: date.format('YYYY-MM-DD'),
        draw_time: time,
        animal_name: randomAnimal.name,
        animal_number: randomAnimal.number,
        draw_number: `${date.format('YYYYMMDD')}-${time.replace(':', '')}`,
        created_at: date.set({
          hour: parseInt(time.split(':')[0]),
          minute: parseInt(time.split(':')[1])
        }).toDate()
      });
    }
  }
  
  await models.Results.bulkCreate(sampleResults);
  console.log(`✅ ${sampleResults.length} resultados de ejemplo creados`);
}

module.exports = {
  sequelize,
  models,
  initializeDatabase
};