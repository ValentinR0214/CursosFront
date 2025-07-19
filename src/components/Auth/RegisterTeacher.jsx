import React, { useState, useContext } from 'react'; 
import axios from 'axios';
import { getAuthHeader } from '../../utils/security';
import { ToastContext } from '../../contexts/ToastContext'; 
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';

const RegisterTeacher = () => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useContext(ToastContext);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      showToast('warn', 'Advertencia', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);

    const teacherData = { name, lastName, surname, email, password, role: 'TEACHER' };

    try {
      const API_URL = 'http://localhost:8080/api/users/register/teacher';
      await axios.post(API_URL, teacherData, { headers: getAuthHeader() });
      showToast('success', 'Éxito', 'Profesor registrado correctamente.');
      setName('');
      setLastName('');
      setSurname('');
      setEmail('');
      setPassword('');

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al registrar al profesor.';
      showToast('error', 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card title="Registrar Nuevo Profesor" style={{ width: '25rem', padding: '1rem' }}>
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
            label={loading ? 'Registrando...' : 'Registrar'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-user-plus'}
            disabled={loading} 
            className="p-mt-2" 
          />
        </form>
      </Card>
    </div>
  );
};

export default RegisterTeacher;