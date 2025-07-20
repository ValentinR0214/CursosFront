import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader, decryptData, encryptData } from '../../utils/security';

const API_URL = 'http://localhost:8080/api/users';

const UserProfile = () => {
  const getInitialUser = () => {
    const encryptedSession = localStorage.getItem('user');
    return encryptedSession ? decryptData(encryptedSession)?.user : null;
  };
  const [user, setUser] = useState(getInitialUser());
  const [profileFormData, setProfileFormData] = useState({ name: '', lastName: '', surname: '', email: '', phone: '' });
  const [profileFormErrors, setProfileFormErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordFormErrors, setPasswordFormErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    if (user) {
      setProfileFormData({
        name: user.name || '',
        lastName: user.lastName || '',
        surname: user.surname || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);
  const validateProfileForm = (data) => {
    const errors = {};
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(data.name)) errors.name = "El nombre solo puede contener letras y espacios (2-30 caracteres).";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(data.lastName)) errors.lastName = "El apellido paterno solo puede contener letras y espacios (2-30 caracteres).";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(data.surname)) errors.surname = "El apellido materno solo puede contener letras y espacios (2-30 caracteres).";
    if (!/^\d{10}$/.test(data.phone)) errors.phone = "El teléfono debe tener exactamente 10 dígitos.";
    if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = "El formato del correo no es válido.";
    return errors;
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileFormErrors({});
    const errors = validateProfileForm(profileFormData);
    if (Object.keys(errors).length > 0) {
      setProfileFormErrors(errors);
      showToast('error', 'Error de Validación', 'Corrige los campos de tu perfil.');
      return;
    }

    setProfileLoading(true);
    try {
      await axios.put(`${API_URL}/${user.id}`, profileFormData, { headers: getAuthHeader() });
      const encryptedSession = localStorage.getItem('user');
      if (encryptedSession) {
        const session = decryptData(encryptedSession);
        const updatedUser = { ...session.user, ...profileFormData };
        const updatedSession = { ...session, user: updatedUser };
        localStorage.setItem('user', encryptData(updatedSession));
        setUser(updatedUser);
      }
      showToast('success', 'Éxito', 'Tu perfil ha sido actualizado.');
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || 'No se pudo actualizar el perfil.');
    } finally {
      setProfileLoading(false);
    }
  };
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordRegex.test(passwordFormData.newPassword)) {
      errors.newPassword = "Contraseña inválida. Debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo.";
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
    return errors;
  };
  
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordFormErrors({});
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordFormErrors(errors);
      showToast('error', 'Error de Validación', 'Corrige los campos de contraseña.');
      return;
    }

    setPasswordLoading(true);
    try {
      await axios.put(`${API_URL}/password`, { newPassword: passwordFormData.newPassword }, { headers: getAuthHeader() });
      showToast('success', 'Éxito', 'Contraseña actualizada.');
      setPasswordFormData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Card title="Error de Sesión" style={{ margin: '2rem' }}>
        <p>No se pudo cargar la información del perfil. Por favor, intenta iniciar sesión de nuevo.</p>
        <Button label="Ir a Login" icon="pi pi-sign-in" onClick={() => window.location.href = '/login'} />
      </Card>
    );
  }

  const roleTag = (
    <Tag 
      severity={user.rol.roleEnum === 'ADMIN' ? 'info' : (user.rol.roleEnum === 'TEACHER' ? 'warning' : 'primary')}
      value={user.rol.roleEnum}
    />
  );
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <Card title="Mi Perfil" style={{ width: '40rem' }} header={roleTag}>
        {/* --- FORMULARIO 1: EDITAR PERFIL --- */}
        <form onSubmit={handleUpdateProfile} className="p-fluid">
          <p className="p-text-secondary">Aquí puedes ver y editar tu información personal.</p>
          <div className="p-grid p-formgrid" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <div className="p-field p-col" style={{ flex: 1, minWidth: '200px' }}>
              <label htmlFor="name">Nombre</label>
              <InputText id="name" name="name" value={profileFormData.name} onChange={handleProfileInputChange} className={profileFormErrors.name ? 'p-invalid' : ''} />
              {profileFormErrors.name && <small className="p-error">{profileFormErrors.name}</small>}
            </div>
            <div className="p-field p-col" style={{ flex: 1, minWidth: '200px' }}>
              <label htmlFor="lastName">Apellido Paterno</label>
              <InputText id="lastName" name="lastName" value={profileFormData.lastName} onChange={handleProfileInputChange} className={profileFormErrors.lastName ? 'p-invalid' : ''} />
              {profileFormErrors.lastName && <small className="p-error">{profileFormErrors.lastName}</small>}
            </div>
          </div>
          <div className="p-field" style={{ marginTop: '1.5rem' }}>
            <label htmlFor="surname">Apellido Materno</label>
            <InputText id="surname" name="surname" value={profileFormData.surname} onChange={handleProfileInputChange} className={profileFormErrors.surname ? 'p-invalid' : ''} />
            {profileFormErrors.surname && <small className="p-error">{profileFormErrors.surname}</small>}
          </div>
          <div className="p-field" style={{ marginTop: '1.5rem' }}>
            <label htmlFor="email">Email</label>
            <InputText id="email" name="email" value={profileFormData.email} onChange={handleProfileInputChange} className={profileFormErrors.email ? 'p-invalid' : ''} />
            {profileFormErrors.email && <small className="p-error">{profileFormErrors.email}</small>}
          </div>
          <div className="p-field" style={{ marginTop: '1.5rem' }}>
            <label htmlFor="phone">Teléfono</label>
            <InputText id="phone" name="phone" value={profileFormData.phone} keyfilter="int" onChange={handleProfileInputChange} className={profileFormErrors.phone ? 'p-invalid' : ''} />
            {profileFormErrors.phone && <small className="p-error">{profileFormErrors.phone}</small>}
          </div>
          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <Button type="submit" label={profileLoading ? 'Guardando...' : 'Guardar Cambios'} icon={profileLoading ? 'pi pi-spin pi-spinner' : 'pi pi-save'} disabled={profileLoading} />
          </div>
        </form>

        <Divider align="center" type="solid" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <i className="pi pi-key"></i>
        </Divider>

        {/* --- FORMULARIO 2: CAMBIAR CONTRASEÑA --- */}
        <form onSubmit={handleChangePassword} className="p-fluid">
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="newPassword">Nueva Contraseña</label>
            <Password id="newPassword" name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordInputChange} toggleMask feedback={false} className={passwordFormErrors.newPassword ? 'p-invalid' : ''} />
            {passwordFormErrors.newPassword && <small className="p-error">{passwordFormErrors.newPassword}</small>}
          </div>
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
            <Password id="confirmPassword" name="confirmPassword" value={passwordFormData.confirmPassword} onChange={handlePasswordInputChange} toggleMask feedback={false} className={passwordFormErrors.confirmPassword ? 'p-invalid' : ''} />
            {passwordFormErrors.confirmPassword && <small className="p-error">{passwordFormErrors.confirmPassword}</small>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <Button type="submit" label={passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña'} icon="pi pi-check" disabled={passwordLoading} />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UserProfile;