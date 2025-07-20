import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { decryptData } from '../utils/security';

const NavBar = () => {
  const navigate = useNavigate();
  const encryptedSession = localStorage.getItem('user');
  const session = encryptedSession ? decryptData(encryptedSession) : null;
  const role = session?.user?.rol?.roleEnum || '';
  const userName = session?.user?.name || 'Usuario';

  if (!session) {
    return null;
  }

  const getMenuItems = () => {
    const items = [];

    if (role === 'ADMIN') {
      items.push(
        {
          label: 'Registrar Profesor',
          icon: 'pi pi-user-plus',
          command: () => { navigate('/registerteacher'); }
        },
        {
          label: 'Categorías',
          icon: 'pi pi-tags',
          command: () => { navigate('/admin/categories'); }
        },
        {
          label: 'Ver Usuarios',
          icon: 'pi pi-users',
          command: () => { navigate('/admin/users'); } 
        }
      );
    }

    if (role === 'TEACHER') {
      items.push(
        {
          label: 'Mis Cursos',
          icon: 'pi pi-book',
          command: () => { navigate('/teacher/courses'); }
        }
      );
    }

    if (role === 'STUDENT') {
      items.push(
        {
          label: 'Mi Test',
          icon: 'pi pi-file-edit',
          command: () => { navigate('/test'); }
        }
      );
    }

    return items;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login'; 
  };

  const endContent = (
    <div style={{ display: 'flex', alignItems: 'center' }}>

      <span className="p-mr-2" style={{marginRight: '1rem'}}>Hola, {userName}</span>
      <Button 
        label="Mi Perfil" 
        icon="pi pi-user" 
        className="p-button-text p-button-secondary" 
        onClick={() => navigate('/profile')} 
        style={{ marginRight: '1rem' }} 
      />
      <Button 
        label="Cerrar Sesión" 
        icon="pi pi-sign-out" 
        className="p-button-text" 
        onClick={handleLogout} 
      />
    </div>

    
  );

  return (
    <div className="card">
      <Menubar model={getMenuItems()} end={endContent} />
    </div>
  );
};

export default NavBar;