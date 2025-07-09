# ⚡ Instalación Rápida - Agente AI Guacharo Activo

Esta guía te permite tener el sistema funcionando en **menos de 10 minutos**.

## 🚀 Instalación Express (Desarrollo Local)

### 1. Prerrequisitos Rápidos
```bash
# Verificar Node.js (requiere 18+)
node --version

# Si no tienes Node.js, instalar con:
# https://nodejs.org/en/download/
```

### 2. Clonar e Instalar
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/agente-guacharo-ai.git
cd agente-guacharo-ai

# Instalar TODAS las dependencias de una vez
npm run install:all

# Esto ejecuta:
# - cd backend && npm install
# - cd frontend && npm install
```

### 3. Base de Datos (Opción Rápida con SQLite)
```bash
# Editar backend/.env para usar SQLite temporalmente
cp backend/.env.example backend/.env

# Cambiar en backend/.env:
# DB_NAME=guacharo_ai.sqlite
# DB_HOST=localhost
# DB_USER=
# DB_PASSWORD=

# El sistema creará automáticamente la base con datos de ejemplo
```

### 4. Ejecutar Sistema Completo
```bash
# Un solo comando para iniciar frontend + backend
npm run dev

# Esto ejecuta concurrently:
# - Backend en http://localhost:5000
# - Frontend en http://localhost:3000
```

### 5. ¡Listo! 🎉
Abre tu navegador en: **http://localhost:3000**

---

## 🐳 Instalación con Docker (Aún más fácil)

### 1. Crear docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: guacharo_ai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_NAME: guacharo_ai
      DB_USER: postgres
      DB_PASSWORD: password
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 2. Ejecutar con Docker
```bash
# Construir e iniciar todo
docker-compose up --build

# En segundo plano
docker-compose up -d
```

### 3. Acceder
- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:5000**
- Base de datos: **localhost:5432**

---

## ☁️ Instalación en la Nube (5 minutos)

### Vercel + Railway (Recomendado)

#### Frontend en Vercel:
1. Conecta tu repo en [vercel.com](https://vercel.com)
2. Selecciona `frontend` como directorio raíz
3. Deploy automático ✅

#### Backend en Railway:
1. Conecta tu repo en [railway.app](https://railway.app)
2. Agrega PostgreSQL addon
3. Deploy automático ✅

### Variables de Entorno en Railway:
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://tu-app.vercel.app
```

### Variables de Entorno en Vercel:
```
REACT_APP_API_URL=https://tu-backend.railway.app
```

---

## 🔧 Configuración Opcional

### OpenAI API (Para NLP Avanzado)
```bash
# En backend/.env agregar:
OPENAI_API_KEY=sk-tu-key-aqui
OPENAI_MODEL=gpt-3.5-turbo
```

### Base de Datos PostgreSQL Local
```bash
# Instalar PostgreSQL
# Ubuntu/Debian:
sudo apt install postgresql

# macOS:
brew install postgresql

# Crear base de datos:
createdb guacharo_ai

# Actualizar backend/.env:
DB_HOST=localhost
DB_NAME=guacharo_ai
DB_USER=tu_usuario
DB_PASSWORD=tu_password
```

---

## 🧪 Verificar Instalación

### 1. Probar Backend
```bash
curl http://localhost:5000/health
# Debe retornar: {"status":"OK","timestamp":"..."}
```

### 2. Probar Frontend
Abre http://localhost:3000 y deberías ver:
- 🤖 Interfaz de chat
- Mensaje de bienvenida del agente
- Sugerencias de preguntas

### 3. Probar Chat
Escribe en el chat:
```
"¿Cuáles son los animales más frecuentes?"
```
El agente debe responder con estadísticas y gráficos.

---

## 🚨 Solución de Problemas Rápidos

### Error: "Puerto en uso"
```bash
# Matar procesos en puertos 3000 y 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Error: "Base de datos no conecta"
```bash
# Verificar PostgreSQL corriendo
sudo systemctl status postgresql

# O usar SQLite temporalmente en backend/.env:
DB_NAME=guacharo_ai.sqlite
```

### Error: "Dependencias faltantes"
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json  
rm -rf frontend/node_modules frontend/package-lock.json

npm run install:all
```

### Error: "OpenAI API"
```bash
# El sistema funciona sin OpenAI, solo comenta en backend/.env:
# OPENAI_API_KEY=
```

---

## 📱 Accesos Rápidos

Una vez instalado, puedes acceder a:

- **Chat Principal**: http://localhost:3000
- **API Docs**: http://localhost:5000/health
- **Análisis de Frecuencias**: http://localhost:3000/analysis
- **Predicciones**: http://localhost:3000/predictions

---

## 🎯 Primeros Pasos

### 1. Preguntas de Prueba
```
"Hola, ¿qué puedes hacer?"
"¿Cuál animal ha salido más esta semana?"
"Analiza los patrones del león"
"Hazme una predicción para la próxima hora"
"¿Qué probabilidad tiene el águila de salir?"
```

### 2. Explorar Funcionalidades
- ✅ Chat conversacional en español
- ✅ Análisis de frecuencias automático
- ✅ Detección de patrones temporales
- ✅ Predicciones con 5 algoritmos
- ✅ Gráficos interactivos
- ✅ Recomendaciones personalizadas

### 3. Configurar para Producción
Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones completas.

---

## 🆘 ¿Necesitas Ayuda?

1. **Revisa los logs**:
   ```bash
   # Backend logs
   cd backend && npm run dev
   
   # Frontend logs  
   cd frontend && npm start
   ```

2. **Verifica configuración**:
   ```bash
   # Variables de entorno
   cat backend/.env
   ```

3. **Reinicia todo**:
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

---

## ✨ ¡Listo para usar!

Tu **Agente AI Conversacional para Guacharo Activo** está funcionando y listo para:

- 🧠 Analizar patrones inteligentemente
- 📊 Generar gráficos automáticamente  
- 🎯 Hacer predicciones precisas
- 💬 Conversar naturalmente en español
- 🚀 Ayudar a usuarios con análisis de lotería

**¡Disfruta explorando las capacidades de tu agente de IA!** 🤖