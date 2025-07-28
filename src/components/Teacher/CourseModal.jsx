import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { FileUpload } from 'primereact/fileupload';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';

const CourseModal = ({ course, visible, onHide, onSave, teacherId }) => {
  const [formData, setFormData] = useState({ name: '', description: '', duration: 0, categoryId: null, syllabus: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const { showToast } = useContext(ToastContext);

  const isEditMode = course && course.id;

  // Carga las categorías para el menú desplegable
  useEffect(() => {
    if (visible) {
      axios.get('http://localhost:8080/api/categories/active/', { headers: getAuthHeader() })
        .then(res => setCategories(res.data.result))
        .catch(() => showToast('error', 'Error', 'No se pudieron cargar las categorías.'));
    }
  }, [visible]);

  // Llena el formulario con los datos del curso si estamos en modo edición
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: course.name,
        description: course.description,
        duration: course.duration,
        categoryId: course.category?.id || null,
        syllabus: course.syllabus || '',
      });
    } else {
      setFormData({ name: '', description: '', duration: 0, categoryId: null, syllabus: '' });
    }
    setSelectedFile(null); // Siempre resetea el archivo seleccionado
  }, [course, visible]);

  const handleInputChange = (value, name) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onFileSelect = (e) => {
    // PrimeReact v10+ usa e.files[0], versiones anteriores pueden usar e.file
    setSelectedFile(e.files[0]);
  };

  const handleSaveClick = () => {
    // Construye el objeto FormData para enviar datos y archivos
    const courseFormData = new FormData();
    courseFormData.append('name', formData.name);
    courseFormData.append('description', formData.description);
    courseFormData.append('duration', formData.duration);
    courseFormData.append('teacherId', teacherId);
    if (formData.categoryId) {
      courseFormData.append('categoryId', formData.categoryId);
    }
    if (formData.syllabus) {
      courseFormData.append('syllabus', formData.syllabus);
    }
    if (selectedFile) {
      courseFormData.append('file', selectedFile);
    }
    
    // Llama a la función onSave del componente padre
    onSave(courseFormData, course?.id);
  };
  
  const footer = (
    <>
      <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
      <Button label="Guardar" icon="pi pi-check" onClick={handleSaveClick} />
    </>
  );

  return (
    <Dialog header={isEditMode ? 'Editar Curso' : 'Nuevo Curso'} visible={visible} style={{ width: '50vw' }} modal onHide={onHide} footer={footer}>
      <div className="p-fluid">
        <div className="p-field" style={{ marginBottom: '1rem' }}>
          <label htmlFor="name">Nombre del Curso</label>
          <InputText id="name" value={formData.name} onChange={(e) => handleInputChange(e.target.value, 'name')} />
        </div>
        <div className="p-field" style={{ marginBottom: '1rem' }}>
          <label htmlFor="description">Descripción</label>
          <InputTextarea id="description" value={formData.description} onChange={(e) => handleInputChange(e.target.value, 'description')} rows={3} />
        </div>
        <div className="p-field" style={{ marginBottom: '1rem' }}>
          <label htmlFor="syllabus">Temario (Opcional)</label>
          <InputTextarea id="syllabus" value={formData.syllabus} onChange={(e) => handleInputChange(e.target.value, 'syllabus')} rows={3} />
        </div>
        <div className="p-field" style={{ marginBottom: '1rem' }}>
          <label htmlFor="duration">Duración (horas)</label>
          <InputNumber id="duration" value={formData.duration} onValueChange={(e) => handleInputChange(e.value, 'duration')} mode="decimal" />
        </div>
        <div className="p-field" style={{ marginBottom: '1rem' }}>
          <label htmlFor="category">Categoría (Opcional)</label>
          <Dropdown 
            id="category" 
            value={formData.categoryId} 
            options={categories} 
            onChange={(e) => handleInputChange(e.value, 'categoryId')} 
            optionLabel="name"
            optionValue="id"
            placeholder="Selecciona una categoría"
            showClear
          />
        </div>
        <div className="p-field">
          <label>Imagen del Curso (Opcional)</label>
          <FileUpload name="courseImage" onSelect={onFileSelect} mode="basic" accept="image/*" chooseLabel="Seleccionar Imagen" auto />
          {selectedFile && <p style={{marginTop: '0.5rem'}}>Archivo seleccionado: {selectedFile.name}</p>}
        </div>
      </div>
    </Dialog>
  );
};

export default CourseModal;