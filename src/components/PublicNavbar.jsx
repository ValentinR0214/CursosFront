import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';

const PublicNavBar = () => {
  const navigate = useNavigate();

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
  
  const startContent = (
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