import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ToastContext } from '../../contexts/ToastContext';

const EditUserModal = ({ user, visible, onHide, onSave }) => {
  // --- ESTADOS ---
  const [formData, setFormData] = useState({ name: '', lastName: '', surname: '', email: '', phone: '' });
  const [formErrors, setFormErrors] = useState({});
  const { showToast } = useContext(ToastContext);

  // Cuando el 'user' cambia, llena el formulario y resetea los errores
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        lastName: user.lastName || '',
        surname: user.surname || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
    setFormErrors({}); // Limpia los errores al abrir o cambiar de usuario
  }, [user]);

  // --- VALIDACIÓN ---
  const validateForm = () => {
    const errors = {};
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(formData.name)) errors.name = "El nombre solo puede contener letras y espacios (2-30 caracteres).";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(formData.lastName)) errors.lastName = "El apellido paterno es inválido.";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/.test(formData.surname)) errors.surname = "El apellido materno es inválido.";
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "El formato del correo no es válido.";
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) errors.phone = "El teléfono debe tener exactamente 10 dígitos.";
    
    setFormErrors(errors);
    // Devuelve true si no hay errores, false si los hay
    return Object.keys(errors).length === 0;
  };
  
  // --- MANEJADORES ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    // Si la validación no pasa, detiene el proceso
    if (!validateForm()) {
      showToast('error', 'Error de Validación', 'Por favor, corrige los campos marcados.');
      return;
    }
    // Si la validación es exitosa, llama a la función onSave del padre
    onSave(user.id, formData);
  };

  const footerContent = (
    <div>
      <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
      <Button label="Guardar Cambios" icon="pi pi-check" onClick={handleSaveChanges} autoFocus />
    </div>
  );

  return (
    <Dialog 
      header={`Editando a ${user?.name || 'Usuario'}`} 
      visible={visible} 
      style={{ width: '50vw', minWidth: '350px' }} 
      onHide={onHide} 
      footer={footerContent}
      modal 
    >
      {user && (
        <div className="p-fluid">
          {/* Campo Nombre */}
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="name">Nombre</label>
            <InputText id="name" name="name" value={formData.name} onChange={handleInputChange} className={formErrors.name ? 'p-invalid' : ''} />
            {formErrors.name && <small className="p-error">{formErrors.name}</small>}
          </div>

          {/* Campo Apellido Paterno */}
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="lastName">Apellido Paterno</label>
            <InputText id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className={formErrors.lastName ? 'p-invalid' : ''} />
            {formErrors.lastName && <small className="p-error">{formErrors.lastName}</small>}
          </div>

          {/* Campo Apellido Materno */}
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="surname">Apellido Materno</label>
            <InputText id="surname" name="surname" value={formData.surname} onChange={handleInputChange} className={formErrors.surname ? 'p-invalid' : ''} />
            {formErrors.surname && <small className="p-error">{formErrors.surname}</small>}
          </div>
          
          {/* Campo Email */}
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email">Email</label>
            <InputText id="email" name="email" value={formData.email} onChange={handleInputChange} className={formErrors.email ? 'p-invalid' : ''} />
            {formErrors.email && <small className="p-error">{formErrors.email}</small>}
          </div>

          {/* Campo Teléfono */}
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="phone">Teléfono</label>
            <InputText id="phone" name="phone" value={formData.phone} onChange={handleInputChange} keyfilter="int" className={formErrors.phone ? 'p-invalid' : ''} />
            {formErrors.phone && <small className="p-error">{formErrors.phone}</small>}
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default EditUserModal;