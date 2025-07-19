import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContext } from '../../contexts/ToastContext';
import authService from '../../services/authService';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';

const Register = () => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      showToast('warn', 'Advertencia', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);

    const userData = { name, lastName, surname, email, password, role: 'STUDENT' };

    try {
      await authService.register(userData);
      showToast('success', '¡Registro Exitoso!', 'Serás redirigido para iniciar sesión.');
      setName('');
      setLastName('');
      setSurname('');
      setEmail('');
      setPassword('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.text || 'Error al registrar. Revisa los datos.';
      showToast('error', 'Error en el Registro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cardFooter = (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <span>¿Ya tienes una cuenta? </span>
      <Link to="/login">Inicia sesión aquí</Link>
    </div>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card title="Crear una Cuenta" style={{ width: '25rem', padding: '1rem' }} footer={cardFooter}>
        <form onSubmit={handleRegister} className="p-fluid">
          
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
              <label htmlFor="name">Nombre(s)</label>
            </span>
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <label htmlFor="lastName">Apellido Paterno</label>
            </span>
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
              <label htmlFor="surname">Apellido Materno</label>
            </span>
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
            label={loading ? 'Registrando...' : 'Registrarse'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
            disabled={loading} 
            className="p-mt-2" 
          />
        </form>
      </Card>
    </div>
  );
};

export default Register;