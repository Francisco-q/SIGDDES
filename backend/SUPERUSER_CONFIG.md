# Configuración de Variables de Entorno en Render

## Variables del Superusuario

Después del deploy, configura estas variables de entorno en el Dashboard de Render:

### 1. Ve a tu servicio en Render Dashboard
- https://dashboard.render.com
- Selecciona tu servicio `safevg-backend`

### 2. Ve a Environment Variables
- Haz clic en "Environment" en el menú lateral

### 3. Agrega estas variables:

```
SUPERUSER_USERNAME = admin
SUPERUSER_EMAIL = tu-email@ejemplo.com  
SUPERUSER_PASSWORD = TuContraseñaSegura123!
```

### 4. Redeploy
- Haz clic en "Manual Deploy" → "Deploy latest commit"

### 5. Acceso al Admin
- URL: https://front-0opi.onrender.com/admin/
- Usuario: admin (o el que hayas configurado)
- Contraseña: La que configuraste

## Seguridad

✅ **Buenas prácticas implementadas:**
- Credenciales NO están en el código fuente
- Variables de entorno obligatorias (sin defaults)
- Configuración solo en plataforma de deployment
- Contraseña generada o personalizada por el usuario

## Comando Manual (Alternativo)

Si prefieres, también puedes crear el superusuario manualmente:

```bash
# En la consola de Render o localmente
python manage.py createsuperuser
```
