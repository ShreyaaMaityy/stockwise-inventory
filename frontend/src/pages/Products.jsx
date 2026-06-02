import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X,
  AlertCircle
} from 'lucide-react';
import productService from '../services/productService';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useNotification } from '../hooks/useNotification';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency, formatDate } from '../utils/formatters';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Deletion confirm states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    sku: '',
    price: '',
    quantity_in_stock: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const { addNotification } = useNotification();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      addNotification(err.message || 'Failed to fetch products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (p) => 
          p.name.toLowerCase().includes(term) || 
          p.sku.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const handleOpenAdd = () => {
    setFormData({
      id: null,
      name: '',
      sku: '',
      price: '',
      quantity_in_stock: '0'
    });
    setFormErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (product) => {
    setFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity_in_stock: product.quantity_in_stock.toString()
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a valid number greater than 0';
    }
    
    const stockNum = parseInt(formData.quantity_in_stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      errors.quantity_in_stock = 'Stock quantity cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      await productService.createProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price),
        quantity_in_stock: parseInt(formData.quantity_in_stock, 10)
      });
      addNotification('Product created successfully!', 'success');
      setIsAddOpen(false);
      fetchProducts();
    } catch (err) {
      addNotification(err.message || 'Failed to create product.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await productService.updateProduct(formData.id, {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price),
        quantity_in_stock: parseInt(formData.quantity_in_stock, 10)
      });
      addNotification('Product updated successfully!', 'success');
      setIsEditOpen(false);
      fetchProducts();
    } catch (err) {
      addNotification(err.message || 'Failed to update product.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleteLoading(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      addNotification('Product deleted successfully.', 'success');
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      addNotification(err.message || 'Failed to delete product.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Product Inventory
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Manage your catalog items, check stock levels, and assign SKUs.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-lg shadow-sky-950/20 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Add Product
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search products by Name or SKU..."
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

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-sky-500/10 rounded-full blur-xl animate-pulse" />
              <div className="relative p-4 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Package className="h-10 w-10 stroke-[1.5]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Inventory Catalog is Empty</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-2 font-medium leading-relaxed">
              Get started by adding items to your product registry. Assign SKUs, pricing, and stock levels to begin.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Add First Product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-slate-800/20 rounded-full blur-xl" />
              <div className="relative p-4 rounded-2xl bg-slate-900/60 text-slate-400 border border-slate-800">
                <Search className="h-10 w-10 stroke-[1.5]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">No Products Match Search</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-2 font-medium leading-relaxed">
              We couldn't find any results matching <span className="font-mono text-sky-400">"{searchTerm}"</span>. Check spelling or try other keywords.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-6 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Clear Search Query
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold text-xs tracking-wider uppercase select-none">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Stock</th>
                  <th className="px-6 py-4">Added Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className="hover:bg-slate-900/30 transition-colors group"
                  >
                    <td className="px-6 py-4.5 text-white font-bold">{product.name}</td>
                    <td className="px-6 py-4.5">
                      <span className="font-mono text-slate-400 text-xs bg-slate-900 px-2 py-1 rounded border border-slate-800/60 uppercase">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right text-slate-200">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4.5 text-right">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        product.quantity_in_stock === 0
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : product.quantity_in_stock <= 10
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {product.quantity_in_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-slate-400">{formatDate(product.created_at)}</td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-all"
                          title="Edit Details"
                        >
                          <Edit2 className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                          title="Delete Catalog Item"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isAddOpen ? 'Add New Product' : 'Edit Product Details'}
      >
        <form onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Product Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${formErrors.name ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium text-sm`}
              placeholder="e.g. Ergonomic Office Chair"
            />
            {formErrors.name && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SKU / Code</label>
            <input
              type="text"
              required
              disabled={isEditOpen}
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${formErrors.sku ? 'border-rose-500' : 'border-slate-800'} ${isEditOpen ? 'opacity-50 cursor-not-allowed' : ''} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium text-sm`}
              placeholder="e.g. CHAIR-ERG-BLK"
            />
            {formErrors.sku && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.sku}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price ($ USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${formErrors.price ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium text-sm`}
                placeholder="0.00"
              />
              {formErrors.price && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity in Stock</label>
              <input
                type="number"
                step="1"
                required
                value={formData.quantity_in_stock}
                onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${formErrors.quantity_in_stock ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium text-sm`}
                placeholder="0"
              />
              {formErrors.quantity_in_stock && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.quantity_in_stock}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800/60 pt-5 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-300 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-sm font-bold text-white transition-all shadow-md shadow-sky-950/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Catalog Product"
        message={`Are you sure you want to remove "${productToDelete?.name}" (SKU: ${productToDelete?.sku}) from the catalog? This action will fail if this product is referenced in existing customer orders.`}
      />
    </div>
  );
};

export default Products;
