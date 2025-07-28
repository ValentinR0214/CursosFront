import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader, decryptData } from '../../utils/security';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const API_BASE_URL = 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api/courses`;

const CourseCatalog = () => {
  const [allCourses, setAllCourses] = useState([]);
  const [displayedCourses, setDisplayedCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const session = decryptData(localStorage.getItem('user'));
  const isStudent = session?.user?.rol?.roleEnum === 'STUDENT';

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(6);

  useEffect(() => {
    setLoading(true);
    const fetchAllCourses = axios.get(`${API_URL}/findAll`);

    if (isStudent) {
      const fetchMyCourses = axios.get(`${API_URL}/my-courses`, { headers: getAuthHeader() });
      Promise.all([fetchAllCourses, fetchMyCourses]).then(([allCoursesResponse, myCoursesResponse]) => {
        const myCourses = myCoursesResponse.data.result || [];
        const enrolledIds = new Set(myCourses.map(course => course.id));
        setEnrolledCourseIds(enrolledIds);

        const enabledCourses = allCoursesResponse.data.result.filter(course => course.enabled);
        setAllCourses(enabledCourses);
        setDisplayedCourses(enabledCourses.slice(0, rows));
      }).catch(() => {
        showToast('error', 'Error', 'No se pudieron cargar los datos de los cursos.');
      }).finally(() => setLoading(false));
    } else {
      fetchAllCourses.then(res => {
        const enabledCourses = res.data.result.filter(course => course.enabled);
        setAllCourses(enabledCourses);
        setDisplayedCourses(enabledCourses.slice(0, rows));
      }).catch(() => {
        showToast('error', 'Error', 'No se pudieron cargar los cursos del catálogo.');
      }).finally(() => setLoading(false));
    }
  }, [isStudent, showToast]);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
    setDisplayedCourses(allCourses.slice(event.first, event.first + event.rows));
  };

  const handleEnroll = (courseId) => {
    if (!session || !isStudent) {
      showToast('info', 'Acción Requerida', 'Inicia sesión como estudiante para inscribirte.');
      const redirectUrl = `/student/course/${courseId}/view`;
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }
    axios.post(`${API_URL}/enroll`, { courseId }, { headers: getAuthHeader() })
      .then(() => {
        showToast('success', 'Éxito', 'Curso añadido a "Mis Cursos".');
        setEnrolledCourseIds(prev => new Set(prev).add(courseId));
      })
      .catch(err => {
        const message = err.response?.status === 409 ? 'Ya estás inscrito.' : 'No se pudo inscribir.';
        showToast('warn', 'Atención', message);
      });
  };

  const handleUnenroll = (courseId) => {
    confirmDialog({
      message: '¿Estás seguro de que quieres darte de baja de este curso?',
      header: 'Confirmar Baja',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        axios.post(`${API_URL}/unenroll`, { courseId }, { headers: getAuthHeader() })
          .then(() => {
            showToast('success', 'Éxito', 'Te has dado de baja del curso.');
            setEnrolledCourseIds(prevIds => {
              const newIds = new Set(prevIds);
              newIds.delete(courseId);
              return newIds;
            });
          })
          .catch(() => showToast('error', 'Error', 'No se pudo procesar la baja.'));
      },
    });
  };

  const courseCardTemplate = (course) => {
    const imageUrl = course.imageUrl && (course.imageUrl.startsWith('http') ? course.imageUrl : `${API_BASE_URL}${course.imageUrl}`);
    const isEnrolled = isStudent && enrolledCourseIds.has(course.id);

    const header = (
      <Link to={`/course/${course.id}/preview`}>
        <img alt={course.name} src={imageUrl || 'https://via.placeholder.com/400x200'} style={{ height: '200px', objectFit: 'cover', width: '100%' }} />
      </Link>
    );

    const footer = (
      <div style={{ display: 'flex', justifyContent: isEnrolled ? 'space-between' : 'flex-end', alignItems: 'center' }}>
        {isEnrolled && (
          <Button label="Desuscribirse" icon="pi pi-times" className="p-button-text p-button-danger" onClick={() => handleUnenroll(course.id)} />
        )}
        <Button 
          label={isEnrolled ? "Ver Contenido" : "Inscribirse"}
          icon={isEnrolled ? "pi pi-arrow-right" : "pi pi-plus"}
          onClick={() => isEnrolled ? navigate(`/student/course/${course.id}/view`) : handleEnroll(course.id)}
          className={!isEnrolled ? 'p-button-success' : ''}
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
      <div key={course.id} style={{ width: '100%', display: 'flex' }}>
        <Card title={<Link to={`/course/${course.id}/preview`} style={{ textDecoration: 'none', color: 'inherit' }}>{course.name}</Link>} subTitle={subTitle} footer={footer} header={header} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p className="p-m-0" style={{ flexGrow: 1 }}>{course.description}</p>
        </Card>
      </div>
    );
  };

  if (loading) { return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><ProgressSpinner /></div>; }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <ConfirmDialog />
      <h2 style={{ marginBottom: '2rem' }}>Catálogo de Cursos</h2>
      {allCourses.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {displayedCourses.map(course => courseCardTemplate(course))}
          </div>
          <Paginator first={first} rows={rows} totalRecords={allCourses.length} onPageChange={onPageChange} style={{ marginTop: '2rem', justifyContent: 'center' }} />
        </>
      ) : (
        <p>No hay cursos disponibles en el catálogo en este momento.</p>
      )}
    </div>
  );
};

export default CourseCatalog;