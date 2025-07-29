import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Card } from 'primereact/card';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { ToastContext } from '../../contexts/ToastContext';

const API_URL = 'http://localhost:8080/cursos/auth/password/reset';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      showToast('error', 'Error', 'No se proporcionó un token de recuperación en la URL.');
    }
  }, [token, showToast]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      showToast('error', 'Error de Validación', 'Las contraseñas no coinciden.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      showToast('warn', 'Contraseña Débil', 'La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo.');
      return;
    }

    setLoading(true);
    const resetData = { token, newPassword };

    try {
      await axios.post(API_URL, resetData);
      showToast('success', 'Éxito', 'Tu contraseña ha sido restablecida. Serás redirigido para iniciar sesión.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      showToast('error', 'Error', 'El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.');
      setIsValidToken(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Card title="Enlace Inválido o Expirado">
          <p>Este enlace para restablecer la contraseña ya no es válido.</p>
          <Button label="Solicitar un Nuevo Enlace" onClick={() => navigate('/request-password-reset')} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card title="Restablecer Contraseña" style={{ width: '25rem' }}>
        <form onSubmit={handleReset} className="p-fluid">
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <Password id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} toggleMask feedback={false} />
              <label htmlFor="newPassword">Nueva Contraseña</label>
            </span>
          </div>
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <span className="p-float-label">
              <Password id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} toggleMask feedback={false} />
              <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
            </span>
          </div>
          <Button type="submit" label={loading ? 'Restableciendo...' : 'Restablecer Contraseña'} disabled={loading} className="p-mt-2" />
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;