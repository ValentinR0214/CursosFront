import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const API_BASE_URL = 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api/courses`;

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = () => {
    setLoading(true);
    axios.get(`${API_URL}/my-courses`, { headers: getAuthHeader() })
      .then(res => {
        setCourses(res.data.result || []);
      })
      .catch(() => showToast('error', 'Error', 'No se pudieron cargar tus cursos.'))
      .finally(() => setLoading(false));
  };

  const handleUnenroll = (courseId) => {
    confirmDialog({
      message: '¿Estás seguro de que quieres darte de baja de este curso? Perderás el acceso a su contenido.',
      header: 'Confirmar Baja',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, darme de baja',
      rejectLabel: 'Cancelar',
      accept: () => {
        axios.post(`${API_URL}/unenroll`, { courseId }, { headers: getAuthHeader() })
          .then(() => {
            showToast('success', 'Éxito', 'Te has dado de baja del curso.');
            setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
          })
          .catch(() => showToast('error', 'Error', 'No se pudo procesar la baja del curso.'));
      },
    });
  };

  const courseCardTemplate = (course) => {
    const imageUrl = course.imageUrl && (course.imageUrl.startsWith('http') ? course.imageUrl : `${API_BASE_URL}${course.imageUrl}`);
    
    const header = (
      <Link to={`/student/course/${course.id}/view`}>
        <img alt={course.name} src={imageUrl || 'https://via.placeholder.com/400x200'} style={{ height: '200px', objectFit: 'cover', width: '100%' }} />
      </Link>
    );

    const footer = (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          label="Desuscribirse" 
          icon="pi pi-times" 
          className="p-button-text p-button-danger"
          onClick={() => handleUnenroll(course.id)} 
        />
        <Button 
          label="Continuar Aprendiendo" 
          icon="pi pi-arrow-right" 
          onClick={() => navigate(`/student/course/${course.id}/view`)} 
        />
      </div>
    );

    const subTitle = (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Tag value={course.categoryName || 'General'} />
        <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Prof. {course.teacherName}</span>
      </div>
    );

    return (
      <div key={course.id} style={{ width: '100%' }}>
        <Card title={<Link to={`/student/course/${course.id}/view`} style={{ textDecoration: 'none', color: 'inherit' }}>{course.name}</Link>} subTitle={subTitle} footer={footer} header={header} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <p className="p-m-0" style={{ flexGrow: 1 }}>{course.description}</p>
        </Card>
      </div>
    );
  };

  if (loading) { return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><ProgressSpinner /></div>; }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <ConfirmDialog />
      <h2 style={{ marginBottom: '2rem' }}>Mis Cursos</h2>
      {courses.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {courses.map(course => courseCardTemplate(course))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Aún no te has inscrito a ningún curso.</h3>
          <p>¡Explora nuestro catálogo para empezar a aprender!</p>
          <Button label="Ir al Catálogo" icon="pi pi-shopping-cart" onClick={() => navigate('/courses')} />
        </div>
      )}
    </div>
  );
};

export default MyCourses;