# 🚀 Guía de Deploy para SafeVG

## 📋 Prerrequisitos

- [ ] Cuenta en GitHub
- [ ] Cuenta en Render (para backend) - render.com
- [ ] Cuenta en Vercel (para frontend) - vercel.com
- [ ] Git instalado y configurado

## 🔧 Preparación del Proyecto

### 1. Configurar Variables de Entorno

#### Backend (.env)
```
SECRET_KEY=tu_secret_key_super_segura_aqui
DEBUG=False
DB_NAME=safevg_production
DB_USER=safevg_user
DB_PASSWORD=tu_password_db_segura
DB_HOST=localhost
DB_PORT=5432
DJANGO_SETTINGS_MODULE=django_crud_api.settings_production
FRONTEND_URL=https://tu-dominio-frontend.vercel.app
JIRA_API_URL=tu_jira_url
JIRA_EMAIL=tu_email_jira
JIRA_API_TOKEN=tu_token_jira
JIRA_PROJECT_KEY=tu_proyecto_key
```

#### Frontend (.env)
```
VITE_API_BASE_URL=https://tu-backend.onrender.com
VITE_FRONTEND_BASE_URL=https://tu-frontend.vercel.app
```

### 2. Preparar Repositorio

```bash
# 1. Hacer commit de todos los cambios
git add .
git commit -m "Configuración para deploy en producción"

# 2. Subir a GitHub
git push origin master
```

## 🌐 Deploy del Backend (Render)

### Paso 1: Crear cuenta en Render
1. Ve a https://render.com
2. Regístrate con tu cuenta de GitHub
3. Conecta tu repositorio SIGDDES

### Paso 2: Crear Base de Datos PostgreSQL
1. En Render dashboard, click "New" → "PostgreSQL"
2. Configuración:
   - Name: `safevg-postgres`
   - Database Name: `safevg_production`
   - User: `safevg_user`
   - Plan: Free (para empezar)

### Paso 3: Crear Web Service para Backend
1. Click "New" → "Web Service"
2. Conectar repositorio GitHub: `Francisco-q/SIGDDES`
3. Configuración:
   - Name: `safevg-backend`
   - Root Directory: `backend`
   - Environment: `Python 3`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn django_crud_api.wsgi:application`
   - Plan: Free

### Paso 4: Configurar Variables de Entorno en Render
En la sección Environment Variables, agregar:
```
DJANGO_SETTINGS_MODULE=django_crud_api.settings_production
SECRET_KEY=[Auto-generated]
DB_NAME=[From Database]
DB_USER=[From Database] 
DB_PASSWORD=[From Database]
DB_HOST=[From Database]
DB_PORT=[From Database]
FRONTEND_URL=https://tu-frontend.vercel.app
```

## 🎨 Deploy del Frontend (Vercel)

### Paso 1: Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Regístrate con tu cuenta de GitHub

### Paso 2: Importar Proyecto
1. Click "New Project"
2. Importar repositorio: `Francisco-q/SIGDDES`
3. Configuración:
   - Framework Preset: `Vite`
   - Root Directory: `Frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Paso 3: Configurar Variables de Entorno en Vercel
```
VITE_API_BASE_URL=https://safevg-backend.onrender.com
VITE_FRONTEND_BASE_URL=https://safevg-frontend.vercel.app
```

## 🔗 Configuración Final

### 1. Actualizar CORS en Backend
Una vez que tengas las URLs finales, actualizar en `settings_production.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://tu-dominio-frontend.vercel.app",
]

ALLOWED_HOSTS = [
    'tu-backend.onrender.com',
]
```

### 2. Actualizar Variables de Entorno Frontend
En Vercel, actualizar:
```
VITE_API_BASE_URL=https://tu-backend-real.onrender.com
```

### 3. Re-deploy
1. Hacer commit de los cambios
2. Push a GitHub
3. Tanto Render como Vercel harán auto-deploy

## 🧪 Testing de Producción

### Checklist Post-Deploy
- [ ] Backend responde en: `https://tu-backend.onrender.com/api/`
- [ ] Frontend carga en: `https://tu-frontend.vercel.app`
- [ ] CORS configurado correctamente
- [ ] Base de datos conectada
- [ ] Autenticación JWT funciona
- [ ] Formularios de denuncia funcionan
- [ ] Mapas cargan correctamente
- [ ] Reportes se envían correctamente

## 🔐 Seguridad Post-Deploy

1. **Cambiar todas las contraseñas por defecto**
2. **Configurar dominios personalizados** (opcional)
3. **Habilitar HTTPS** (automático en Render/Vercel)
4. **Configurar monitoring** básico
5. **Backup automático** de base de datos

## 🆘 Troubleshooting Común

### Error de CORS
```python
# En settings_production.py
CORS_ALLOWED_ORIGINS = [
    "https://tu-dominio-exacto.vercel.app",  # Sin barra final
]
```

### Error de Database
```bash
# En Render, revisar logs:
# Logs → View Logs
# Verificar conexión a PostgreSQL
```

### Error 404 en Frontend
```json
// Verificar vercel.json está configurado:
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Error de Environment Variables
```bash
# Verificar que todas las variables estén configuradas
# En Render: Environment → Environment Variables
# En Vercel: Settings → Environment Variables
```

## 📧 URLs Finales

Una vez completado el deploy:
- **Frontend**: `https://safevg-[random].vercel.app`
- **Backend**: `https://safevg-backend-[random].onrender.com`
- **Admin Panel**: `https://safevg-backend-[random].onrender.com/admin/`

## 📞 Compartir con Usuarios

Para compartir tu aplicación:
1. **URL principal**: `https://tu-frontend.vercel.app`
2. **Demo accounts**: Crear usuarios demo si es necesario
3. **Documentación**: Crear guía básica de uso
4. **Soporte**: Configurar canal de feedback

---

¿Necesitas ayuda con algún paso? ¡Pregúntame!
