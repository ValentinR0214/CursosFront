import React, { useState, useEffect, useContext } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { ToastContext } from '../../contexts/ToastContext';

const CategoryModal = ({ category, visible, onHide, onSave }) => {
  const [formData, setFormData] = useState({ name: '', description: '', enabled: true });
  const [formErrors, setFormErrors] = useState({});
  const { showToast } = useContext(ToastContext);

  const isEditMode = category && category.id;

  useEffect(() => {
    setFormData(isEditMode ? { ...category } : { name: '', description: '', enabled: true });
    setFormErrors({});
  }, [category, visible]);

  const validate = () => {
    const errors = {};
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 \\-]{3,100}$/.test(formData.name)) {
      errors.name = "El nombre debe tener entre 3 y 100 caracteres (letras, números, espacios, guiones).";
    }
    if (formData.description && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ,.()!¡¿?\"'-]{0,255}$/.test(formData.description)) {
      errors.description = "La descripción contiene caracteres inválidos o excede los 255 caracteres.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveClick = () => {
    if (validate()) {
      onSave(formData);
    } else {
      showToast('error', 'Error de Validación', 'Corrige los campos marcados.');
    }
  };

  const handleInputChange = (e, name) => {
    const val = (e.target && e.target.value !== undefined) ? e.target.value : e;
    setFormData(prev => ({ ...prev, [name]: val }));
  };
  
  const footer = (
    <>
      <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
      <Button label="Guardar" icon="pi pi-check" onClick={handleSaveClick} autoFocus />
    </>
  );

  return (
    <Dialog header={isEditMode ? 'Editar Categoría' : 'Nueva Categoría'} visible={visible} style={{ width: '450px' }} modal onHide={onHide} footer={footer}>
      <div className="p-fluid">
        <div className="p-field" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="name">Nombre</label>
          <InputText id="name" value={formData.name} onChange={(e) => handleInputChange(e, 'name')} className={formErrors.name ? 'p-invalid' : ''} />
          {formErrors.name && <small className="p-error">{formErrors.name}</small>}
        </div>
        <div className="p-field" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="description">Descripción (Opcional)</label>
          <InputTextarea id="description" value={formData.description} onChange={(e) => handleInputChange(e, 'description')} rows={3} className={formErrors.description ? 'p-invalid' : ''} />
          {formErrors.description && <small className="p-error">{formErrors.description}</small>}
        </div>
        <div className="p-field" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <InputSwitch checked={formData.enabled} onChange={(e) => handleInputChange(e.value, 'enabled')} />
          <label htmlFor="enabled">Habilitada</label>
        </div>
      </div>
    </Dialog>
  );
};

export default CategoryModal;