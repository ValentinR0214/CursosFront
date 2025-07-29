import React, { useState, useEffect, useContext } from 'react'; 
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader, decryptData } from '../../utils/security';

const API_BASE_URL = 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api`;

const CoursePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [course, setCourse] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const session = decryptData(localStorage.getItem('user'));
  const isStudent = session?.user?.rol?.roleEnum === 'STUDENT';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_URL}/courses/findOne/${courseId}`),
      axios.get(`${API_URL}/content/get/${courseId}`, { headers: getAuthHeader() }) 
    ]).then(([courseResponse, contentResponse]) => {
      setCourse(courseResponse.data.result);
      const loadedContent = contentResponse.data.result?.contentJson;
      setContent(loadedContent && loadedContent.modules ? loadedContent : { modules: [] });
    }).catch(() => {
      showToast('error', 'Error', 'No se pudo cargar la vista previa del curso.');
      navigate('/');
    }).finally(() => {
      setLoading(false);
    });
  }, [courseId, navigate, showToast]);

  const handleEnroll = () => {
    if (!session || !isStudent) {
      showToast('info', 'Acción Requerida', 'Por favor, inicia sesión o crea una cuenta para inscribirte.');
      const redirectUrl = `/student/course/${courseId}/view`;
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }
    
    axios.post(`${API_URL}/courses/enroll`, { courseId }, { headers: getAuthHeader() })
      .then(() => {
        showToast('success', '¡Inscripción Exitosa!', '¡Ahora tienes acceso completo al curso!');
        navigate(`/student/course/${courseId}/view`);
      })
      .catch(err => {
        const message = err.response?.status === 409 ? 'Ya estás inscrito en este curso.' : 'No se pudo procesar la inscripción.';
        showToast('warn', 'Atención', message);
      });
  };

  const renderLessonContent = (lesson, isPreview = false) => {
    if (isPreview) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: '#999' }}>
          <i className="pi pi-lock" style={{ marginRight: '0.5rem' }}></i>
          <span>Contenido bloqueado. Inscríbete para acceder.</span>
        </div>
      );
    }
   
    switch (lesson.type) {
      case 'video':
        const videoId = lesson.url.split('v=')[1]?.split('&')[0];
        if (videoId) {
          return (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} src={`https://www.youtube.com/embed/${videoId}`} title={lesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          );
        }
        return <a href={lesson.url} target="_blank" rel="noopener noreferrer">Ver video</a>;
      case 'text':
        return <div dangerouslySetInnerHTML={{ __html: lesson.textContent }} />;
      default:
        return <p>Tipo de contenido no soportado.</p>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!course) {
    return (
      <Card title="Curso no encontrado" style={{ margin: '2rem' }}>
        <p>El curso que buscas no existe o no está disponible.</p>
        <Button label="Volver al Catálogo" onClick={() => navigate('/')} />
      </Card>
    );
  }

  const imageUrl = course.imageUrl && (course.imageUrl.startsWith('http') ? course.imageUrl : `${API_BASE_URL}${course.imageUrl}`);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2>{course.name}</h2>
      <Button label="Volver" icon="pi pi-arrow-left" className="p-button-text" onClick={() => navigate(-1)} />
    </div>
  );

  return (
    <div style={{ padding: '2rem' }}>
      <Card title={header}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <img src={imageUrl || 'https://via.placeholder.com/600x300'} alt={course.name} style={{ width: '100%', borderRadius: '8px' }} />
            <p style={{ marginTop: '1rem' }}>{course.description}</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
            <h4>Inscríbete a este curso</h4>
            <p>Obtén acceso completo a todas las lecciones y materiales.</p>
            <Button label="Inscribirme Ahora" icon="pi pi-check" className="p-button-lg p-button-success" onClick={handleEnroll} />
            <div style={{ marginTop: '1rem' }}>
              <Tag value={course.category?.name || 'General'} />
              <span style={{ marginLeft: '1rem' }}>Prof. {course.teacher?.name}</span>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <h3>Contenido del Curso (Vista Previa)</h3>
          <Accordion multiple activeIndex={[0]}>
            {content && content.modules && content.modules.map((module, moduleIndex) => (
              <AccordionTab key={module.id} header={module.title}>
                {module.lessons?.map((lesson, lessonIndex) => {
                  const isLessonPreviewable = moduleIndex === 0 && lessonIndex === 0;
                  return (
                    <div key={lesson.id} style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0', opacity: isLessonPreviewable ? 1 : 0.6 }}>
                      <h4>{lesson.title}</h4>
                      {renderLessonContent(lesson, !isLessonPreviewable)}
                    </div>
                  );
                })}
                {(!module.lessons || module.lessons.length === 0) && <p>Este módulo no tiene lecciones.</p>}
              </AccordionTab>
            ))}
            {(!content || !content.modules || content.modules.length === 0) && <p>El contenido de este curso aún no ha sido publicado.</p>}
          </Accordion>
        </div>
      </Card>
    </div>
  );
};
 
export default CoursePreview;