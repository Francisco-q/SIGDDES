# 🤖 Copilot Instructions - SIGDDES SafeVG

## 🎯 **Proyecto Overview**
SIGDDES es un **sistema de navegación SafeVG** para campus universitarios con funcionalidades de:
- **QR Navigation**: Tótems y recepciones QR para orientación en campus
- **Route Management**: Rutas y paths entre puntos de interés  
- **Incident Reports**: Sistema de denuncias de violencia de género
- **User Management**: Gestión de usuarios con roles (admin, user, guest)

## 🏗️ **Arquitectura: Screaming Architecture**

### **Features por Dominio (src/features/)**
```typescript
features/
├── qr-navigation/          // Tótems QR, Recepciones QR
├── routes-management/      // Paths, rutas campus
├── incident-reports/       // Denuncias violencia género  
├── auth/                   // Login, registro, JWT
├── campus-management/      // Gestión campus
└── users/                  // Perfiles, roles usuario
```

### **Patrón Container/Presentation Obligatorio**
```typescript
// CONTAINER: Lógica + datos
const QRPointsListContainer = () => {
  const { data, loading, error } = useQRPoints();
  return <QRPointsListPresentation data={data} loading={loading} />;
};

// PRESENTATION: Solo UI
const QRPointsListPresentation = ({ data, loading }) => (
  loading ? <LoadingSpinner /> : <QRPointsList data={data} />
);
```

## 📊 **Stack Técnico**
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Material-UI
- **Backend**: Django REST + JWT + PostgreSQL/SQLite
- **Maps**: Leaflet para visualización de campus
- **Estado**: Custom hooks + useState (NO Redux)

## 🎣 **Hooks Pattern**
```typescript
// useAsyncOperation: Hook base para operaciones async
// useQRPoints: QR tótems y recepciones  
// useIncidentReports: Denuncias
// usePuntos: Puntos en mapas (legacy)

const { data, loading, error, execute } = useAsyncOperation();
```

## 🔄 **Development Rules v2.0**

### **Commits Granulares**
- Un commit = Una funcionalidad específica
- Formato: `feat(qr-nav): add totem card component`
- Separar: models, components, hooks, pages

### **Estructura de Commits**
1. **Backend models** por app específica
2. **Frontend hooks** por feature  
3. **Components** Container + Presentation separados
4. **Pages** que conectan features con routing

## 📁 **Shared Components**
```typescript
shared/components/ui/         // Button, Card, LoadingSpinner
shared/components/layout/     // Header, Sidebar, Layout  
shared/components/maps/       // Map components para Leaflet
shared/hooks/                 // useAsyncOperation, etc
shared/services/              // apiService genérico
```

## 🎨 **UI Patterns**

### **TailwindCSS + Responsive Design**
```typescript
// Mobile-first approach
className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"

// Status indicators para QR
className="bg-green-100 text-green-800" // Operativo
className="bg-red-100 text-red-800"     // No Operativo
```

### **Loading States**
```typescript
if (loading) return <LoadingSpinner size="lg" />;
if (error) return <ErrorMessage message={error} />;
```

## 🔌 **API Integration**

### **Backend Endpoints Key**
```typescript
/api/totems/          // Tótems QR
/api/receptions/      // Recepciones QR  
/api/paths/           // Rutas campus
/api/denuncias/       // Incident reports
/api/upload-images/   // Image uploads
/api/generate-qr/     // QR generation
```

### **API Service Pattern**
```typescript
const { data } = await apiService.get<{results: TotemQR[]}>('/totems/');
const newTotem = await apiService.post<TotemQR>('/totems/', totemData);
```

## 🎯 **Domain Models Key**
```typescript
TotemQR: { id, name, latitude, longitude, campus, status, qr_image }
ReceptionQR: { id, name, latitude, longitude, campus, schedule }
Path: { id, name, points: PathPoint[], campus }
Denuncia: { nombre, email, tipo_incidente, fecha_incidente, campus }
```

## ⚡ **Performance**
- **Lazy loading** por feature planning
- **Image optimization** para QR codes y mapas
- **API calls** con useCallback para evitar re-renders
- **Campus filtering** para reducir datos cargados

## 🔒 **Security & Auth**
- **JWT** tokens para autenticación
- **Roles**: admin (full access), user (limited), guest (read-only)
- **Campus scoping**: usuarios ven solo su campus
- **Incident reports**: datos sensibles protegidos

## 🗂️ **File Naming**
- **Components**: PascalCase + descriptive (`TotemCard`, `QRPointsListContainer`)
- **Hooks**: camelCase + use prefix (`useQRPoints`, `useIncidentReports`)
- **Types**: PascalCase + domain (`TotemQR`, `Denuncia`)
- **Files**: feature-specific folders, index.ts exports

## 🔄 **Migration Status**
- ✅ Shared components base implementada
- ✅ QR Navigation feature estructura creada
- ✅ Incident Reports hooks implementados
- 🔄 Auth, Routes, Campus features pending migration
- 🔄 Pages layer pending implementation

## 🚨 **Code Conventions**
- **TypeScript strict mode** - no `any` types
- **Error boundaries** para features críticas  
- **Consistent imports** - prefer named exports
- **Comments en español** para domain logic
- **PropTypes** via TypeScript interfaces
- **CSS-in-JS** via TailwindCSS classes only
