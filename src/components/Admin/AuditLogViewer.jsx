import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';

const API_URL = 'http://localhost:8080/api/logs';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/`, { headers: getAuthHeader() })
      .then(res => {
        // Ordenamos los logs por fecha, del más reciente al más antiguo
        const sortedLogs = res.data.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(sortedLogs);
      })
      .catch(() => {
        showToast('error', 'Error', 'No se pudieron cargar los registros de auditoría.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [showToast]);

  // Formatea la fecha para que sea legible
  const formatTimestamp = (rowData) => {
    return new Date(rowData.timestamp).toLocaleString();
  };

  // Añade colores a las acciones para identificarlas fácilmente
  const actionBodyTemplate = (rowData) => {
    let severity;
    switch (rowData.action.toUpperCase()) {
      case 'CREATE':
      case 'LOGIN_SUCCESS':
        severity = 'success';
        break;
      case 'UPDATE':
        severity = 'warning';
        break;
      case 'DELETE':
      case 'LOGIN_FAILED':
        severity = 'danger';
        break;
      default:
        severity = 'info';
    }
    return <Tag severity={severity} value={rowData.action} />;
  };

  // Encabezado de la tabla con el buscador
  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0 }}>Registros de Auditoría del Sistema</h2>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText 
          type="search" 
          value={globalFilter} 
          onChange={(e) => setGlobalFilter(e.target.value)} 
          placeholder="Buscar en logs..." 
        />
      </span>
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
    <div style={{ padding: '2rem' }}>
      <Card>
        <DataTable 
          value={logs} 
          paginator 
          rows={15} 
          rowsPerPageOptions={[15, 30, 50, 100]}
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No se encontraron registros."
        >
          <Column field="id" header="ID" sortable />
          <Column field="timestamp" header="Fecha y Hora" body={formatTimestamp} sortable />
          <Column field="entity" header="Entidad" sortable filter filterPlaceholder="Filtrar por entidad" />
          <Column field="entityId" header="ID Entidad" sortable />
          <Column field="action" header="Acción" body={actionBodyTemplate} sortable filter filterPlaceholder="Filtrar por acción" />
          <Column field="descripcion" header="Descripción" style={{ minWidth: '300px' }} />
        </DataTable>
      </Card>
    </div>
  );
};

export default AuditLogViewer;