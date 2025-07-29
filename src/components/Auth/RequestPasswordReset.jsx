import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ToastContext } from '../../contexts/ToastContext';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8080/cursos/auth/password/request-reset';

const RequestPasswordReset = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useContext(ToastContext);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      showToast('warn', 'Campo Requerido', 'Por favor, ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);

    try {
      await axios.post(API_URL, null, { params: { email } });
      showToast('success', 'Petición Enviada', 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.');
      setEmail('');
    } catch (err) {
      // Aunque el backend siempre devuelve éxito, manejamos un error de red por si acaso.
      showToast('error', 'Error', 'No se pudo procesar la solicitud. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
      <Link to="/login">Volver a Iniciar Sesión</Link>
    </div>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card title="Recuperar Contraseña" style={{ width: '25rem' }} footer={footer}>
        <p className="p-text-secondary" style={{ marginBottom: '2rem' }}>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
        <form onSubmit={handleRequest} className="p-fluid">
          <div className="p-field">
            <span className="p-float-label">
              <InputText id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label htmlFor="email">Correo Electrónico</label>
            </span>
          </div>
          <Button type="submit" label={loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'} disabled={loading} style={{ marginTop: '1.5rem' }} />
        </form>
      </Card>
    </div>
  );
};

export default RequestPasswordReset;