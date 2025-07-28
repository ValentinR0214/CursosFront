import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// --- COMPONENTES DE PRIMEREACT ---
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { OrderList } from 'primereact/orderlist';
import { Panel } from 'primereact/panel';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Editor } from 'primereact/editor';

import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';

const API_URL = 'http://localhost:8080/api/content';

const CourseContentEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [courseName, setCourseName] = useState('');
  const [content, setContent] = useState({ modules: [] });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');

  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [lessonData, setLessonData] = useState({ title: '', type: 'text', url: '', textContent: '' });

  // Carga inicial del contenido del curso
  useEffect(() => {
    // Carga el nombre del curso para mostrarlo en el título
    axios.get(`http://localhost:8080/api/courses/findOne/${courseId}`, { headers: getAuthHeader() })
      .then(res => setCourseName(res.data.result.name))
      .catch(() => showToast('error', 'Error', 'No se pudo cargar el nombre del curso.'));
    
    // Carga el contenido JSON del curso
    axios.get(`${API_URL}/get/${courseId}`, { headers: getAuthHeader() })
      .then(response => {
        const loadedContent = response.data.result.contentJson;
        if (loadedContent && Array.isArray(loadedContent.modules)) {
          setContent(loadedContent);
        } else {
          setContent({ modules: [] });
        }
      })
      .catch(() => setContent({ modules: [] }))
      .finally(() => setLoading(false));
  }, [courseId]);

  // --- LÓGICA DE CRUD PARA MÓDulos ---
  const openModuleModal = (module = null) => {
    setCurrentModule(module);
    setModuleTitle(module ? module.title : '');
    setModuleModalVisible(true);
  };

  const hideModuleModal = () => {
    setModuleModalVisible(false);
    setCurrentModule(null);
    setModuleTitle('');
  };

  const handleSaveModule = () => {
    if (!moduleTitle.trim()) {
      showToast('error', 'Error', 'El título del módulo no puede estar vacío.');
      return;
    }

    if (currentModule) {
      const updatedModules = content.modules.map(mod =>
        mod.id === currentModule.id ? { ...mod, title: moduleTitle } : mod
      );
      setContent({ modules: updatedModules });
      showToast('success', 'Éxito', 'Módulo actualizado.');
    } else {
      const newModule = {
        id: uuidv4(),
        title: moduleTitle,
        lessons: []
      };
      setContent(prev => ({ modules: [...prev.modules, newModule] }));
      showToast('success', 'Éxito', 'Módulo añadido.');
    }
    hideModuleModal();
  };

  const handleDeleteModule = (moduleId) => {
    const updatedModules = content.modules.filter(mod => mod.id !== moduleId);
    setContent({ modules: updatedModules });
    showToast('info', 'Eliminado', 'El módulo ha sido eliminado.');
  };
  
  // --- LÓGICA DE CRUD PARA LECCIONES ---
  const lessonTypes = [
    { label: 'Texto Enriquecido', value: 'text' },
    { label: 'Video (URL)', value: 'video' },
  ];

  const openLessonModal = (moduleId, lesson = null) => {
    setTargetModuleId(moduleId);
    setCurrentLesson(lesson);
    setLessonData(lesson ? 
      { title: lesson.title, type: lesson.type, url: lesson.url || '', textContent: lesson.textContent || '' } :
      { title: '', type: 'text', url: '', textContent: '' }
    );
    setLessonModalVisible(true);
  };

  const hideLessonModal = () => {
    setLessonModalVisible(false);
    setTargetModuleId(null);
    setCurrentLesson(null);
  };

  const handleSaveLesson = () => {
    if (!lessonData.title.trim()) {
      showToast('error', 'Error', 'El título de la lección no puede estar vacío.');
      return;
    }

    let updatedModules;

    if (currentLesson) { // Editando
      updatedModules = content.modules.map(mod => {
        if (mod.id === targetModuleId) {
          const updatedLessons = mod.lessons.map(les => 
            les.id === currentLesson.id ? { ...les, ...lessonData } : les
          );
          return { ...mod, lessons: updatedLessons };
        }
        return mod;
      });
      showToast('success', 'Éxito', 'Lección actualizada.');
    } else { // Creando
      const newLesson = { ...lessonData, id: uuidv4() };
      updatedModules = content.modules.map(mod => {
        if (mod.id === targetModuleId) {
          return { ...mod, lessons: [...(mod.lessons || []), newLesson] };
        }
        return mod;
      });
      showToast('success', 'Éxito', 'Lección añadida.');
    }
    
    setContent({ modules: updatedModules });
    hideLessonModal();
  };

  const handleDeleteLesson = (moduleId, lessonId) => {
    const updatedModules = content.modules.map(mod => {
      if (mod.id === moduleId) {
        const updatedLessons = mod.lessons.filter(les => les.id !== lessonId);
        return { ...mod, lessons: updatedLessons };
      }
      return mod;
    });
    setContent({ modules: updatedModules });
    showToast('info', 'Eliminada', 'La lección ha sido eliminada.');
  };

  // --- GUARDADO FINAL ---
  const handleSaveContent = () => {
    setIsSaving(true);
    const jsonString = JSON.stringify(content);

    axios.post(`${API_URL}/saveContent/${courseId}`, jsonString, {
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    })
    .then(() => showToast('success', 'Éxito', 'El contenido del curso ha sido guardado.'))
    .catch(() => showToast('error', 'Error', 'No se pudo guardar el contenido.'))
    .finally(() => setIsSaving(false));
  };

  // --- RENDERIZADO DEL EDITOR VISUAL ---
  const moduleTemplate = (module) => {
    const panelHeader = (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <strong>{module.title}</strong>
        <div>
          <Button icon="pi pi-pencil" className="p-button-text" onClick={(e) => { e.stopPropagation(); openModuleModal(module); }} />
          <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }} />
        </div>
      </div>
    );

    return (
      <Panel header={panelHeader} toggleable collapsed>
        <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #eee' }}>
          {module.lessons && module.lessons.map(lesson => (
            <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <i className={`pi ${lesson.type === 'video' ? 'pi-youtube' : 'pi-file'}`} style={{ marginRight: '0.5rem' }}></i>
                <span>{lesson.title}</span>
              </div>
              <div>
                <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openLessonModal(module.id, lesson)} />
                <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDeleteLesson(module.id, lesson.id)} />
              </div>
            </div>
          ))}
          {(!module.lessons || module.lessons.length === 0) && <p className="p-text-secondary">Este módulo aún no tiene lecciones.</p>}
        </div>
        <Button label="Añadir Lección" icon="pi pi-plus" className="p-button-sm p-button-text" onClick={() => openLessonModal(module.id)} style={{ marginTop: '1rem' }} />
      </Panel>
    );
  };
  
  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>Editando Contenido del Curso: <strong>{courseName}</strong></span>
      <Button label="Volver a Cursos" icon="pi pi-arrow-left" className="p-button-text" onClick={() => navigate('/teacher/courses')} />
    </div>
  );

  return (
    <div style={{ padding: '2rem' }}>
      <Card title={header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="p-text-secondary">Organiza los módulos de tu curso. Puedes arrastrarlos para cambiar el orden.</p>
          <Button label="Añadir Módulo" icon="pi pi-plus" onClick={() => openModuleModal()} />
        </div>

        {loading ? <p>Cargando...</p> : (
          <div style={{ marginTop: '1.5rem' }}>
            <OrderList 
              value={content.modules} 
              onChange={(e) => setContent({ modules: e.value })}
              itemTemplate={moduleTemplate}
              header="Módulos del Curso"
              dragdrop
            />
          </div>
        )}
        
        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <Button 
            label={isSaving ? 'Guardando...' : 'Guardar Todo el Contenido'}
            icon={isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
            onClick={handleSaveContent}
            disabled={loading || isSaving}
            className="p-button-success"
          />
        </div>
      </Card>
      
      {/* Modal para Añadir/Editar Módulos */}
      <Dialog header={currentModule ? 'Editar Módulo' : 'Nuevo Módulo'} visible={moduleModalVisible} onHide={hideModuleModal} style={{ width: '30rem' }} modal>
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="moduleTitle">Título del Módulo</label>
            <InputText id="moduleTitle" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} autoFocus />
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <Button label="Cancelar" className="p-button-text" onClick={hideModuleModal} />
            <Button label="Guardar" onClick={handleSaveModule} />
          </div>
        </div>
      </Dialog>

      {/* Modal para Añadir/Editar Lecciones */}
      <Dialog header={currentLesson ? 'Editar Lección' : 'Nueva Lección'} visible={lessonModalVisible} onHide={hideLessonModal} style={{ width: '40rem' }} modal>
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="lessonTitle">Título de la Lección</label>
            <InputText id="lessonTitle" value={lessonData.title} onChange={(e) => setLessonData({...lessonData, title: e.target.value})} />
          </div>
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="lessonType">Tipo de Contenido</label>
            <Dropdown id="lessonType" value={lessonData.type} options={lessonTypes} onChange={(e) => setLessonData({...lessonData, type: e.value})} />
          </div>
          {lessonData.type === 'video' && (
            <div className="p-field" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="videoUrl">URL del Video</label>
              <InputTextarea id="videoUrl" value={lessonData.url} onChange={(e) => setLessonData({...lessonData, url: e.target.value})} rows={3} />
            </div>
          )}
          {lessonData.type === 'text' && (
            <div className="p-field" style={{ marginBottom: '1.5rem' }}>
              <label>Contenido de Texto</label>
              <Editor style={{ height: '250px' }} value={lessonData.textContent} onTextChange={(e) => setLessonData({...lessonData, textContent: e.htmlValue})} />
            </div>
          )}
          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <Button label="Cancelar" className="p-button-text" onClick={hideLessonModal} />
            <Button label="Guardar Lección" onClick={handleSaveLesson} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CourseContentEditor;