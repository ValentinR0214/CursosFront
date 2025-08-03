import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';
import EditUserModal from './EditUserModal';

const API_URL = 'http://localhost:8080/api/users';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loggedUser, setLoggedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const { showToast } = useContext(ToastContext);

  const fetchUsers = () => {
    setLoading(true);
    axios
      .get(`${API_URL}/admin/all`, { headers: getAuthHeader() })
      .then((response) => {
        setUsers(response.data.result);
      })
      .catch(() => {
        showToast('error', 'Error', 'No se pudieron cargar los usuarios.');
      })
      .finally(() => setLoading(false));
  };

  const fetchLoggedUser = () => {
    axios
      .get(`${API_URL}/profile`, { headers: getAuthHeader() })
      .then((res) => setLoggedUser(res.data.result))
      .catch(() => showToast('error', 'Error', 'No se pudo obtener el usuario logueado.'));
  };

  const handleSave = (userId, userData) => {
    axios
      .put(`${API_URL}/${userId}`, userData, { headers: getAuthHeader() })
      .then(() => {
        setIsModalVisible(false);
        fetchUsers();
        showToast('success', 'Éxito', 'Usuario actualizado correctamente.');
      })
      .catch(() => {
        showToast('error', 'Error', 'No se pudo actualizar el usuario.');
      });
  };

  const toggleUserStatus = (user) => {
    if (loggedUser && user.id === loggedUser.id) {
      showToast('warn', 'Aviso', 'No puedes deshabilitar tu propio usuario.');
      return;
    }

    const action = user.statusActive ? 'desactivar' : 'habilitar';
    confirmDialog({
      message: `¿Estás seguro de que deseas ${action} a este usuario?`,
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        axios
          .delete(`${API_URL}/${user.id}`, { headers: getAuthHeader() })
          .then(() => {
            fetchUsers();
            showToast('success', 'Éxito', `Usuario ${action} correctamente.`);
          })
          .catch(() => {
            showToast('error', 'Error', `No se pudo ${action} el usuario.`);
          });
      },
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchLoggedUser();
  }, []);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const tableHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0 }}>Gestión de Usuarios</h2>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
      </span>
    </div>
  );

  const statusBodyTemplate = (rowData) => (
    <Tag severity={rowData.statusActive ? 'success' : 'danger'} value={rowData.statusActive ? 'Activo' : 'Inactivo'} />
  );

  const actionBodyTemplate = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        className="p-mr-2"
        onClick={() => handleEdit(rowData)}
        style={{ marginRight: '0.5rem' }}
      />
      <Button
        icon={rowData.statusActive ? 'pi pi-power-off' : 'pi pi-refresh'}
        rounded
        outlined
        severity={rowData.statusActive ? 'danger' : 'success'}
        onClick={() => toggleUserStatus(rowData)}
        tooltip={rowData.statusActive ? 'Desactivar Usuario' : 'Habilitar Usuario'}
        tooltipOptions={{ position: 'top' }}
        disabled={loggedUser && rowData.id === loggedUser.id}
      />
    </>
  );

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <ConfirmDialog />
      <DataTable
        value={users}
        loading={loading}
        paginator
        rows={10}
        emptyMessage="No se encontraron usuarios."
        globalFilter={globalFilter}
        header={tableHeader}
      >
        <Column field="id" header="ID" sortable />
        <Column field="name" header="Nombre" sortable />
        <Column field="lastName" header="Apellido Paterno" sortable />
        <Column field="surname" header="Apellido Materno" sortable />
        <Column field="phone" header="Teléfono" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="rol.roleEnum" header="Rol" sortable />
        <Column header="Estado" body={statusBodyTemplate} sortable field="statusActive" />
        <Column header="Acciones" body={actionBodyTemplate} />
      </DataTable>

      <EditUserModal
        user={selectedUser}
        visible={isModalVisible}
        onHide={() => setIsModalVisible(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default UserManagement;
