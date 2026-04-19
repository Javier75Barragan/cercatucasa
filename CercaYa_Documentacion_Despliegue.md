# Registro de Despliegue - CercaYa (Frontend)

## Información del Proyecto
- **Nombre en Vercel:** cercatucasa
- **URL de Producción:** [https://cercatucasa.vercel.app](https://cercatucasa.vercel.app)
- **Fecha de Despliegue:** 18 de abril de 2026

## Pasos Realizados para el Despliegue Exitoso

### 1. Preparación del Nombre
Se actualizó el archivo `package.json` para que el nombre del proyecto coincida con la identidad del negocio:
```json
"name": "cercatucasa"
```

### 2. Vinculación con Vercel
Se utilizó el CLI de Vercel para vincular la carpeta local con un nuevo proyecto en la nube:
- **Comando:** `vercel link`
- **Configuración:** Se rechazó la vinculación con el proyecto genérico "frontend" y se creó uno nuevo llamado **cercatucasa**.

### 3. Configuración de Variables de Entorno
Para conectar el frontend con el backend en Railway, se agregó la variable necesaria:
- **Variable:** `VITE_API_URL`
- **Valor:** `https://cercaya-backend-production.up.railway.app/api`
- **Comando:** `vercel env add VITE_API_URL production`

### 4. Despliegue a Producción
Se realizó el despliegue final para aplicar las variables de entorno y generar la build de producción:
- **Comando:** `vercel --prod`

---
*Documentación generada automáticamente tras el despliegue.*
