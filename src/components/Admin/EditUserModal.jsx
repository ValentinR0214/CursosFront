import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

const EditUserModal = ({ user, visible, onHide, onSave }) => {
  
  const [formData, setFormData] = useState({ name: '', lastName: '', surname: '', email: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        lastName: user.lastName || '',
        surname: user.surname || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
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
      header="Editar Usuario" 
      visible={visible} 
      style={{ width: '50vw', minWidth: '350px' }} 
      onHide={onHide} 
      footer={footerContent}
      modal 
    >
      {user && (
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: '1rem' }}>
            <label htmlFor="name">Nombre</label>
            <InputText id="name" name="name" value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="p-field" style={{ marginBottom: '1rem' }}>
            <label htmlFor="lastName">Apellido Paterno</label>
            <InputText id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
          </div>
          <div className="p-field" style={{ marginBottom: '1-rem' }}>
            <label htmlFor="surname">Apellido Materno</label>
            <InputText id="surname" name="surname" value={formData.surname} onChange={handleInputChange} />
          </div>
          <div className="p-field" style={{ marginBottom: '1rem' }}>
            <label htmlFor="email">Email</label>
            <InputText id="email" name="email" value={formData.email} onChange={handleInputChange} />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default EditUserModal;