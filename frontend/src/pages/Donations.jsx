import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Clock,
  AlertTriangle,
  Building2,
  Warehouse,
  CheckCircle2,
  ChevronDown,
  Calendar
} from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const DONATION_STATUSES = ['Pending', 'Accepted', 'Collected', 'Delivered', 'Cancelled'];

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [donors, setDonors] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [storageUnits, setStorageUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedNgo, setSelectedNgo] = useState('');
  const [alert, setAlert] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeDonation, setActiveDonation] = useState(null);
  const [donationDetails, setDonationDetails] = useState(null);

  const [formData, setFormData] = useState({
    Donor_id: '',
    Item_id: '',
    Quantity: '',
    NGO_id: '',
    Unit_id: '',
    Pickup_window: '18:00 - 20:00',
    Pickup_DateTime: '',
    Status: 'Pending'
  });

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedNgo) params.ngoId = selectedNgo;

      const res = await api.get('/donations', { params });
      setDonations(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const [donorsRes, itemsRes, ngosRes, unitsRes] = await Promise.allSettled([
        api.get('/donors'),
        api.get('/food-items'),
        api.get('/ngos'),
        api.get('/storage-units')
      ]);
      if (donorsRes.status === 'fulfilled') setDonors(donorsRes.value.data || []);
      if (itemsRes.status === 'fulfilled') setFoodItems(itemsRes.value.data || []);
      if (ngosRes.status === 'fulfilled') setNgos(ngosRes.value.data || []);
      if (unitsRes.status === 'fulfilled') setStorageUnits(unitsRes.value.data || []);
    } catch (err) {
      console.error('Failed to load foreign key options:', err);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [search, selectedStatus, selectedNgo]);

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  const handleOpenCreate = () => {
    fetchDropdownOptions();
    setFormData({
      Donor_id: donors[0]?.Donor_id || '',
      Item_id: foodItems[0]?.Item_id || '',
      Quantity: '',
      NGO_id: '',
      Unit_id: '',
      Pickup_window: '18:00 - 20:00',
      Pickup_DateTime: '',
      Status: 'Pending'
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (donation) => {
    setActiveDonation(donation);
    setFormData({
      Donor_id: donation.Donor_id || '',
      Item_id: donation.Item_id || '',
      Quantity: donation.Quantity || '',
      NGO_id: donation.NGO_id || '',
      Unit_id: donation.Unit_id || '',
      Pickup_window: donation.Pickup_window || '',
      Pickup_DateTime: donation.Pickup_DateTime ? donation.Pickup_DateTime.slice(0, 16) : '',
      Status: donation.Status || 'Pending'
    });
    setIsEditOpen(true);
  };

  const handleOpenView = async (donation) => {
    setActiveDonation(donation);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/donations/${donation.Donation_id}`);
      setDonationDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleOpenDelete = (donation) => {
    setActiveDonation(donation);
    setIsDeleteOpen(true);
  };

  const handleQuickStatus = async (id, status) => {
    try {
      await api.patch(`/donations/${id}/status`, { Status: status });
      setAlert({ type: 'success', message: `Donation status updated to ${status}.` });
      fetchDonations();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/donations', formData);
      setAlert({ type: 'success', message: 'Food donation posted successfully to database.' });
      setIsCreateOpen(false);
      fetchDonations();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/donations/${activeDonation.Donation_id}`, formData);
      setAlert({ type: 'success', message: 'Donation details updated.' });
      setIsEditOpen(false);
      fetchDonations();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/donations/${activeDonation.Donation_id}`);
      setAlert({ type: 'success', message: 'Donation removed from database.' });
      setIsDeleteOpen(false);
      fetchDonations();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'ID & Food Item',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">
            {row.itemName}
          </div>
          <div className="text-slate-400 text-xs">
            <span className="font-mono">#{row.Donation_id}</span> • {row.category}
          </div>
        </div>
      )
    },
    {
      header: 'Donor Details',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{row.donorName}</div>
          <div className="text-slate-500">{row.donorType} • {row.donorPhone}</div>
        </div>
      )
    },
    {
      header: 'Quantity & Balance',
      render: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">
            {row.Quantity} {row.unit}
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5">
            Delivered: <span className="font-semibold text-emerald-600">{row.deliveredQuantity}</span> | Rem: <span className="font-semibold text-amber-600">{row.remainingQuantity}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Pickup & Expiry',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Window: {row.Pickup_window}
          </div>
          <div className={`flex items-center gap-1 text-[11px] ${row.isExpired ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
            <Clock className="w-3 h-3" />
            Expires: {row.Expiry_DateTime ? row.Expiry_DateTime.slice(0, 16) : 'N/A'}
            {row.isExpired && ' (EXPIRED)'}
          </div>
        </div>
      )
    },
    {
      header: 'Managing NGO & Unit',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <div>{row.ngoName || <span className="text-slate-400 italic">Unassigned NGO</span>}</div>
          <div className="text-[11px] text-slate-400">{row.unitName || 'No unit assigned'}</div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.Status} />
          {row.Status === 'Pending' && (
            <div>
              <button
                onClick={() => handleQuickStatus(row.Donation_id, 'Accepted')}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Mark Accepted
              </button>
            </div>
          )}
          {row.Status === 'Accepted' && (
            <div>
              <button
                onClick={() => handleQuickStatus(row.Donation_id, 'Collected')}
                className="text-[10px] font-bold text-purple-600 hover:underline"
              >
                Mark Collected
              </button>
            </div>
          )}
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
            title="View Details & Deliveries"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Donation"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete Donation"
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
        data={donations}
        loading={loading}
        searchPlaceholder="Search donations by donor, item, NGO..."
        searchValue={search}
        onSearch={setSearch}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
            >
              <option value="">All Statuses</option>
              {DONATION_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={selectedNgo}
              onChange={(e) => setSelectedNgo(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
            >
              <option value="">All NGOs</option>
              {ngos.map((n) => (
                <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
              ))}
            </select>
          </div>
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Create Donation
          </button>
        }
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Surplus Food Donation"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donor *</label>
              <select
                required
                value={formData.Donor_id}
                onChange={(e) => setFormData({ ...formData, Donor_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select Donor</option>
                {donors.map((d) => (
                  <option key={d.Donor_id} value={d.Donor_id}>
                    {d.Name} ({d.Donor_Type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Food Item *</label>
              <select
                required
                value={formData.Item_id}
                onChange={(e) => setFormData({ ...formData, Item_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select Food Item</option>
                {foodItems.map((fi) => (
                  <option key={fi.Item_id} value={fi.Item_id}>
                    {fi.Item_name} ({fi.Category} - in {fi.Unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Quantity}
                onChange={(e) => setFormData({ ...formData, Quantity: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[11px] text-slate-400">MySQL CHECK constraint requires Quantity &gt; 0</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Window *</label>
              <input
                type="text"
                required
                value={formData.Pickup_window}
                onChange={(e) => setFormData({ ...formData, Pickup_window: e.target.value })}
                placeholder="e.g. 18:00 - 20:30"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Managing NGO (Optional) {ngos.length > 0 && `(${ngos.length} available)`}
              </label>
              <select
                value={formData.NGO_id}
                onChange={(e) => setFormData({ ...formData, NGO_id: e.target.value, Unit_id: '' })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Unassigned (Direct Donation)</option>
                {ngos.map((n) => (
                  <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Unit (Optional)</label>
              <select
                value={formData.Unit_id}
                onChange={(e) => setFormData({ ...formData, Unit_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">None / Direct</option>
                {storageUnits
                  .filter((su) => !formData.NGO_id || su.NGO_id == formData.NGO_id)
                  .map((su) => (
                    <option key={su.Unit_id} value={su.Unit_id}>
                      {su.Unit_name} ({su.Storage_type})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.Status}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                {DONATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
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
              Post Donation
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Donation #${activeDonation?.Donation_id}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donor *</label>
              <select
                required
                value={formData.Donor_id}
                onChange={(e) => setFormData({ ...formData, Donor_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {donors.map((d) => (
                  <option key={d.Donor_id} value={d.Donor_id}>
                    {d.Name} ({d.Donor_Type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Food Item *</label>
              <select
                required
                value={formData.Item_id}
                onChange={(e) => setFormData({ ...formData, Item_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {foodItems.map((fi) => (
                  <option key={fi.Item_id} value={fi.Item_id}>
                    {fi.Item_name} ({fi.Unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Quantity}
                onChange={(e) => setFormData({ ...formData, Quantity: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Window *</label>
              <input
                type="text"
                required
                value={formData.Pickup_window}
                onChange={(e) => setFormData({ ...formData, Pickup_window: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Managing NGO</label>
              <select
                value={formData.NGO_id}
                onChange={(e) => setFormData({ ...formData, NGO_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="">Unassigned</option>
                {ngos.map((n) => (
                  <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Unit</label>
              <select
                value={formData.Unit_id}
                onChange={(e) => setFormData({ ...formData, Unit_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="">None</option>
                {storageUnits.map((su) => (
                  <option key={su.Unit_id} value={su.Unit_id}>{su.Unit_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.Status}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {DONATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
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
              Update Donation
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL WITH DELIVERY TRACKING */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setDonationDetails(null);
        }}
        title={`Donation Details & Deliveries #${activeDonation?.Donation_id}`}
        maxWidth="max-w-3xl"
      >
        {donationDetails ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-500">Food Item:</strong> {donationDetails.itemName} ({donationDetails.category})</div>
              <div><strong className="text-slate-500">Status:</strong> <StatusBadge status={donationDetails.Status} /></div>
              <div><strong className="text-slate-500">Quantity Donated:</strong> {donationDetails.Quantity} {donationDetails.unit}</div>
              <div><strong className="text-slate-500">Donation Time:</strong> {donationDetails.Donation_DateTime?.slice(0, 16)}</div>
              <div><strong className="text-slate-500">Calculated Expiry:</strong> {donationDetails.Expiry_DateTime?.slice(0, 16)}</div>
              <div><strong className="text-slate-500">Managing NGO:</strong> {donationDetails.ngoName || 'None'}</div>
              <div><strong className="text-slate-500">Donor:</strong> {donationDetails.donorName} ({donationDetails.donorPhone})</div>
              <div><strong className="text-slate-500">Pickup Window:</strong> {donationDetails.Pickup_window}</div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">
                Deliveries Dispatched from this Donation ({donationDetails.deliveries?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Delivery ID</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Destination</th>
                      <th className="p-2.5">Partner & Fleet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donationDetails.deliveries?.length > 0 ? (
                      donationDetails.deliveries.map((del) => (
                        <tr key={del.Delivery_id}>
                          <td className="p-2.5 font-mono">#{del.Delivery_id}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{del.Quantity}</td>
                          <td className="p-2.5"><StatusBadge status={del.Status} /></td>
                          <td className="p-2.5">
                            <span className="font-semibold text-slate-700">{del.destinationName}</span>
                            <span className="text-[10px] text-slate-400 block">({del.destinationType})</span>
                          </td>
                          <td className="p-2.5">
                            {del.partnerName} {del.vehicleNo ? `(${del.vehicleNo})` : ''}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No deliveries dispatched for this donation yet.
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
        title="Confirm Donation Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete donation{' '}
            <strong className="text-slate-800">#{activeDonation?.Donation_id}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            MySQL constraint: Deliveries linked to this donation (`fk_delivery_donation`) cannot be orphaned. Deleting will fail if delivery records exist.
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
