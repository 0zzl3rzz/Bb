# 🚀 Guía de Despliegue - Agente AI Guacharo Activo

Esta guía te llevará paso a paso a través del proceso de despliegue del Agente AI Conversacional para Guacharo Activo en producción.

## 📋 Prerrequisitos

### Locales
- Node.js 18+ 
- PostgreSQL 12+
- NPM o Yarn
- Git

### En la Nube
- Cuenta en Vercel (frontend)
- Cuenta en Railway/Render (backend + DB)
- Cuenta en OpenAI (opcional, para NLP avanzado)

## 🛠️ Configuración Local

### 1. Clonar y Configurar
```bash
# Clonar repositorio
git clone <tu-repo-url>
cd agente-guacharo-ai

# Instalar dependencias
npm run install:all
```

### 2. Base de Datos Local
```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crear base de datos
sudo -u postgres createdb guacharo_ai
sudo -u postgres createuser --interactive

# O usando Docker
docker run --name guacharo-postgres \
  -e POSTGRES_DB=guacharo_ai \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Variables de Entorno
```bash
# Backend
cp backend/.env.example backend/.env

# Editar backend/.env:
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_NAME=guacharo_ai
DB_USER=postgres
DB_PASSWORD=tu_password

# OpenAI (opcional)
OPENAI_API_KEY=sk-...
```

### 4. Prueba Local
```bash
# Desarrollo
npm run dev

# Producción local
npm run build
npm start
```

## ☁️ Despliegue en la Nube

### Opción 1: Vercel + Railway (Recomendado)

#### Frontend en Vercel

1. **Conectar Repositorio**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Inicializar proyecto
cd frontend
vercel

# Configurar
vercel --prod
```

2. **Configurar Variables de Entorno en Vercel**
```
REACT_APP_API_URL=https://tu-backend.railway.app
REACT_APP_SOCKET_URL=https://tu-backend.railway.app
```

3. **Deploy Automático**
- Cada push a `main` desplegará automáticamente
- Vercel generará URL: `https://agente-guacharo-ai.vercel.app`

#### Backend + DB en Railway

1. **Crear Proyecto en Railway**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y crear proyecto
railway login
railway init
```

2. **Configurar PostgreSQL**
```bash
# Agregar PostgreSQL addon
railway add postgresql

# Railway auto-genera DATABASE_URL
```

3. **Variables de Entorno en Railway**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://agente-guacharo-ai.vercel.app
OPENAI_API_KEY=sk-...
JWT_SECRET=super_secret_key_aqui
```

4. **Deploy Backend**
```bash
cd backend
railway deploy
```

### Opción 2: Netlify + Render

#### Frontend en Netlify

1. **Conectar Repositorio**
- Ir a Netlify Dashboard
- "New site from Git"
- Seleccionar repositorio
- Build command: `cd frontend && npm run build`
- Publish directory: `frontend/build`

2. **Variables de Entorno**
```
REACT_APP_API_URL=https://tu-backend.onrender.com
REACT_APP_SOCKET_URL=https://tu-backend.onrender.com
```

#### Backend en Render

1. **Crear Web Service**
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`

2. **Crear PostgreSQL Database**
- Crear PostgreSQL instance en Render
- Copiar DATABASE_URL

3. **Variables de Entorno**
```
NODE_ENV=production
DATABASE_URL=postgresql://...
FRONTEND_URL=https://tu-app.netlify.app
OPENAI_API_KEY=sk-...
```

### Opción 3: VPS/Servidor Propio

#### Configuración del Servidor

1. **Preparar Servidor Ubuntu**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install nginx
```

2. **Configurar Base de Datos**
```bash
sudo -u postgres psql
CREATE DATABASE guacharo_ai;
CREATE USER guacharo_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE guacharo_ai TO guacharo_user;
\q
```

3. **Clonar y Configurar Proyecto**
```bash
cd /var/www
sudo git clone <tu-repo> agente-guacharo-ai
sudo chown -R $USER:$USER agente-guacharo-ai
cd agente-guacharo-ai

# Configurar variables de entorno
sudo nano backend/.env
```

4. **Construir Frontend**
```bash
cd frontend
npm install
npm run build

# Copiar build a directorio de Nginx
sudo cp -r build/* /var/www/html/
```

5. **Configurar PM2 para Backend**
```bash
cd backend
npm install

# Crear ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'guacharo-ai-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOF

# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

6. **Configurar Nginx**
```bash
sudo nano /etc/nginx/sites-available/guacharo-ai

# Configuración:
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket para Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Activar sitio
sudo ln -s /etc/nginx/sites-available/guacharo-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **SSL con Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

## 🔐 Configuración de Seguridad

### 1. Variables de Entorno Seguras
```bash
# Generar JWT secret seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Configurar en producción
JWT_SECRET=generated_secret_here
```

### 2. Configurar CORS Apropiado
```javascript
// En server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 3. Rate Limiting Estricto
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
```

## 🔄 CI/CD Automático

### GitHub Actions
Crear `.github/workflows/deploy.yml`:
```yaml
name: Deploy Agente Guacharo AI

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd frontend && npm install
        cd ../backend && npm install
        
    - name: Build frontend
      run: cd frontend && npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./frontend
        
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        cd backend && railway deploy
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 📊 Monitoreo y Logs

### 1. Configurar Logging
```javascript
// En server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Métricas con PM2
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 3. Monitoreo de Base de Datos
```sql
-- Consulta para monitorear performance
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de Conexión a DB**
```bash
# Verificar conexión
psql -h hostname -U username -d database_name

# Verificar variables de entorno
echo $DATABASE_URL
```

2. **CORS Errors**
```javascript
// Verificar configuración CORS
console.log('Frontend URL:', process.env.FRONTEND_URL);
```

3. **Socket.IO no conecta**
```javascript
// Verificar configuración Socket.IO
io.set('transports', ['websocket', 'polling']);
```

### Logs Útiles
```bash
# Backend logs
pm2 logs guacharo-ai-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 📈 Optimización de Performance

### 1. Caché con Redis
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Caché de predicciones
app.get('/api/predictions', cache(300), getPredictions);
```

### 2. Compresión
```javascript
const compression = require('compression');
app.use(compression());
```

### 3. Índices de Base de Datos
```sql
-- Optimizar consultas frecuentes
CREATE INDEX idx_results_animal_date ON results(animal_name, draw_date);
CREATE INDEX idx_results_created_at ON results(created_at);
```

## ✅ Checklist Final

- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] SSL certificado instalado
- [ ] Backups automatizados configurados
- [ ] Monitoreo activo
- [ ] CI/CD pipeline funcionando
- [ ] Tests de carga realizados
- [ ] Documentación actualizada

## 🆘 Soporte

Si encuentras problemas durante el despliegue:

1. Revisa los logs detalladamente
2. Verifica todas las variables de entorno
3. Confirma conectividad de red entre servicios
4. Revisa la documentación de tu proveedor cloud

¡Tu Agente AI Guacharo Activo estará listo para ayudar a los usuarios! 🚀