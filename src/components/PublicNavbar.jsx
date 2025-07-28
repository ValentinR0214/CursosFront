import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';

const PublicNavBar = () => {
  const navigate = useNavigate();

  // Contenido final de la barra: botones de Login y Registro (sin cambios)
  const endContent = (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button 
        label="Iniciar Sesión" 
        icon="pi pi-sign-in" 
        className="p-button-text" 
        onClick={() => navigate('/login')} 
      />
      <Button 
        label="Registrarse" 
        icon="pi pi-user-plus" 
        className="p-button-text" 
        onClick={() => navigate('/register')} 
      />
    </div>
  );
  
  // El "start" de Menubar: logo o nombre de la app
  const startContent = (
    // --- 1. CAMBIO AQUÍ ---
    // Ahora, al hacer clic en el logo, siempre te llevará al catálogo de cursos.
    <span 
      style={{ fontWeight: 'bold', fontSize: '1.5rem', cursor: 'pointer' }} 
      onClick={() => navigate('/courses')}
    >
      Meli+
    </span>
  );

  return (
    <div className="card">
      <Menubar 
        start={startContent}
        end={endContent} 
      />
    </div>
  );
};

export default PublicNavBar;