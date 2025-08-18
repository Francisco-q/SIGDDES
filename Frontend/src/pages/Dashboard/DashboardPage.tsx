import React from 'react';
import { Layout } from '../../shared/components/layout/Layout';

interface DashboardPageProps {
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  return (
    <Layout
      sidebar={
        <div style={{ width: '280px', backgroundColor: '#f5f5f5', padding: '16px' }}>
          {/* TODO: Migrar AppSidebar aquí */}
          <div>
            <h3>SIGDDES</h3>
            <button onClick={onLogout}>Cerrar Sesión</button>
          </div>
        </div>
      }
    >
      <div>
        <h1>Dashboard Principal</h1>
        {/* TODO: Migrar DashboardDenuncias aquí */}
        <p>Contenido del dashboard en migración...</p>
      </div>
    </Layout>
  );
};
