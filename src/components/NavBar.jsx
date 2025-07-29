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
        { label: 'Gestionar Usuarios', icon: 'pi pi-users', command: () => navigate('/admin/users') },
        { label: 'Gestionar Categorías', icon: 'pi pi-tags', command: () => navigate('/admin/categories') },
        { label: 'Registrar Profesor', icon: 'pi pi-user-plus', command: () => navigate('/registerteacher') }
      );
    }

    if (role === 'TEACHER') {
      items.push(
        { label: 'Mis Cursos', icon: 'pi pi-book', command: () => navigate('/teacher/courses') }
      );
    }

    if (role === 'STUDENT') {
      items.push(
        { label: 'Catálogo de Cursos', icon: 'pi pi-shopping-cart', command: () => navigate('/courses') },
        { label: 'Mis Cursos', icon: 'pi pi-book', command: () => navigate('/student/my-courses') },
        { label: 'Mi Test', icon: 'pi pi-file-edit', command: () => navigate('/test') }
      );
    }

    return items;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login'; 
  };

  const endContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className="p-mr-2">Hola, {userName}</span>
      <Button 
        label="Mi Perfil" 
        icon="pi pi-user" 
        className="p-button-text p-button-secondary" 
        onClick={() => navigate('/profile')} 
      />
      <Button 
        label="Cerrar Sesión" 
        icon="pi pi-sign-out" 
        className="p-button-text" 
        onClick={handleLogout} 
      />
    </div>
  );
  
  const startContent = (
    <span 
      style={{ fontWeight: 'bold', fontSize: '1.5rem', cursor: 'pointer', marginRight: '2rem' }} 
      onClick={() => navigate('/')} 
    >
      Meli+
    </span>
  );

  return (
    <div className="card">
      <Menubar model={getMenuItems()} start={startContent} end={endContent} />
    </div>
  );
};

export default NavBar;