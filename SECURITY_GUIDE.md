# 🔐 Guía de Seguridad - SafeVG

## ⚠️ IMPORTANTE: Variables de Entorno

### ❌ NUNCA hagas esto:
```bash
# NO commitear archivos con datos reales
git add .env
git commit -m "agregando configuración"  # ¡PELIGROSO!
```

### ✅ SÍ haz esto:
```bash
# Usar archivos .example como plantilla
cp .env.example .env
# Editar .env con tus datos reales
# El .gitignore ya excluye .env automáticamente
```

## 📁 Archivos de Configuración

### Frontend (`Frontend/.env`)
```env
# Solo configuraciones públicas
VITE_API_BASE_URL=http://localhost:8000
VITE_FRONTEND_BASE_URL=http://localhost:5173
```

### Backend (`backend/.env`)
```env
# Configuraciones privadas del servidor
SECRET_KEY=tu-secret-key-unica
DB_PASSWORD=tu-password-db-segura
JIRA_API_TOKEN=tu-token-privado
```

## 🛡️ Protecciones Implementadas

### 1. .gitignore Completo
- ✅ Excluye todos los archivos `.env*` (excepto `.example`)
- ✅ Excluye archivos de base de datos locales
- ✅ Excluye archivos temporales y logs
- ✅ Excluye archivos de build y dependencias

### 2. Archivos .example
- ✅ Plantillas seguras sin datos reales
- ✅ Documentación completa de cada variable
- ✅ Instrucciones de uso incluidas

### 3. Configuración Separada por Entorno
- ✅ `settings.py` para desarrollo
- ✅ `settings_production.py` para producción
- ✅ Variables específicas por ambiente

## 🚀 Configuración en Producción

### Render (Backend)
1. Ve a tu servicio en Render
2. Settings → Environment Variables
3. Agrega las variables del `.env.example`
4. **NO** copies el archivo .env directamente

### Vercel (Frontend)
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega solo las variables `VITE_*`
4. Recuerda que estas son **públicas**

## 🔍 Verificación de Seguridad

### Comandos para verificar:
```bash
# Verificar que .env no está en el repositorio
git ls-files | grep -E "\.env$"  # No debe devolver resultados

# Verificar que .gitignore funciona
git status  # .env debe aparecer como ignored

# Verificar archivos sensibles
git log --name-only | grep -E "\.(env|key|pem|p12)$"  # No debe encontrar archivos sensibles
```

## 📋 Checklist de Seguridad

### Antes de cada commit:
- [ ] Verificar que no hay archivos `.env` en staging
- [ ] Revisar que no hay contraseñas en el código
- [ ] Confirmar que los secrets están en variables de entorno
- [ ] Validar que `.gitignore` está actualizado

### Antes del deploy:
- [ ] Configurar variables de entorno en la plataforma
- [ ] Verificar URLs de frontend/backend
- [ ] Probar conexión a base de datos
- [ ] Confirmar configuración CORS

## 🆘 En caso de emergencia

### Si commiteaste un archivo .env por error:
```bash
# 1. Eliminar del repositorio (conserva archivo local)
git rm --cached .env

# 2. Agregar al .gitignore si no está
echo ".env" >> .gitignore

# 3. Commitear la corrección
git add .gitignore
git commit -m "🔒 Eliminar archivo .env del repositorio"

# 4. CAMBIAR TODAS LAS CONTRASEÑAS/TOKENS expuestos
# 5. Push para actualizar el repositorio remoto
git push
```

### Si expusiste secretos en GitHub:
1. **Cambiar inmediatamente** todos los secretos expuestos
2. Revocar tokens de API
3. Generar nuevas contraseñas
4. Contactar al administrador de sistemas si es necesario

## 📚 Recursos Adicionales

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Django Security Best Practices](https://docs.djangoproject.com/en/5.1/topics/security/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Recuerda**: La seguridad es responsabilidad de todo el equipo. Cuando tengas dudas, pregunta antes de commitear.
