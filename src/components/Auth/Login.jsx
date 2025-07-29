import React, { useState, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [formErrors, setFormErrors] = useState({});
  
  const { showToast } = useContext(ToastContext);
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const validateForm = () => {
    const errors = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Por favor, ingresa un correo válido.";
    }
    if (!password.trim()) {
      errors.password = "Por favor, ingresa tu contraseña.";
    }
    return errors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('error', 'Campos Inválidos', 'Por favor, revisa la información ingresada.');
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
      localStorage.setItem('user', encryptedData);
      
      if (redirectPath) {
        window.location.href = redirectPath;
      } else {
        const role = response.data?.user?.rol?.roleEnum;
        switch (role.toUpperCase()) {
          case 'ADMIN':
            window.location.href = '/admin/users'; 
            break;
          case 'STUDENT':
            window.location.href = '/student/my-courses';
            break;
          case 'TEACHER':
            window.location.href = '/teacher/courses';
            break;
          default:
            showToast('error', 'Error', `Rol "${role}" no reconocido.`);
            localStorage.removeItem('user');
            break;
        }
      }

    } catch (err) {
      if (!err.response) {
        showToast('error', 'Error de Red', 'No se pudo conectar con el servidor.');
        setLoading(false);
        return;
      }

      const apiMessage = err.response.data?.message || 'Credenciales inválidas.';
      const statusCode = err.response.status;

      if (statusCode === 403) {
        showToast('error', 'Cuenta Bloqueada', apiMessage, { life: 5000 }); 
      } else { 
        showToast('warn', 'Error de Autenticación', apiMessage);
      }

    } finally {
      setLoading(false);
    }
  };

  const cardFooter = (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <span>¿No tienes una cuenta? </span>
      <Link to={`/register${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}>
        Regístrate aquí
      </Link>
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
                className={formErrors.email ? 'p-invalid' : ''}
              />
              <label htmlFor="email">Correo Electrónico</label>
            </span>
            {formErrors.email && <small className="p-error">{formErrors.email}</small>}
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <Password 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                toggleMask 
                feedback={false}
                className={formErrors.password ? 'p-invalid' : ''}
              />
              <label htmlFor="password">Contraseña</label>
            </span>
            {formErrors.password && <small className="p-error">{formErrors.password}</small>}
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