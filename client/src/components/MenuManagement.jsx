import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Search, Edit2, Trash2, Image as ImageIcon, DollarSign, Tag, CheckCircle, XCircle } from 'lucide-react'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import apiClient from '../services/api'
import { menuAPI, clearCache } from '../services/api'

export const MenuManagement = () => {
  const navigate = useNavigateWithParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  // Tabs: products | categories | subcategories
  const [activeTab, setActiveTab] = useState('products')

  // Subcategories for management tab
  const [allSubcategories, setAllSubcategories] = useState([])

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '', sort_order: 0 })

  // Subcategory modal state
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', icon: '', sort_order: 0, category_id: '' })

  // Inline quick-add states for product modal
  const [showInlineCategoryForm, setShowInlineCategoryForm] = useState(false)
  const [inlineCategoryName, setInlineCategoryName] = useState('')
  const [showInlineSubcategoryForm, setShowInlineSubcategoryForm] = useState(false)
  const [inlineSubcategoryName, setInlineSubcategoryName] = useState('')

  useEffect(() => {
    if (showAddModal || showCategoryModal || showSubcategoryModal) {
      document.body.setAttribute('data-lenis-stop', 'true')
    } else {
      document.body.removeAttribute('data-lenis-stop')
    }

    return () => {
      document.body.removeAttribute('data-lenis-stop')
    }
  }, [showAddModal, showCategoryModal, showSubcategoryModal])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    subcategory_id: '',
    image_url: '',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    allergens: '',
  })

  // Subcategories for selected category in form
  const [formSubcategories, setFormSubcategories] = useState([])

  // Load subcategories when category changes in form
  useEffect(() => {
    if (!formData.category_id) {
      setFormSubcategories([])
      return
    }
    const loadSubs = async () => {
      try {
        const res = await menuAPI.getSubcategories(formData.category_id)
        if (res.data.success) {
          setFormSubcategories(res.data.data || [])
        }
      } catch (e) {
        console.error('Failed to load subcategories', e)
      }
    }
    loadSubs()
  }, [formData.category_id])

  // Fetch products and categories
  useEffect(() => {
    fetchData()
  }, [])

  // Load all subcategories when tab changes to subcategories
  useEffect(() => {
    if (activeTab === 'subcategories') {
      loadAllSubcategories()
    }
  }, [activeTab, categories])


  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('[MenuManagement] Fetching menu data...')
      const [productsRes, categoriesRes] = await Promise.all([
        menuAPI.getMenu(),
        menuAPI.getCategories(),
      ])

      console.log('[MenuManagement] Products response:', productsRes.data)
      console.log('[MenuManagement] Categories response:', categoriesRes.data)

      if (productsRes.data.success) {
        // Flatten hierarchical menu data to extract all products
        const menuData = productsRes.data.data || []
        const allProducts = []
        menuData.forEach(category => {
          if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
              if (subcategory.products) {
                subcategory.products.forEach(product => {
                  allProducts.push({
                    ...product,
                    category_id: category.id,
                    subcategory_id: subcategory.id
                  })
                })
              }
            })
          }
        })
        setProducts(allProducts)
      }
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data || [])
      }
    } catch (error) {
      console.error('[MenuManagement] Failed to fetch menu data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('[MenuManagement] Form submit - editingProduct:', editingProduct)

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : undefined,
        allergens: typeof formData.allergens === 'string'
          ? formData.allergens.split(',').map(a => a.trim()).filter(Boolean)
          : formData.allergens || [],
        image_url: formData.image_url || undefined,
        is_available: formData.is_available,
        is_vegetarian: formData.is_vegetarian,
        is_spicy: formData.is_spicy,
      }
      console.log('[MenuManagement] Submitting data:', data)

      if (editingProduct) {
        console.log('[MenuManagement] Updating product:', editingProduct.id)
        await menuAPI.updateProduct(editingProduct.id, data)
      } else {
        console.log('[MenuManagement] Creating new product')
        await menuAPI.createProduct(data)
      }

      setShowAddModal(false)
      setEditingProduct(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('[MenuManagement] Failed to save product:', error)
      alert('Failed to save product')
    }
  }

  const handleDelete = async (id) => {
    console.log('[MenuManagement] Delete clicked for product id:', id)
    if (!confirm('Are you sure you want to delete this product?')) {
      console.log('[MenuManagement] Delete cancelled by user')
      return
    }

    try {
      console.log('[MenuManagement] Calling deleteProduct API for id:', id)
      console.log('[MenuManagement] Delete URL:', `/menu/${id}`)
      const response = await menuAPI.deleteProduct(id)
      console.log('[MenuManagement] Delete API response:', response)
      // Clear cache to ensure fresh data fetch
      clearCache()
      fetchData()
    } catch (error) {
      console.error('[MenuManagement] Failed to delete product:', error)
      console.error('[MenuManagement] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      })
      alert(`Failed to delete product: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleEdit = async (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id?.toString() || '',
      subcategory_id: product.subcategory_id?.toString() || '',
      image_url: product.image_url || product.imageUrl || '',
      is_available: product.is_available ?? product.isAvailable ?? true,
      is_vegetarian: product.is_vegetarian ?? product.isVegetarian ?? false,
      is_spicy: product.is_spicy ?? product.isSpicy ?? false,
      allergens: (product.allergens || []).join(', '),
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      subcategory_id: '',
      image_url: '',
      is_available: true,
      is_vegetarian: false,
      is_spicy: false,
      allergens: '',
    })
    setFormSubcategories([])
  }

  // Inline handlers for quick-add inside product modal
  const handleInlineCategoryAdd = async () => {
    if (!inlineCategoryName.trim()) return
    try {
      const res = await menuAPI.createCategory({
        name: inlineCategoryName.trim(),
        icon: '',
        sort_order: categories.length,
      })
      if (res.data.success) {
        const newCat = res.data.data
        setCategories([...categories, newCat])
        setFormData({ ...formData, category_id: newCat.id.toString() })
        setInlineCategoryName('')
        setShowInlineCategoryForm(false)
      }
    } catch (error) {
      console.error('Failed to create category inline:', error)
      alert('Failed to create category')
    }
  }

  const handleInlineSubcategoryAdd = async () => {
    if (!inlineSubcategoryName.trim() || !formData.category_id) return
    try {
      const res = await menuAPI.createSubcategory({
        name: inlineSubcategoryName.trim(),
        icon: '',
        sort_order: formSubcategories.length,
        category_id: parseInt(formData.category_id, 10),
      })
      if (res.data.success) {
        const newSub = res.data.data
        setFormSubcategories([...formSubcategories, newSub])
        setFormData({ ...formData, subcategory_id: newSub.id.toString() })
        setInlineSubcategoryName('')
        setShowInlineSubcategoryForm(false)
      }
    } catch (error) {
      console.error('Failed to create subcategory inline:', error)
      alert('Failed to create subcategory')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category_id?.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Category handlers
  const loadAllSubcategories = async () => {
    try {
      const allSubs = []
      for (const cat of categories) {
        const res = await menuAPI.getSubcategories(cat.id)
        if (res.data.success) {
          (res.data.data || []).forEach(sub => {
            allSubs.push({ ...sub, category_name: cat.name })
          })
        }
      }
      setAllSubcategories(allSubs)
    } catch (e) {
      console.error('Failed to load all subcategories', e)
    }
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        name: categoryForm.name,
        icon: categoryForm.icon || '',
        sort_order: parseInt(categoryForm.sort_order) || 0,
      }
      if (editingCategory) {
        await menuAPI.updateCategory(editingCategory.id, data)
      } else {
        await menuAPI.createCategory(data)
      }
      setShowCategoryModal(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', icon: '', sort_order: 0 })
      fetchData()
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('Failed to save category')
    }
  }

  const handleCategoryDelete = async (id) => {
    if (!confirm('Delete this category? Products under it may become inaccessible.')) return
    try {
      await menuAPI.deleteCategory(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  const handleCategoryEdit = (cat) => {
    setEditingCategory(cat)
    setCategoryForm({
      name: cat.name,
      icon: cat.icon || '',
      sort_order: cat.sort_order || 0,
    })
    setShowCategoryModal(true)
  }

  // Subcategory handlers
  const handleSubcategorySubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        name: subcategoryForm.name,
        icon: subcategoryForm.icon || '',
        sort_order: parseInt(subcategoryForm.sort_order) || 0,
        category_id: parseInt(subcategoryForm.category_id),
      }
      if (editingSubcategory) {
        await menuAPI.updateSubcategory(editingSubcategory.id, data)
      } else {
        await menuAPI.createSubcategory(data)
      }
      setShowSubcategoryModal(false)
      setEditingSubcategory(null)
      setSubcategoryForm({ name: '', icon: '', sort_order: 0, category_id: '' })
      loadAllSubcategories()
      fetchData()
    } catch (error) {
      console.error('Failed to save subcategory:', error)
      alert('Failed to save subcategory')
    }
  }

  const handleSubcategoryDelete = async (id) => {
    if (!confirm('Delete this subcategory? Products under it may become inaccessible.')) return
    try {
      await menuAPI.deleteSubcategory(id)
      loadAllSubcategories()
      fetchData()
    } catch (error) {
      console.error('Failed to delete subcategory:', error)
      alert('Failed to delete subcategory')
    }
  }

  const handleSubcategoryEdit = (sub) => {
    setEditingSubcategory(sub)
    setSubcategoryForm({
      name: sub.name,
      icon: sub.icon || '',
      sort_order: sub.sort_order || 0,
      category_id: sub.category_id?.toString() || '',
    })
    setShowSubcategoryModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold">Menu Management</h1>
                <p className="text-sm text-gray-400">Manage your restaurant menu</p>
              </div>
            </div>
            {activeTab === 'products' && (
              <button
                onClick={() => {
                  resetForm()
                  setEditingProduct(null)
                  setShowAddModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Plus size={18} />
                Add Product
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({ name: '', icon: '', sort_order: 0 })
                  setShowCategoryModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Plus size={18} />
                Add Category
              </button>
            )}
            {activeTab === 'subcategories' && (
              <button
                onClick={() => {
                  setEditingSubcategory(null)
                  setSubcategoryForm({ name: '', icon: '', sort_order: 0, category_id: '' })
                  setShowSubcategoryModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Plus size={18} />
                Add Subcategory
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {['products', 'categories', 'subcategories'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.is_available ?? p.isAvailable).length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>

            {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {(product.image_url || product.imageUrl) ? (
                    <img
                      src={product.image_url || product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={40} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {product.is_vegetarian && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Veg
                      </span>
                    )}
                    {product.is_spicy && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        Spicy
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <span className="font-bold text-gray-900">₹{product.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No products found
          </div>
        )}
          </>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Icon</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Sort Order</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 text-gray-500">{cat.icon || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{cat.sort_order || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleCategoryEdit(cat)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleCategoryDelete(cat.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No categories found. Add a category to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBCATEGORIES TAB */}
        {activeTab === 'subcategories' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Category</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Icon</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allSubcategories.map(sub => (
                  <tr key={sub.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 font-medium text-gray-900">{sub.name}</td>
                    <td className="px-6 py-4 text-gray-500">{sub.category_name || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{sub.icon || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSubcategoryEdit(sub)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleSubcategoryDelete(sub.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {allSubcategories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No subcategories found. Add a subcategory to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
            data-lenis-prevent
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
            </div>
            <form id="productForm" onSubmit={handleSubmit} className="p-6 space-y-3 pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={formData.category_id}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '__new__') {
                          setShowInlineCategoryForm(true)
                          setShowInlineSubcategoryForm(false)
                          setFormData({ ...formData, category_id: '' })
                          return
                        }
                        setFormData({ ...formData, category_id: val, subcategory_id: '' })
                      }}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                      <option value="__new__">+ Add New Category</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInlineCategoryForm(!showInlineCategoryForm)
                        setShowInlineSubcategoryForm(false)
                      }}
                      className="px-3 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      title="Add New Category"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Inline Category Add Form */}
                  {showInlineCategoryForm && (
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={inlineCategoryName}
                        onChange={(e) => setInlineCategoryName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-gray-900 focus:outline-none text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleInlineCategoryAdd()
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleInlineCategoryAdd}
                        disabled={!inlineCategoryName.trim()}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Subcategory */}
              {formData.category_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory *
                  </label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={formData.subcategory_id}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '__new__') {
                          setShowInlineSubcategoryForm(true)
                          setShowInlineCategoryForm(false)
                          setFormData({ ...formData, subcategory_id: '' })
                          return
                        }
                        setFormData({ ...formData, subcategory_id: val })
                      }}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                    >
                      <option value="">Select Subcategory</option>
                      {formSubcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                      <option value="__new__">+ Add New Subcategory</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInlineSubcategoryForm(!showInlineSubcategoryForm)
                        setShowInlineCategoryForm(false)
                      }}
                      className="px-3 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      title="Add New Subcategory"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Inline Subcategory Add Form */}
                  {showInlineSubcategoryForm && (
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="text"
                        placeholder="New subcategory name"
                        value={inlineSubcategoryName}
                        onChange={(e) => setInlineSubcategoryName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-gray-900 focus:outline-none text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleInlineSubcategoryAdd()
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleInlineSubcategoryAdd}
                        disabled={!inlineSubcategoryName.trim() || !formData.category_id}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <div className="space-y-2">
                  {/* File Upload */}
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-900 transition-colors bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (!file) return
                        if (file.size > 2 * 1024 * 1024) {
                          alert('Image must be less than 2MB')
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setFormData({ ...formData, image_url: ev.target.result })
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon size={28} className="mx-auto text-gray-400 mb-1" />
                        <p className="text-sm text-gray-500">Click to upload image</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                      </div>
                    )}
                  </label>
                  {/* OR paste URL */}
                  <input
                    type="url"
                    value={formData.image_url?.startsWith('data:') ? '' : formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none text-sm"
                    placeholder="Or paste image URL (https://...)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergens (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                  placeholder="Nuts, Dairy, Gluten"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_vegetarian}
                    onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_spicy}
                    onChange={(e) => setFormData({ ...formData, is_spicy: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Spicy</span>
                </label>
              </div>

            </form>
            {/* Sticky footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 pt-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="productForm"
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji or text)</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                  placeholder="e.g. Coffee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  {editingCategory ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
              </h2>
            </div>
            <form onSubmit={handleSubcategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={subcategoryForm.category_id}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji or text)</label>
                <input
                  type="text"
                  value={subcategoryForm.icon}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, icon: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                  placeholder="e.g. Espresso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={subcategoryForm.sort_order}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, sort_order: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubcategoryModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  {editingSubcategory ? 'Save Changes' : 'Add Subcategory'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
