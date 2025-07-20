import React, { useState, useContext } from 'react';
import axios from 'axios';
import { getAuthHeader } from '../../utils/security';
import { ToastContext } from '../../contexts/ToastContext';

// --- Importaciones de Componentes de PrimeReact ---
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';

const RegisterTeacher = () => {
  // --- ESTADOS DEL FORMULARIO ---
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Añadido campo de teléfono
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // Estado para los errores
  const { showToast } = useContext(ToastContext);

  // --- LÓGICA DE VALIDACIÓN ---
  const validateForm = () => {
    const errors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(name)) errors.name = "El nombre es inválido.";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(lastName)) errors.lastName = "El apellido paterno es inválido.";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(surname)) errors.surname = "El apellido materno es inválido.";
    if (!/^\d{10}$/.test(phone)) errors.phone = "El teléfono debe tener 10 dígitos.";
    if (!/\S+@\S+\.\S+/.test(email)) errors.email = "El correo no es válido.";
    if (!passwordRegex.test(password)) errors.password = "La contraseña es inválida (mín. 8 caracteres, mayúscula, minúscula, número y símbolo).";
    
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormErrors({}); // Limpia errores previos

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('error', 'Error de Validación', 'Por favor, corrige los campos marcados.');
      return; // Detiene el envío si hay errores
    }

    setLoading(true);

    const teacherData = { name, lastName, surname, email, phone, password, role: 'TEACHER' };

    try {
      const API_URL = 'http://localhost:8080/api/users/register/teacher';
      await axios.post(API_URL, teacherData, { headers: getAuthHeader() });
      
      showToast('success', 'Éxito', 'Profesor registrado correctamente.');
      
      // Limpia todos los campos del formulario
      setName('');
      setLastName('');
      setSurname('');
      setEmail('');
      setPhone('');
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
          {/* --- JSX con campos de validación --- */}
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} className={formErrors.name ? 'p-invalid' : ''} />
              <label htmlFor="name">Nombre(s)</label>
            </span>
            {formErrors.name && <small className="p-error">{formErrors.name}</small>}
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={formErrors.lastName ? 'p-invalid' : ''} />
              <label htmlFor="lastName">Apellido Paterno</label>
            </span>
            {formErrors.lastName && <small className="p-error">{formErrors.lastName}</small>}
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} className={formErrors.surname ? 'p-invalid' : ''} />
              <label htmlFor="surname">Apellido Materno</label>
            </span>
            {formErrors.surname && <small className="p-error">{formErrors.surname}</small>}
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formErrors.email ? 'p-invalid' : ''} />
              <label htmlFor="email">Correo Electrónico</label>
            </span>
            {formErrors.email && <small className="p-error">{formErrors.email}</small>}
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <InputText id="phone" keyfilter="int" value={phone} onChange={(e) => setPhone(e.target.value)} className={formErrors.phone ? 'p-invalid' : ''} />
              <label htmlFor="phone">Teléfono</label>
            </span>
            {formErrors.phone && <small className="p-error">{formErrors.phone}</small>}
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <Password id="password" value={password} onChange={(e) => setPassword(e.target.value)} toggleMask feedback={false} className={formErrors.password ? 'p-invalid' : ''} />
              <label htmlFor="password">Contraseña</label>
            </span>
            {formErrors.password && <small className="p-error">{formErrors.password}</small>}
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