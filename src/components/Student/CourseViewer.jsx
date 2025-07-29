import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';

const API_BASE_URL = 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api`;

const CourseViewer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [course, setCourse] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_URL}/courses/findOne/${courseId}`, { headers: getAuthHeader() }),
      axios.get(`${API_URL}/content/get/${courseId}`, { headers: getAuthHeader() })
    ]).then(([courseResponse, contentResponse]) => {
      setCourse(courseResponse.data.result);
      const loadedContent = contentResponse.data.result?.contentJson;
      setContent(loadedContent && loadedContent.modules ? loadedContent : { modules: [] });
    }).catch(err => {
      if (err.response?.status === 404 && err.config.url.includes('/content/')) {
        setContent({ modules: [] });
      } else if (err.config.url.includes('/courses/')) {
        showToast('error', 'Error', 'No se pudo cargar el curso o no tienes permiso.');
        navigate('/student/my-courses');
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [courseId, navigate, showToast]);

  const renderLessonContent = (lesson) => {
    switch (lesson.type) {
      case 'video':
        const videoIdMatch = lesson.url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        
        if (videoId) {
          return (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                src={`https://www.youtube.com/embed/${videoId}`} 
                title={lesson.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          );
        }
        return <p><a href={lesson.url} target="_blank" rel="noopener noreferrer">Ver video en una nueva pestaña</a></p>;
      
      case 'text':
        return <div dangerouslySetInnerHTML={{ __html: lesson.textContent }} />;
      
      default:
        return <p><em>Tipo de contenido no soportado.</em></p>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>Estás viendo: <strong>{course?.name}</strong></span>
      <Button label="Volver a Mis Cursos" icon="pi pi-arrow-left" className="p-button-text" onClick={() => navigate('/student/my-courses')} />
    </div>
  );

  return (
    <div style={{ padding: '2rem' }}>
      <Card title={header}>
        <p className="p-text-secondary">{course?.description}</p>
        
        <div style={{ marginTop: '2rem' }}>
          <h3>Contenido del Curso</h3>
          {content?.modules?.length > 0 ? (
            <Accordion multiple activeIndex={[0]}>
              {content.modules.map((module) => (
                <AccordionTab key={module.id} header={module.title}>
                  {module.lessons?.length > 0 ? (
                    module.lessons.map((lesson, index) => (
                      <div key={lesson.id} style={{ padding: '1rem', borderBottom: index < module.lessons.length - 1 ? '1px solid #eee' : 'none' }}>
                        <h4>{lesson.title}</h4>
                        {renderLessonContent(lesson)}
                      </div>
                    ))
                  ) : <p>Este módulo no tiene lecciones.</p>}
                </AccordionTab>
              ))}
            </Accordion>
          ) : (
            <p>El contenido de este curso aún no ha sido publicado por el profesor.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CourseViewer;