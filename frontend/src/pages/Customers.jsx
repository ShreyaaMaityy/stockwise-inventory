import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  X,
  AlertCircle,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import customerService from '../services/customerService';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/formatters';
import ConfirmModal from '../components/ConfirmModal';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Deletion confirm states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const { addNotification } = useNotification();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      addNotification(err.message || 'Failed to fetch customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (c) => 
          c.full_name.toLowerCase().includes(term) || 
          c.email.toLowerCase().includes(term)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      email: '',
      phone_number: ''
    });
    setFormErrors({});
    setIsAddOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    
    const emailClean = formData.email.trim();
    if (!emailClean) {
      errors.email = 'Email address is required';
    } else if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(emailClean)) {
      errors.email = 'Please enter a valid email format';
    }

    if (!formData.phone_number.trim()) errors.phone_number = 'Phone number is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      await customerService.createCustomer({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim()
      });
      addNotification('Customer profile added successfully!', 'success');
      setIsAddOpen(false);
      fetchCustomers();
    } catch (err) {
      addNotification(err.message || 'Failed to create customer.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleteLoading(true);
    try {
      await customerService.deleteCustomer(customerToDelete.id);
      addNotification('Customer and associated orders deleted.', 'success');
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      addNotification(err.message || 'Failed to delete customer.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Customers Directory
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Manage your client directory, trace purchase channels, and view profile details.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-lg shadow-sky-950/20 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Add Customer
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search customers by Name or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Spinner size="lg" />
        </div>
      ) : customers.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center px-6 rounded-2xl border border-slate-800/60 bg-slate-900/10 backdrop-blur-md">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
            <div className="relative p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-10 w-10 stroke-[1.5]" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Customer Directory is Empty</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-2 font-medium leading-relaxed">
            Begin building your customer directory. Register profiles here to assign orders and track buyers.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Register First Customer
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center px-6 rounded-2xl border border-slate-800/60 bg-slate-900/10 backdrop-blur-md">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-slate-800/20 rounded-full blur-xl" />
            <div className="relative p-4 rounded-2xl bg-slate-900/60 text-slate-400 border border-slate-800">
              <Search className="h-10 w-10 stroke-[1.5]" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">No Customers Match Search</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-2 font-medium leading-relaxed">
            We couldn't find any results matching <span className="font-mono text-sky-400">"{searchTerm}"</span>. Double check spelling or try other names.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-6 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Clear Search Query
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id} 
              className="rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700/60 p-6 flex flex-col justify-between shadow-lg transition-all hover:-translate-y-1 duration-300 group"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-lg select-none">
                    {customer.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <button
                    onClick={() => handleOpenDelete(customer)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove Profile"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <h3 className="font-extrabold text-lg text-white mt-4">{customer.full_name}</h3>
                
                <div className="space-y-2 mt-4 text-sm text-slate-400 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{customer.phone_number}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                <span>Registered: {formatDate(customer.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${formErrors.full_name ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium text-sm`}
              placeholder="e.g. John Doe"
            />
            {formErrors.full_name && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${formErrors.email ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium text-sm`}
              placeholder="e.g. john.doe@example.com"
            />
            {formErrors.email && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              type="tel"
              required
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${formErrors.phone_number ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium text-sm`}
              placeholder="e.g. +1 (555) 123-4567"
            />
            {formErrors.phone_number && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.phone_number}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800/60 pt-5 mt-6">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-300 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-md shadow-sky-950/20 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete customer "${customerToDelete?.full_name}"? WARNING: This will delete all orders placed by this customer and restore their stock levels. This action is irreversible.`}
      />
    </div>
  );
};

export default Customers;
