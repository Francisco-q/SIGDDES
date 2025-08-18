# 🔄 Plan de Migración a Screaming Architecture - SIGDDES

**Versión:** v1.0.0  
**Fecha:** 18 de Agosto, 2025  
**Estado:** ✅ Estructura Base Creada  

---

## 📁 **NUEVA ESTRUCTURA IMPLEMENTADA**

```
Frontend/src/
├── features/                    # 🎯 DOMINIO DEL NEGOCIO SIGDDES
│   ├── auth/                   # 🔐 Autenticación y autorización
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── qr-navigation/          # 📱 Navegación QR (Tótems y Recepciones)
│   │   ├── components/
│   │   │   ├── QRPointsListContainer.tsx
│   │   │   ├── QRPointsListPresentation.tsx
│   │   │   ├── TotemCard.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useQRPoints.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── routes-management/      # 🗺️ Gestión de rutas y paths
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── incident-reports/       # 📋 Denuncias de violencia de género
│   │   ├── components/
│   │   ├── hooks/
│   │   │   ├── useIncidentReports.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── campus-management/      # 🏫 Gestión de campus
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── users/                  # 👥 Gestión de usuarios
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── index.ts
├── shared/                     # 🔧 HERRAMIENTAS COMUNES
│   ├── components/
│   │   ├── ui/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── layout/            # 📐 Componentes de layout
│   │   ├── maps/              # 🗺️ Componentes de mapas
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAsyncOperation.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── apiService.ts      # Servicio API genérico
│   │   └── index.ts
│   └── index.ts
└── pages/                      # 📄 RUTAS DE LA APLICACIÓN
    └── [pending]
```

---

## ✅ **COMPONENTES YA IMPLEMENTADOS**

### 🎯 **QR Navigation Feature**
- ✅ `useQRPoints` hook - Manejo de Tótems y Recepciones QR
- ✅ `QRPointsListContainer` - Contenedor con lógica
- ✅ `QRPointsListPresentation` - UI pura
- ✅ `TotemCard` - Componente de tarjeta para tótems

### 🔧 **Shared Components**
- ✅ `LoadingSpinner` - Spinner de carga reutilizable
- ✅ `Card` - Componente base de tarjeta
- ✅ `Button` - Botón con variantes y estados
- ✅ `useAsyncOperation` - Hook para operaciones asíncronas
- ✅ `apiService` - Servicio API genérico

### 📋 **Incident Reports Feature**
- ✅ `useIncidentReports` - Hook para manejo de denuncias
- ✅ `Denuncia` interface - Tipado para denuncias

---

## 🔄 **PRÓXIMOS PASOS DE MIGRACIÓN**

### **FASE 1: Migrar Componentes Existentes (PRIORITARIO)**

#### 1.1 **Auth Feature** 
```bash
# Mover desde: src/components/login/
# Hacia: src/features/auth/components/
- LoginContainer.tsx
- LoginFormPresentation.tsx  
- RegisterContainer.tsx
- RegisterFormPresentation.tsx
```

#### 1.2 **Maps Components**
```bash
# Mover desde: src/components/open_map/
# Hacia: src/shared/components/maps/
- MapContainer.tsx
- MapPresentation.tsx
- (otros componentes de mapa)
```

#### 1.3 **Dashboard Components**
```bash  
# Mover desde: src/components/dashboard/
# Hacia: Features específicas según funcionalidad
```

### **FASE 2: Crear Nuevas Features**

#### 2.1 **Routes Management Feature**
- `useRoutes` hook
- `PathsListContainer/Presentation`
- `PathCard` component
- `RouteVisualization` component

#### 2.2 **Campus Management Feature**  
- `useCampus` hook
- `CampusSelector` component
- `CampusConfiguration` component

#### 2.3 **Users Feature**
- `useUsers` hook
- `UserProfile` components
- `UserManagement` components

### **FASE 3: Migrar Pages**

#### 3.1 **Crear estructura Pages**
```typescript
pages/
├── Auth/
│   ├── Login.tsx
│   └── Register.tsx
├── Dashboard/
│   └── Dashboard.tsx
├── QRNavigation/
│   ├── QRPoints.tsx
│   └── QRManagement.tsx
├── IncidentReports/
│   ├── ReportForm.tsx
│   └── ReportsList.tsx
└── Routes/
    ├── RoutesMap.tsx
    └── RoutesManagement.tsx
```

### **FASE 4: Layout y Navegación**

#### 4.1 **Layout Components**
```typescript
shared/components/layout/
├── Header.tsx
├── Sidebar.tsx
├── Navigation.tsx
└── Layout.tsx
```

#### 4.2 **Routing Configuration**
- Migrar routing a usar nuevas pages
- Implementar lazy loading por feature

---

## 📋 **COMANDOS DE MIGRACIÓN**

### **Script para mover archivos existentes:**
```bash
# Ejemplo para auth
mkdir -p src/features/auth/components
mv src/components/login/* src/features/auth/components/

# Ejemplo para maps  
mkdir -p src/shared/components/maps
mv src/components/open_map/* src/shared/components/maps/
```

### **Actualizar imports:**
```typescript
// ANTES:
import LoginComponent from '../components/login/LoginComponent';

// DESPUÉS:
import { LoginContainer } from '../features/auth';
```

---

## 🎯 **BENEFICIOS ESPERADOS**

### **Inmediatos:**
- ✅ Código más organizado por dominio
- ✅ Fácil ubicación de funcionalidades
- ✅ Componentes reutilizables centralizados

### **A mediano plazo:**
- 🔄 Desarrollo más rápido de nuevas features
- 🔄 Easier testing y debugging
- 🔄 Mejor colaboración en equipo
- 🔄 Mantenimiento simplificado

### **A largo plazo:**
- 🚀 Escalabilidad mejorada
- 🚀 Performance optimizado (lazy loading)
- 🚀 Código más mantenible
- 🚀 Onboarding de desarrolladores más rápido

---

## 📝 **REGLAS DE MIGRACIÓN**

### **DO's:**
- ✅ Mantener el patrón Container/Presentation
- ✅ Usar hooks para lógica de negocio
- ✅ Tipear todas las interfaces
- ✅ Probar cada componente migrado
- ✅ Actualizar imports gradualmente

### **DON'Ts:**
- ❌ No mover todo de una vez
- ❌ No romper funcionalidad existente
- ❌ No crear dependencias circulares
- ❌ No duplicar lógica entre features

---

## 🔍 **VALIDACIÓN DE MIGRACIÓN**

### **Checklist por Feature:**
- [ ] ✅ Estructura de carpetas creada
- [ ] ✅ Hooks implementados y funcionando  
- [ ] ✅ Componentes Container/Presentation separados
- [ ] ✅ Exports en index.ts configurados
- [ ] ✅ Types importados correctamente
- [ ] ✅ No hay dependencias circulares
- [ ] ✅ Tests actualizados (si existen)

---

## 📋 **METADATA DEL DOCUMENTO**

**Documento:** MIGRATION_PLAN.md  
**Proyecto:** SIGDDES - SafeVG Navigation System  
**Arquitectura Target:** Screaming Architecture v2.0.0  
**Fecha de Creación:** 18 de Agosto, 2025  
**Responsable:** Development Team  
**Estado:** 🔄 En progreso - Estructura base implementada  
**Próxima Revisión:** Con cada fase completada
