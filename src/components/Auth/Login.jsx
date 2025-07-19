import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ToastContext } from '../../contexts/ToastContext';
import authService from '../../services/authService';
import { encryptData } from '../../utils/security';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useContext(ToastContext);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast('warn', 'Advertencia', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ email, password });

      if (!response || !response.data) {
        showToast('error', 'Error', 'Respuesta inesperada del servidor.');
        setLoading(false);
        return;
      }
      
      const encryptedData = encryptData(response.data);
      if (!encryptedData) {
        showToast('error', 'Error', 'No se pudo asegurar la sesión.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('user', encryptedData);
      
      const role = response.data?.user?.rol?.roleEnum;
      if (!role) {
        showToast('error', 'Error', 'Los datos del usuario recibidos son incorrectos.');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }
      switch (role.toUpperCase()) {
        case 'ADMIN':
          window.location.href = '/admin/users'; 
          break;
        case 'STUDENT':
          window.location.href = '/test';
          break;
        case 'TEACHER':
          window.location.href = '/teacher/my-courses'; 
          break;
        default:
          showToast('error', 'Error', `Rol "${role}" no reconocido.`);
          localStorage.removeItem('user');
          break;
      }

    } catch (err) {
      const apiError = err.response?.data?.message || err.response?.data?.text || 'Credenciales inválidas.';
      showToast('error', 'Error de Autenticación', apiError);
    } finally {
      setLoading(false);
    }
  };

  const cardFooter = (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <span>¿No tienes una cuenta? </span>
      <Link to="/register">Regístrate aquí</Link>
    </div>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card title="Iniciar Sesión" style={{ width: '25rem', padding: '1rem' }} footer={cardFooter}>
        <form onSubmit={handleLogin} className="p-fluid">

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <label htmlFor="email">Correo Electrónico</label>
            </span>
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <Password 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                toggleMask 
                feedback={false}
              />
              <label htmlFor="password">Contraseña</label>
            </span>
          </div>

          <Button 
            type="submit" 
            label={loading ? 'Iniciando...' : 'Iniciar Sesión'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
            disabled={loading} 
            className="p-mt-2" 
          />
        </form>
      </Card>
    </div>
  );
};

export default Login;