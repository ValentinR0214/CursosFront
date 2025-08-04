import React, { useState, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ToastContext } from '../../contexts/ToastContext';
import authService from '../../services/authService';
import { encryptData, getAuthHeader } from '../../utils/security';
import axios from 'axios';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';

const API_BASE_URL = 'http://localhost:8080';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const { showToast } = useContext(ToastContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirectPath = searchParams.get('redirect');
  const enrollCourseId = searchParams.get('enrollCourseId');

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
        throw new Error('Respuesta inesperada del servidor.');
      }
      
      const encryptedData = encryptData(response.data);
      localStorage.setItem('user', encryptedData);
      
      if (enrollCourseId) {
        showToast('info', 'Completando Inscripción', 'Un momento, te estamos inscribiendo...');
        try {
          await axios.post(`${API_BASE_URL}/api/courses/enroll`, 
            { courseId: enrollCourseId }, 
            { headers: getAuthHeader() }
          );
          window.location.href = `/student/course/${enrollCourseId}/view`;
        } catch (enrollError) {
          showToast('warn', 'Atención', 'No se pudo completar la inscripción (quizás ya estabas inscrito).');
          window.location.href = '/student/my-courses';
        }
      } else if (redirectPath) {
        window.location.href = redirectPath;
      } else {
        const role = response.data?.user?.rol?.roleEnum;
        switch (role.toUpperCase()) {
          case 'ADMIN': window.location.href = '/admin/users'; break;
          case 'STUDENT': window.location.href = '/student/my-courses'; break;
          case 'TEACHER': window.location.href = '/teacher/courses'; break;
          default:
            showToast('error', 'Error', `Rol "${role}" no reconocido.`);
            localStorage.removeItem('user');
            setLoading(false); 
            break;
        }
      }
    } catch (err) {
      if (!err.response) {
        showToast('error', 'Error de Red', 'No se pudo conectar con el servidor.');
      } else {
        const apiMessage = err.response.data?.message || 'Credenciales inválidas.';
        const statusCode = err.response.status;
        if (statusCode === 403) {
          showToast('error', 'Cuenta Bloqueada', apiMessage, { life: 6000 });
        } else { 
          showToast('warn', 'Error de Autenticación', apiMessage);
        }
      }
      setLoading(false); 
    }
  };

  const cardFooter = (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <span>¿No tienes una cuenta? </span>
      <Link to={`/register${enrollCourseId ? `?enrollCourseId=${enrollCourseId}` : ''}`}>
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
          
          <div style={{ textAlign: 'right', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <Link to="/request-password-reset" style={{ fontSize: '0.9em' }}>
              ¿Olvidaste tu contraseña?
            </Link>
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