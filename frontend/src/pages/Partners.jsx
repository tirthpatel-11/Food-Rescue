import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Bike, Truck, Phone, Mail, Snowflake, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const VEHICLE_TYPES = ['Motorcycle / Bike', 'Van', 'Pickup Truck', 'Mini Truck', 'Refrigerated Van', 'Auto Rickshaw'];
const PARTNER_TYPES = ['Volunteer', 'Partner'];

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [alert, setAlert] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activePartner, setActivePartner] = useState(null);
  const [partnerDetails, setPartnerDetails] = useState(null);

  const [formData, setFormData] = useState({
    Name: '',
    Phone: '',
    Email: '',
    License_no: '',
    Type: 'Volunteer',
    NGO_id: '',
    // Vehicle details
    Vehicle_no: '',
    Vehicle_type: 'Motorcycle / Bike',
    Capacity: 50,
    Is_Refrigerated: false
  });

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedType) params.type = selectedType;

      const res = await api.get('/partners', { params });
      setPartners(res.data);
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
    fetchPartners();
  }, [search, selectedType]);

  useEffect(() => {
    fetchNGOs();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      Name: '',
      Phone: '',
      Email: '',
      License_no: '',
      Type: 'Volunteer',
      NGO_id: ngos[0]?.NGO_id || '',
      Vehicle_no: '',
      Vehicle_type: 'Motorcycle / Bike',
      Capacity: 50,
      Is_Refrigerated: false
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (p) => {
    setActivePartner(p);
    setFormData({
      Name: p.Name || '',
      Phone: p.Phone || '',
      Email: p.Email || '',
      License_no: p.License_no || '',
      Type: p.Type || 'Volunteer',
      NGO_id: p.NGO_id || '',
      Vehicle_no: p.Vehicle_no || '',
      Vehicle_type: p.Vehicle_type || 'Motorcycle / Bike',
      Capacity: p.Capacity || 50,
      Is_Refrigerated: Boolean(p.Is_Refrigerated)
    });
    setIsEditOpen(true);
  };

  const handleOpenView = async (p) => {
    setActivePartner(p);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/partners/${p.Partner_id}`);
      setPartnerDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleOpenDelete = (p) => {
    setActivePartner(p);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/partners', formData);
      setAlert({ type: 'success', message: 'Partner and vehicle registered atomically in MySQL.' });
      setIsCreateOpen(false);
      fetchPartners();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/partners/${activePartner.Partner_id}`, formData);
      setAlert({ type: 'success', message: 'Partner & Vehicle updated.' });
      setIsEditOpen(false);
      fetchPartners();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/partners/${activePartner.Partner_id}`);
      setAlert({ type: 'success', message: 'Partner removed from database.' });
      setIsDeleteOpen(false);
      fetchPartners();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'Partner Name & Type',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{row.Name}</div>
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mt-0.5 ${
            row.Type === 'Volunteer' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {row.Type}
          </span>
        </div>
      )
    },
    {
      header: 'Contact Info',
      render: (row) => (
        <div className="text-xs space-y-0.5 text-slate-600">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> {row.Phone}
          </div>
          {row.Email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {row.Email}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Registered Vehicle',
      render: (row) => (
        <div className="text-xs">
          {row.Vehicle_no ? (
            <div>
              <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                {row.Vehicle_no}
              </div>
              <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                <span>{row.Vehicle_type} ({row.Capacity} units)</span>
                {row.Is_Refrigerated ? (
                  <span className="flex items-center gap-0.5 text-sky-600 font-semibold" title="Refrigerated vehicle">
                    <Snowflake className="w-3 h-3" /> Cold
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <span className="text-slate-400 italic">No Vehicle Linked</span>
          )}
        </div>
      )
    },
    {
      header: 'Affiliated NGO',
      render: (row) => (
        <div className="text-xs text-slate-700 font-medium">
          {row.ngoName || <span className="text-slate-400 italic">Independent</span>}
        </div>
      )
    },
    {
      header: 'Deliveries Done',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900">{row.totalDeliveries}</span> total
          <div className="text-slate-500 text-[11px]">{row.completedDeliveries} completed</div>
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
            title="View Deliveries History"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Partner & Vehicle"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete Partner"
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
        data={partners}
        loading={loading}
        searchPlaceholder="Search partners by name, phone, vehicle no..."
        searchValue={search}
        onSearch={setSearch}
        filters={
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
          >
            <option value="">All Partner Types</option>
            {PARTNER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Partner & Fleet
          </button>
        }
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Delivery Partner & Fleet Vehicle"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <strong>1-to-1 Relationship:</strong> In our schema, each Delivery Partner operates exactly one dedicated vehicle. Both entries will be inserted together inside a MySQL database transaction.
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Partner Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Partner Name *</label>
              <input
                type="text"
                required
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Engagement Type *</label>
              <select
                value={formData.Type}
                onChange={(e) => setFormData({ ...formData, Type: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="Volunteer">Volunteer</option>
                <option value="Partner">Partner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.Phone}
                onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                placeholder="+91 98980 12345"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                placeholder="partner@example.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Driving License No</label>
              <input
                type="text"
                value={formData.License_no}
                onChange={(e) => setFormData({ ...formData, License_no: e.target.value })}
                placeholder="GJ05-2023-XXXX"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Affiliated NGO (Optional)</label>
            <select
              value={formData.NGO_id}
              onChange={(e) => setFormData({ ...formData, NGO_id: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">Independent / Self Managed</option>
              {ngos.map((n) => (
                <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
              ))}
            </select>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">2. Vehicle Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle License Plate No *</label>
              <input
                type="text"
                required
                value={formData.Vehicle_no}
                onChange={(e) => setFormData({ ...formData, Vehicle_no: e.target.value.toUpperCase() })}
                placeholder="GJ-05-AB-1234"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type *</label>
              <select
                value={formData.Vehicle_type}
                onChange={(e) => setFormData({ ...formData, Vehicle_type: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {VEHICLE_TYPES.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payload Capacity (kg) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Capacity}
                onChange={(e) => setFormData({ ...formData, Capacity: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRefrig"
              checked={formData.Is_Refrigerated}
              onChange={(e) => setFormData({ ...formData, Is_Refrigerated: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="isRefrig" className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <Snowflake className="w-3.5 h-3.5 text-sky-500" />
              Equipped with Refrigerated / Thermal Storage Insulation
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2">
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
              Save Partner & Fleet
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Partner: ${activePartner?.Name}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type *</label>
              <select
                value={formData.Type}
                onChange={(e) => setFormData({ ...formData, Type: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="Volunteer">Volunteer</option>
                <option value="Partner">Partner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={formData.Phone}
                onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">License No</label>
              <input
                type="text"
                value={formData.License_no}
                onChange={(e) => setFormData({ ...formData, License_no: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">NGO Affiliation</label>
            <select
              value={formData.NGO_id}
              onChange={(e) => setFormData({ ...formData, NGO_id: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">Independent</option>
              {ngos.map((n) => (
                <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
              ))}
            </select>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">Vehicle Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Plate No *</label>
              <input
                type="text"
                required
                value={formData.Vehicle_no}
                onChange={(e) => setFormData({ ...formData, Vehicle_no: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type *</label>
              <select
                value={formData.Vehicle_type}
                onChange={(e) => setFormData({ ...formData, Vehicle_type: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {VEHICLE_TYPES.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payload Capacity (kg) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Capacity}
                onChange={(e) => setFormData({ ...formData, Capacity: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editRefrig"
              checked={formData.Is_Refrigerated}
              onChange={(e) => setFormData({ ...formData, Is_Refrigerated: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="editRefrig" className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <Snowflake className="w-3.5 h-3.5 text-sky-500" />
              Equipped with Refrigeration
            </label>
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
              Update Partner
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setPartnerDetails(null);
        }}
        title={`Partner Profile: ${activePartner?.Name}`}
        maxWidth="max-w-3xl"
      >
        {partnerDetails ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-500">Partner Type:</strong> {partnerDetails.Type}</div>
              <div><strong className="text-slate-500">Affiliation:</strong> {partnerDetails.ngoName || 'Independent'}</div>
              <div><strong className="text-slate-500">Phone:</strong> {partnerDetails.Phone}</div>
              <div><strong className="text-slate-500">Email:</strong> {partnerDetails.Email || 'N/A'}</div>
              <div><strong className="text-slate-500">License:</strong> {partnerDetails.License_no || 'N/A'}</div>
              <div>
                <strong className="text-slate-500">Vehicle:</strong> {partnerDetails.Vehicle_no} ({partnerDetails.Vehicle_type}, {partnerDetails.Capacity}kg capacity)
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">
                Deliveries Transported by this Partner ({partnerDetails.deliveries?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Delivery ID</th>
                      <th className="p-2.5">Food Item</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Destination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partnerDetails.deliveries?.length > 0 ? (
                      partnerDetails.deliveries.map((del) => (
                        <tr key={del.Delivery_id}>
                          <td className="p-2.5 font-mono">#{del.Delivery_id}</td>
                          <td className="p-2.5 font-medium">{del.Item_name}</td>
                          <td className="p-2.5">{del.Quantity} {del.Unit}</td>
                          <td className="p-2.5"><StatusBadge status={del.Status} /></td>
                          <td className="p-2.5">{del.destinationName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No deliveries logged for this partner yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">Loading details...</div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Partner Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to remove partner <strong className="text-slate-800">{activePartner?.Name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Deleting this partner will cascade delete their associated vehicle (`fk_vehicle_partner`). If the partner has logged deliveries, MySQL will prevent deletion.
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
