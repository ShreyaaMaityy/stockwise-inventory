import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Eye, 
  PlusCircle, 
  AlertCircle
} from 'lucide-react';
import orderService from '../services/orderService';
import productService from '../services/productService';
import customerService from '../services/customerService';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/formatters';
import ConfirmModal from '../components/ConfirmModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, max_stock: 0, price: 0, subtotal: 0 }
  ]);
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Cancellation confirm states
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, customersData] = await Promise.all([
        orderService.getOrders(),
        productService.getProducts(),
        customerService.getCustomers()
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (err) {
      addNotification(err.message || 'Failed to fetch directory data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1, max_stock: 0, price: 0, subtotal: 0 }]);
    setFormErrors({});
    setIsAddOpen(true);
  };

  const handleAddRow = () => {
    setOrderItems([
      ...orderItems,
      { product_id: '', quantity: 1, max_stock: 0, price: 0, subtotal: 0 }
    ]);
  };

  const handleRemoveRow = (index) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    
    if (field === 'product_id') {
      const prodId = parseInt(value, 10);
      const selectedProd = products.find((p) => p.id === prodId);
      
      updated[index] = {
        ...updated[index],
        product_id: value,
        max_stock: selectedProd ? selectedProd.quantity_in_stock : 0,
        price: selectedProd ? parseFloat(selectedProd.price) : 0,
        subtotal: selectedProd ? parseFloat(selectedProd.price) * updated[index].quantity : 0
      };
    } else if (field === 'quantity') {
      const qty = Math.max(1, parseInt(value, 10) || 1);
      updated[index] = {
        ...updated[index],
        quantity: qty,
        subtotal: updated[index].price * qty
      };
    }

    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedCustomerId) {
      errors.customer = 'Please select a customer';
    }

    const productIds = new Set();
    const itemErrors = [];

    orderItems.forEach((item, index) => {
      const errs = {};
      if (!item.product_id) {
        errs.product = 'Select a product';
      } else if (productIds.has(item.product_id)) {
        errs.product = 'Duplicate product selected';
      } else {
        productIds.add(item.product_id);
      }

      if (item.quantity <= 0) {
        errs.quantity = 'Quantity must be > 0';
      } else if (item.product_id && item.quantity > item.max_stock) {
        errs.quantity = `Exceeds stock limit (${item.max_stock})`;
      }

      if (Object.keys(errs).length > 0) {
        itemErrors[index] = errs;
      }
    });

    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await orderService.createOrder({
        customer_id: parseInt(selectedCustomerId, 10),
        items: orderItems.map((item) => ({
          product_id: parseInt(item.product_id, 10),
          quantity: item.quantity
        }))
      });

      addNotification('Order processed and stock adjusted!', 'success');
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      addNotification(err.message || 'Failed to place order.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCancel = (order) => {
    setOrderToCancel(order);
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancelLoading(true);
    try {
      await orderService.deleteOrder(orderToCancel.id);
      addNotification('Order cancelled, stock restored.', 'success');
      setCancelConfirmOpen(false);
      setOrderToCancel(null);
      fetchData();
    } catch (err) {
      addNotification(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Order Registry
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Track order fulfillments, calculate balances, and cancel transactions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-lg shadow-sky-950/20 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Create Order
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
              <div className="relative p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShoppingCart className="h-10 w-10 stroke-[1.5]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Order Registry is Empty</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-2 font-medium leading-relaxed">
              No order transactions processed yet. Manage sales, track fulfillment, and automatically adjust stock levels here.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Create First Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold text-xs tracking-wider uppercase select-none">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-right">Items Count</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium">
                {orders.map((order) => {
                  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4.5 font-mono text-xs text-slate-400">#ORD-{String(order.id).padStart(5, '0')}</td>
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{order.customer_name}</span>
                          <span className="text-xs text-slate-500">{order.customer_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right text-slate-200">{itemsCount}</td>
                      <td className="px-6 py-4.5 text-right text-emerald-400 font-bold">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4.5 text-slate-400">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-all"
                            title="View Receipt Details"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleOpenCancel(order)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                            title="Cancel & Delete Order"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Order & Deduct Stock"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Customer</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${formErrors.customer ? 'border-rose-500' : 'border-slate-800'} text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-semibold text-sm`}
            >
              <option value="">-- Choose Client Profile --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
            {formErrors.customer && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.customer}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items</span>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" /> Add Item Row
              </button>
            </div>

            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
              {orderItems.map((item, idx) => {
                const rowErrors = formErrors.items?.[idx] || {};
                
                return (
                  <div 
                    key={idx} 
                    className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 relative"
                  >
                    <div className="flex-1 w-full">
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg bg-slate-950 border ${rowErrors.product ? 'border-rose-500' : 'border-slate-850'} text-slate-200 focus:outline-none focus:border-sky-500 text-xs font-medium`}
                      >
                        <option value="">-- Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku}) - {formatCurrency(p.price)}
                          </option>
                        ))}
                      </select>
                      {item.product_id && (
                        <p className="text-[10px] font-semibold text-slate-500 mt-1 pl-1">
                          Available Stock: <span className={item.max_stock === 0 ? 'text-rose-400' : 'text-slate-300'}>{item.max_stock}</span>
                        </p>
                      )}
                      {rowErrors.product && (
                        <p className="mt-1 text-[10px] text-rose-400 flex items-center gap-0.5"><AlertCircle className="h-2.5 w-2.5" />{rowErrors.product}</p>
                      )}
                    </div>

                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg bg-slate-950 border ${rowErrors.quantity ? 'border-rose-500' : 'border-slate-850'} text-slate-200 text-center focus:outline-none focus:border-sky-500 text-xs font-medium`}
                      />
                      {rowErrors.quantity && (
                        <p className="mt-1 text-[10px] text-rose-400 leading-tight"><AlertCircle className="h-2.5 w-2.5 inline mr-0.5" />{rowErrors.quantity}</p>
                      )}
                    </div>

                    <div className="w-24 text-right shrink-0 text-slate-300 font-bold text-xs">
                      {formatCurrency(item.subtotal)}
                    </div>

                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-900/60 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Amount Owed:</span>
            <span className="text-xl font-black text-emerald-400">{formatCurrency(calculateTotal())}</span>
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
              disabled={submitting || orderItems.length === 0}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-md shadow-sky-950/20 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onClose={() => {
          setCancelConfirmOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        loading={cancelLoading}
        title="Cancel Order"
        message={`Are you sure you want to cancel Order #ORD-${String(orderToCancel?.id).padStart(5, '0')} for ${orderToCancel?.customer_name}? Product stock counts from this order will be automatically restored to the inventory.`}
      />
    </div>
  );
};

export default Orders;
