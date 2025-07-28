import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader, decryptData } from '../../utils/security';
import CourseModal from './CourseModal.jsx';
import { ProgressSpinner } from 'primereact/progressspinner';

const API_BASE_URL = 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api/courses`;

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const session = decryptData(localStorage.getItem('user'));
  const teacherId = session?.user?.id;

  const fetchCourses = () => {
    setLoading(true);
    axios.get(`${API_URL}/findAll`, { headers: getAuthHeader() })
      .then(res => {
        const teacherCourses = res.data.result.filter(course => course.teacherId === teacherId);
        setCourses(teacherCourses);
      })
      .catch(err => showToast('error', 'Error', 'No se pudieron cargar los cursos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (teacherId) {
      fetchCourses();
    } else {
      showToast('error', 'Error de Sesión', 'No se pudo identificar al profesor.');
      setLoading(false);
    }
  }, [teacherId]);

  const openNew = () => {
    setSelectedCourse(null);
    setIsModalVisible(true);
  };

  const openEdit = (course) => {
    axios.get(`${API_URL}/findOne/${course.id}`, { headers: getAuthHeader() })
      .then(res => {
        setSelectedCourse(res.data.result);
        setIsModalVisible(true);
      })
      .catch(() => showToast('error', 'Error', 'No se pudieron cargar los detalles del curso.'));
  };

  const hideModal = () => setIsModalVisible(false);

  const handleSave = (courseFormData, courseId) => {
    setLoading(true);
    const isEdit = !!courseId;
    const url = isEdit ? `${API_URL}/update-course/${courseId}` : `${API_URL}/save-course`;
    const method = isEdit ? 'put' : 'post';

    axios({
      method,
      url,
      data: courseFormData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeader(),
      },
    }).then(() => {
      showToast('success', 'Éxito', `Curso ${isEdit ? 'actualizado' : 'creado'}.`);
      hideModal();
      fetchCourses();
    }).catch(err => {
      showToast('error', 'Error', err.response?.data?.message || 'Ocurrió un error.');
    }).finally(() => setLoading(false));
  };

  const handleDisable = (course) => {
    confirmDialog({
      message: `¿Seguro que quieres ${course.enabled ? 'deshabilitar' : 'habilitar'} este curso?`,
      header: 'Confirmación',
      accept: () => {
        axios.delete(`${API_URL}/disable/${course.id}`, { headers: getAuthHeader() })
          .then(() => {
            showToast('info', 'Actualizado', 'El estado del curso ha cambiado.');
            fetchCourses();
          })
          .catch(err => showToast('error', 'Error', 'No se pudo cambiar el estado.'));
      }
    });
  };
  
  const leftToolbarTemplate = () => <Button label="Nuevo Curso" icon="pi pi-plus" onClick={openNew} />;
  
  const statusBodyTemplate = (rowData) => <Tag value={rowData.enabled ? 'Habilitado' : 'Deshabilitado'} severity={rowData.enabled ? 'success' : 'danger'} />;
  
  const imageBodyTemplate = (rowData) => {
    if (!rowData.imageUrl) return <span style={{ color: '#aaa' }}>Sin imagen</span>;
    const imageUrl = rowData.imageUrl.startsWith('http') ? rowData.imageUrl : `${API_BASE_URL}${rowData.imageUrl}`;
    return <img src={imageUrl} alt={rowData.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />;
  };

  // --- TEMPLATE DE ACCIONES ACTUALIZADO ---
  const actionBodyTemplate = (rowData) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button icon="pi pi-pencil" rounded outlined tooltip="Editar Detalles" tooltipOptions={{ position: 'top' }} onClick={() => openEdit(rowData)} />
      <Button icon="pi pi-file-edit" rounded outlined severity="info" tooltip="Editar Contenido" tooltipOptions={{ position: 'top' }} onClick={() => navigate(`/teacher/course/${rowData.id}/content`)} />
      <Button icon="pi pi-users" rounded outlined severity="success" tooltip="Ver Estudiantes" tooltipOptions={{ position: 'top' }} onClick={() => navigate(`/teacher/course/${rowData.id}/students`)} />
      <Button 
        icon={rowData.enabled ? 'pi pi-eye-slash' : 'pi pi-eye'} 
        rounded 
        outlined 
        severity={rowData.enabled ? 'warning' : 'success'} 
        tooltip={rowData.enabled ? 'Deshabilitar' : 'Habilitar'}
        tooltipOptions={{ position: 'top' }}
        onClick={() => handleDisable(rowData)} 
      />
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h2>Mis Cursos</h2>
      <ConfirmDialog />
      <Toolbar left={leftToolbarTemplate} className="mb-4"></Toolbar>
      <DataTable value={courses} paginator rows={5} emptyMessage="No has creado ningún curso.">
        <Column header="Imagen" body={imageBodyTemplate} />
        <Column field="name" header="Nombre" sortable />
        <Column field="description" header="Descripción" style={{ minWidth: '200px' }} />
        <Column field="duration" header="Duración (hrs)" sortable />
        <Column field="categoryName" header="Categoría" sortable />
        <Column header="Estado" body={statusBodyTemplate} sortable field="enabled" />
        <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '15rem' }}/>
      </DataTable>

      <CourseModal course={selectedCourse} visible={isModalVisible} onHide={hideModal} onSave={handleSave} teacherId={teacherId} />
    </div>
  );
};

export default CourseManagement;