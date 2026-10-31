import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Phone, Mail, MapPin, Building, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const DONOR_TYPES = ['Restaurant', 'Hotel', 'Individual', 'Supermarket', 'Event Organizer', 'Bakery', 'Catering'];

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeDonor, setActiveDonor] = useState(null);
  const [donorDetails, setDonorDetails] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    Name: '',
    Phone: '',
    Email: '',
    FSSAI_License_No: '',
    Address: '',
    Donor_Type: 'Restaurant'
  });

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedType) params.donorType = selectedType;

      const res = await api.get('/donors', { params });
      setDonors(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [search, selectedType]);

  const handleOpenCreate = () => {
    setFormData({
      Name: '',
      Phone: '',
      Email: '',
      FSSAI_License_No: '',
      Address: '',
      Donor_Type: 'Restaurant'
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (donor) => {
    setActiveDonor(donor);
    setFormData({
      Name: donor.Name || '',
      Phone: donor.Phone || '',
      Email: donor.Email || '',
      FSSAI_License_No: donor.FSSAI_License_No || '',
      Address: donor.Address || '',
      Donor_Type: donor.Donor_Type || 'Restaurant'
    });
    setIsEditOpen(true);
  };

  const handleOpenView = async (donor) => {
    setActiveDonor(donor);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/donors/${donor.Donor_id}`);
      setDonorDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleOpenDelete = (donor) => {
    setActiveDonor(donor);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/donors', formData);
      setAlert({ type: 'success', message: 'Donor added successfully to MySQL.' });
      setIsCreateOpen(false);
      fetchDonors();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/donors/${activeDonor.Donor_id}`, formData);
      setAlert({ type: 'success', message: 'Donor updated successfully.' });
      setIsEditOpen(false);
      fetchDonors();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/donors/${activeDonor.Donor_id}`);
      setAlert({ type: 'success', message: 'Donor deleted successfully from database.' });
      setIsDeleteOpen(false);
      fetchDonors();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'Donor Name & Type',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.Name}</div>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 mt-0.5">
            {row.Donor_Type}
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
      header: 'Address & FSSAI',
      render: (row) => (
        <div className="text-xs max-w-xs truncate text-slate-600">
          <div className="truncate" title={row.Address}>{row.Address}</div>
          {row.FSSAI_License_No ? (
            <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              FSSAI: {row.FSSAI_License_No}
            </div>
          ) : (
            <div className="text-slate-400 text-[11px] mt-0.5">FSSAI: N/A</div>
          )}
        </div>
      )
    },
    {
      header: 'Donation Stats',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-700">{row.totalDonations}</span> donations
          <div className="text-slate-400 text-[11px]">{row.totalQuantityDonated} total units</div>
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
            title="View Details & History"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Donor"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete Donor"
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
        data={donors}
        loading={loading}
        searchPlaceholder="Search donors by name, phone, address..."
        searchValue={search}
        onSearch={setSearch}
        filters={
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
          >
            <option value="">All Donor Types</option>
            {DONOR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all shadow-emerald-950/20"
          >
            <Plus className="w-4 h-4" /> Add Donor
          </button>
        }
      />

      {/* CREATE DONOR MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Food Donor"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donor Name *</label>
              <input
                type="text"
                required
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                placeholder="e.g. Grand Heritage Hotel"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donor Type *</label>
              <select
                value={formData.Donor_Type}
                onChange={(e) => setFormData({ ...formData, Donor_Type: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {DONOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.Phone}
                onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                placeholder="donor@example.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              FSSAI License No (Optional for individuals)
            </label>
            <input
              type="text"
              value={formData.FSSAI_License_No}
              onChange={(e) => setFormData({ ...formData, FSSAI_License_No: e.target.value })}
              placeholder="14-digit FSSAI number"
              maxLength={14}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Complete Address *</label>
            <textarea
              required
              rows={2}
              value={formData.Address}
              onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
              placeholder="Street, Landmark, City, Pincode"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
            >
              Save to Database
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT DONOR MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Donor: ${activeDonor?.Name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donor Name *</label>
              <input
                type="text"
                required
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donor Type *</label>
              <select
                value={formData.Donor_Type}
                onChange={(e) => setFormData({ ...formData, Donor_Type: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {DONOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.Phone}
                onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">FSSAI License No</label>
            <input
              type="text"
              value={formData.FSSAI_License_No}
              onChange={(e) => setFormData({ ...formData, FSSAI_License_No: e.target.value })}
              maxLength={14}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Complete Address *</label>
            <textarea
              required
              rows={2}
              value={formData.Address}
              onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
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
              Update Donor
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS & DONATION HISTORY MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setDonorDetails(null);
        }}
        title="Donor Profile & Donation History"
        maxWidth="max-w-3xl"
      >
        {donorDetails ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-500">Name:</strong> {donorDetails.Name}</div>
              <div><strong className="text-slate-500">Type:</strong> {donorDetails.Donor_Type}</div>
              <div><strong className="text-slate-500">Phone:</strong> {donorDetails.Phone}</div>
              <div><strong className="text-slate-500">Email:</strong> {donorDetails.Email || 'N/A'}</div>
              <div><strong className="text-slate-500">FSSAI:</strong> {donorDetails.FSSAI_License_No || 'N/A'}</div>
              <div><strong className="text-slate-500">Address:</strong> {donorDetails.Address}</div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">
                Donation History ({donorDetails.donations?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Food Item</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Donated At</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Managing NGO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donorDetails.donations?.length > 0 ? (
                      donorDetails.donations.map((d) => (
                        <tr key={d.Donation_id}>
                          <td className="p-2.5 font-mono">#{d.Donation_id}</td>
                          <td className="p-2.5 font-medium">{d.Item_name} ({d.Category})</td>
                          <td className="p-2.5">{d.Quantity} {d.Unit}</td>
                          <td className="p-2.5">{d.Donation_DateTime?.slice(0, 16)}</td>
                          <td className="p-2.5"><StatusBadge status={d.Status} /></td>
                          <td className="p-2.5">{d.ngoName || 'Unassigned'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          No donations recorded for this donor yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">Loading donor details...</div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Donor Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete donor{' '}
            <strong className="text-slate-800">{activeDonor?.Name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Note: If this donor has existing food donations recorded, MySQL foreign key constraints (`fk_donation_donor`) will safely block the deletion.
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
