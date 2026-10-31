import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Warehouse, Building2, MapPin, Gauge } from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const STORAGE_TYPES = ['Cold Storage', 'Dry Storage', 'Deep Frozen', 'Ambient Pantry', 'Chilled Vault'];

export default function StorageUnits() {
  const [units, setUnits] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [alert, setAlert] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeUnit, setActiveUnit] = useState(null);
  const [unitDetails, setUnitDetails] = useState(null);

  const [formData, setFormData] = useState({
    NGO_id: '',
    Unit_name: '',
    Storage_type: 'Cold Storage',
    Location: '',
    Total_capacity: 500
  });

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedType) params.storageType = selectedType;

      const res = await api.get('/storage-units', { params });
      setUnits(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchNGOs = async () => {
    try {
      const res = await api.get('/ngos');
      setNgos(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [search, selectedType]);

  useEffect(() => {
    fetchNGOs();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      NGO_id: ngos[0]?.NGO_id || '',
      Unit_name: '',
      Storage_type: 'Cold Storage',
      Location: '',
      Total_capacity: 500
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setActiveUnit(unit);
    setFormData({
      NGO_id: unit.NGO_id || '',
      Unit_name: unit.Unit_name || '',
      Storage_type: unit.Storage_type || 'Cold Storage',
      Location: unit.Location || '',
      Total_capacity: unit.Total_capacity || 500
    });
    setIsEditOpen(true);
  };

  const handleOpenView = async (unit) => {
    setActiveUnit(unit);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/storage-units/${unit.Unit_id}`);
      setUnitDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleOpenDelete = (unit) => {
    setActiveUnit(unit);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/storage-units', formData);
      setAlert({ type: 'success', message: 'Storage unit registered in MySQL.' });
      setIsCreateOpen(false);
      fetchUnits();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/storage-units/${activeUnit.Unit_id}`, formData);
      setAlert({ type: 'success', message: 'Storage unit updated.' });
      setIsEditOpen(false);
      fetchUnits();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/storage-units/${activeUnit.Unit_id}`);
      setAlert({ type: 'success', message: 'Storage unit deleted from database.' });
      setIsDeleteOpen(false);
      fetchUnits();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'Storage Unit & Type',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{row.Unit_name}</div>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 mt-0.5 border border-indigo-100">
            {row.Storage_type}
          </span>
        </div>
      )
    },
    {
      header: 'Managing NGO',
      render: (row) => (
        <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          {row.ngoName}
        </div>
      )
    },
    {
      header: 'Location',
      render: (row) => (
        <div className="text-xs text-slate-600 max-w-xs truncate" title={row.Location}>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{row.Location}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Capacity & Utilization',
      render: (row) => {
        const util = parseFloat(row.currentUtilizedQuantity) || 0;
        const total = parseFloat(row.Total_capacity) || 1;
        const pct = Math.min(Math.round((util / total) * 100), 100);

        return (
          <div className="text-xs w-44">
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
              <span>{util} / {row.Total_capacity}</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Deliveries Received',
      render: (row) => (
        <div className="text-xs font-semibold text-slate-800">
          {row.totalDeliveriesReceived} deliveries
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenView(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="View Deliveries Deposited"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Unit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete Unit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <DataTable
        columns={columns}
        data={units}
        loading={loading}
        searchPlaceholder="Search storage units by name, location, NGO..."
        searchValue={search}
        onSearch={setSearch}
        filters={
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
          >
            <option value="">All Storage Types</option>
            {STORAGE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Storage Unit
          </button>
        }
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add NGO Storage Unit / Warehouse"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner NGO *</label>
              <select
                required
                value={formData.NGO_id}
                onChange={(e) => setFormData({ ...formData, NGO_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select NGO</option>
                {ngos.map((n) => (
                  <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Name *</label>
              <input
                type="text"
                required
                value={formData.Unit_name}
                onChange={(e) => setFormData({ ...formData, Unit_name: e.target.value })}
                placeholder="e.g. Ring Road Cold Hub #1"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Type *</label>
              <select
                value={formData.Storage_type}
                onChange={(e) => setFormData({ ...formData, Storage_type: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                {STORAGE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Capacity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Total_capacity}
                onChange={(e) => setFormData({ ...formData, Total_capacity: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[11px] text-slate-400">MySQL CHECK constraint requires Total_capacity &gt; 0</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Location Address *</label>
            <textarea
              required
              rows={2}
              value={formData.Location}
              onChange={(e) => setFormData({ ...formData, Location: e.target.value })}
              placeholder="Warehouse address, Gate No, Landmark..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
            >
              Save Storage Unit
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Storage Unit: ${activeUnit?.Unit_name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner NGO *</label>
              <select
                required
                value={formData.NGO_id}
                onChange={(e) => setFormData({ ...formData, NGO_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {ngos.map((n) => (
                  <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Name *</label>
              <input
                type="text"
                required
                value={formData.Unit_name}
                onChange={(e) => setFormData({ ...formData, Unit_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Type *</label>
              <select
                value={formData.Storage_type}
                onChange={(e) => setFormData({ ...formData, Storage_type: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {STORAGE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Capacity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Total_capacity}
                onChange={(e) => setFormData({ ...formData, Total_capacity: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
            <textarea
              required
              rows={2}
              value={formData.Location}
              onChange={(e) => setFormData({ ...formData, Location: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
            >
              Update Storage Unit
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setUnitDetails(null);
        }}
        title={`Storage Unit Overview: ${activeUnit?.Unit_name}`}
        maxWidth="max-w-3xl"
      >
        {unitDetails ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-500">Managing NGO:</strong> {unitDetails.ngoName}</div>
              <div><strong className="text-slate-500">Storage Type:</strong> {unitDetails.Storage_type}</div>
              <div><strong className="text-slate-500">Total Capacity:</strong> {unitDetails.Total_capacity} units</div>
              <div><strong className="text-slate-500">Location:</strong> {unitDetails.Location}</div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">
                Deliveries Routed to this Storage Unit ({unitDetails.deliveries?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Delivery ID</th>
                      <th className="p-2.5">Food Item</th>
                      <th className="p-2.5">Quantity</th>
                      <th className="p-2.5">Donor</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unitDetails.deliveries?.length > 0 ? (
                      unitDetails.deliveries.map((del) => (
                        <tr key={del.Delivery_id}>
                          <td className="p-2.5 font-mono">#{del.Delivery_id}</td>
                          <td className="p-2.5 font-medium">{del.Item_name}</td>
                          <td className="p-2.5">{del.Quantity} {del.Unit}</td>
                          <td className="p-2.5">{del.donorName}</td>
                          <td className="p-2.5"><StatusBadge status={del.Status} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No deliveries deposited into this unit yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">Loading unit details...</div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Unit Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete unit <strong className="text-slate-800">{activeUnit?.Unit_name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Note: If any food donation or delivery references this storage unit (`fk_donation_unit` or `fk_delivery_unit`), MySQL will protect the data integrity.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
