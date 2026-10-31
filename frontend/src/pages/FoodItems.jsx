import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Tag, Scale } from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const COMMON_CATEGORIES = ['Cooked', 'Raw', 'Packaged', 'Bakery', 'Dairy', 'Beverages', 'Fruits & Vegetables'];
const COMMON_UNITS = ['kg', 'litre', 'plate', 'packet', 'box', 'tray', 'piece'];

export default function FoodItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [alert, setAlert] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeItem, setActiveItem] = useState(null);

  const [formData, setFormData] = useState({
    Item_name: '',
    Category: 'Cooked',
    Unit: 'kg',
    Expiry_Period_Hours: 6
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get('/food-items', { params });
      setItems(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/food-items/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      Item_name: '',
      Category: 'Cooked',
      Unit: 'kg',
      Expiry_Period_Hours: 6
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item) => {
    setActiveItem(item);
    setFormData({
      Item_name: item.Item_name || '',
      Category: item.Category || 'Cooked',
      Unit: item.Unit || 'kg',
      Expiry_Period_Hours: item.Expiry_Period_Hours || 6
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (item) => {
    setActiveItem(item);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/food-items', formData);
      setAlert({ type: 'success', message: 'Food item catalog entry created.' });
      setIsCreateOpen(false);
      fetchItems();
      fetchCategories();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/food-items/${activeItem.Item_id}`, formData);
      setAlert({ type: 'success', message: 'Food item updated.' });
      setIsEditOpen(false);
      fetchItems();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/food-items/${activeItem.Item_id}`);
      setAlert({ type: 'success', message: 'Food item deleted from catalog.' });
      setIsDeleteOpen(false);
      fetchItems();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'Food Item Name',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{row.Item_name}</div>
          <div className="text-slate-400 text-xs font-mono">ID: #{row.Item_id}</div>
        </div>
      )
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Tag className="w-3 h-3" /> {row.Category}
        </span>
      )
    },
    {
      header: 'Standard Unit',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Scale className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{row.Unit}</span>
        </div>
      )
    },
    {
      header: 'Expiry Shelf Life',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-bold">{row.Expiry_Period_Hours}</span> hours after prep
        </div>
      )
    },
    {
      header: 'Rescue Volume',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{row.totalDonations}</span> donations
          <div className="text-slate-400 text-[11px]">{row.totalQuantityDonated} {row.Unit} total</div>
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Item"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete Item"
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
        data={items}
        loading={loading}
        searchPlaceholder="Search food items by name, category, unit..."
        searchValue={search}
        onSearch={setSearch}
        filters={
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Food Item
          </button>
        }
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Food Item to Catalog"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.Item_name}
              onChange={(e) => setFormData({ ...formData, Item_name: e.target.value })}
              placeholder="e.g. Cooked Rice & Dal Combo"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                list="category-suggestions"
                required
                value={formData.Category}
                onChange={(e) => setFormData({ ...formData, Category: e.target.value })}
                placeholder="Cooked, Bakery, etc."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
              <datalist id="category-suggestions">
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Measuring Unit *</label>
              <input
                type="text"
                list="unit-suggestions"
                required
                value={formData.Unit}
                onChange={(e) => setFormData({ ...formData, Unit: e.target.value })}
                placeholder="kg, plate, packet..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
              <datalist id="unit-suggestions">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expiry Shelf Life (Hours) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.Expiry_Period_Hours}
              onChange={(e) => setFormData({ ...formData, Expiry_Period_Hours: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used in the schema to derive donation expiry: <code>Donation_DateTime + INTERVAL Expiry_Period_Hours HOUR</code>.
            </p>
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
              Save Item
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Food Item: ${activeItem?.Item_name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.Item_name}
              onChange={(e) => setFormData({ ...formData, Item_name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                value={formData.Category}
                onChange={(e) => setFormData({ ...formData, Category: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Measuring Unit *</label>
              <input
                type="text"
                required
                value={formData.Unit}
                onChange={(e) => setFormData({ ...formData, Unit: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Shelf Life (Hours) *</label>
            <input
              type="number"
              min="1"
              required
              value={formData.Expiry_Period_Hours}
              onChange={(e) => setFormData({ ...formData, Expiry_Period_Hours: e.target.value })}
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
              Update Item
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Item Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong className="text-slate-800">{activeItem?.Item_name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            MySQL constraint: Items referenced in food donations (`fk_donation_item`) cannot be deleted due to `ON DELETE RESTRICT`.
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
