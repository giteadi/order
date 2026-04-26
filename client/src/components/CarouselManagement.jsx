import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon, Plus, Trash2, Edit2, GripVertical,
  Upload, X, ChevronRight, ChevronLeft, Save, ChevronUp, ChevronDown,
  Layout, Grid3X3, Monitor, ArrowRight, Layers
} from 'lucide-react'
import apiClient from '../services/api'

export const CarouselManagement = () => {
  const [activeTab, setActiveTab] = useState('highlights') // 'hero', 'highlights', 'collection', or 'parallax'
  const [heroImages, setHeroImages] = useState([])
  const [highlightsImages, setHighlightsImages] = useState([])
  const [collectionImages, setCollectionImages] = useState([])
  const [parallaxImages, setParallaxImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingImage, setEditingImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  
  const [newImage, setNewImage] = useState({
    title: '',
    subtitle: '',
    image_base64: '',
    carousel_type: 'highlights'
  })
  const [previewImages, setPreviewImages] = useState([]) // Multiple previews
  const [uploadQueue, setUploadQueue] = useState([]) // Queue for multiple uploads

  // Fetch carousel images when tab changes
  useEffect(() => {
    fetchImages()
  }, [activeTab])

  const fetchImages = async () => {
    try {
      setLoading(true)
      // Fetch all four types of images (using admin endpoint with auth)
      const [heroRes, highlightsRes, collectionRes, parallaxRes] = await Promise.all([
        apiClient.get('/carousel/admin/all?type=hero'),
        apiClient.get('/carousel/admin/all?type=highlights'),
        apiClient.get('/carousel/admin/all?type=collection'),
        apiClient.get('/carousel/admin/all?type=parallax')
      ])

      if (heroRes.data.success) {
        setHeroImages(heroRes.data.data)
      }
      if (highlightsRes.data.success) {
        setHighlightsImages(highlightsRes.data.data)
      }
      if (collectionRes.data.success) {
        setCollectionImages(collectionRes.data.data)
      }
      if (parallaxRes.data.success) {
        setParallaxImages(parallaxRes.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch carousel images:', error)
      
      // Better error handling
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.')
        // Optionally redirect to login
      } else if (error.response?.status === 403) {
        alert('You do not have permission to access carousel images.')
      } else {
        alert('Failed to load images: ' + (error.response?.data?.message || error.message))
      }
    } finally {
      setLoading(false)
    }
  }

  const getCurrentImages = () => {
    switch (activeTab) {
      case 'hero': return heroImages
      case 'collection': return collectionImages
      case 'parallax': return parallaxImages
      default: return highlightsImages
    }
  }
  const setCurrentImages = (images) => {
    switch (activeTab) {
      case 'hero': return setHeroImages(images)
      case 'collection': return setCollectionImages(images)
      case 'parallax': return setParallaxImages(images)
      default: return setHighlightsImages(images)
    }
  }

  // Handle image upload and convert to base64 - supports multiple files
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not an image file`)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" is larger than 5MB`)
        return
      }
    }

    // Process all files
    const newPreviews = []
    const newQueue = []
    let processedCount = 0

    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target.result
        newPreviews.push({ name: file.name, base64, index })
        newQueue.push({ name: file.name, base64, index })
        processedCount++

        if (processedCount === files.length) {
          // All files processed
          setPreviewImages(prev => [...prev, ...newPreviews.sort((a, b) => a.index - b.index)])
          setUploadQueue(prev => [...prev, ...newQueue.sort((a, b) => a.index - b.index)])
          // Set first image as main preview and newImage
          if (newPreviews.length > 0) {
            const first = newPreviews.sort((a, b) => a.index - b.index)[0]
            setPreviewImage(first.base64)
            setNewImage(prev => ({ ...prev, image_base64: first.base64 }))
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Remove a preview from queue
  const removePreview = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
    setUploadQueue(prev => prev.filter((_, i) => i !== index))
    // Update main preview if needed
    const remaining = previewImages.filter((_, i) => i !== index)
    if (remaining.length > 0) {
      setPreviewImage(remaining[0].base64)
      setNewImage(prev => ({ ...prev, image_base64: remaining[0].base64 }))
    } else {
      setPreviewImage(null)
      setNewImage(prev => ({ ...prev, image_base64: '' }))
    }
  }

  // Create new carousel image(s) - supports multiple
  const handleCreate = async (e) => {
    e.preventDefault()
    
    // If multiple images in queue, upload all
    const imagesToUpload = uploadQueue.length > 0 ? uploadQueue : (newImage.image_base64 ? [{ name: newImage.title, base64: newImage.image_base64 }] : [])
    
    if (imagesToUpload.length === 0) {
      alert('Please upload at least one image')
      return
    }

    try {
      setLoading(true)
      let successCount = 0
      let failCount = 0

      // Upload each image
      for (let i = 0; i < imagesToUpload.length; i++) {
        const img = imagesToUpload[i]
        const payload = {
          title: imagesToUpload.length === 1 
            ? (newImage.title?.trim() || 'Untitled') 
            : `${newImage.title?.trim() || 'Image'} ${i + 1}`,
          subtitle: imagesToUpload.length === 1 ? (newImage.subtitle?.trim() || '') : '',
          image_base64: img.base64,
          carousel_type: activeTab
        }
        
        try {
          const response = await apiClient.post('/carousel', payload)
          if (response.data.success) {
            successCount++
          } else {
            failCount++
            console.error('Failed to upload:', img.name, response.data.message)
          }
        } catch (error) {
          failCount++
          console.error('Failed to upload:', img.name, error)
        }
      }
      
      // Reset and close
      setShowAddModal(false)
      setNewImage({ title: '', subtitle: '', image_base64: '', carousel_type: activeTab })
      setPreviewImage(null)
      setPreviewImages([])
      setUploadQueue([])
      await fetchImages()
      
      // Show result
      if (successCount > 0 && failCount === 0) {
        alert(`${successCount} image${successCount > 1 ? 's' : ''} added successfully!`)
      } else if (successCount > 0 && failCount > 0) {
        alert(`${successCount} uploaded, ${failCount} failed`)
      } else {
        alert('Failed to upload images')
      }
    } catch (error) {
      console.error('Failed to create carousel image:', error)
      alert('Failed to create carousel image: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // Update carousel image
  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingImage) return

    try {
      const response = await apiClient.patch(`/carousel/${editingImage.id}`, editingImage)
      if (response.data.success) {
        setEditingImage(null)
        fetchImages()
      }
    } catch (error) {
      console.error('Failed to update carousel image:', error)
      alert('Failed to update carousel image')
    }
  }

  // Delete carousel image
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await apiClient.delete(`/carousel/${id}`)
      if (response.data.success) {
        fetchImages()
      }
    } catch (error) {
      console.error('Failed to delete carousel image:', error)
      alert('Failed to delete carousel image')
    }
  }

  // Reorder images
  const handleReorder = async (direction, index) => {
    const images = getCurrentImages()
    const newOrder = [...images]
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    }

    try {
      const imageIds = newOrder.map(img => img.id)
      await apiClient.post('/carousel/reorder', { 
        imageIds,
        carousel_type: activeTab 
      })
      setCurrentImages(newOrder)
    } catch (error) {
      console.error('Failed to reorder images:', error)
      alert('Failed to reorder images')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const images = getCurrentImages()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Home Page Images</h2>
          <p className="text-gray-500 mt-1">Manage your cafe's carousel and banner images</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 p-1 rounded-xl">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('hero')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'hero'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Monitor size={20} />
            <div className="text-left">
              <div className="text-sm font-semibold">Hero Banner</div>
              <div className="text-xs opacity-70">Large top banner</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'highlights'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid3X3 size={20} />
            <div className="text-left">
              <div className="text-sm font-semibold">Highlights Strip</div>
              <div className="text-xs opacity-70">Horizontal scroll cards</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'collection'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layout size={20} />
            <div className="text-left">
              <div className="text-sm font-semibold">Collection</div>
              <div className="text-xs opacity-70">Bottom carousel</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('parallax')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'parallax'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers size={20} />
            <div className="text-left">
              <div className="text-sm font-semibold">Parallax</div>
              <div className="text-xs opacity-70">Depth in Motion section</div>
            </div>
          </button>
        </div>
      </div>

      {/* Section Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Layout className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-blue-900">
              {activeTab === 'hero' ? 'Hero Banner Section' : activeTab === 'highlights' ? 'Highlights Strip Section' : activeTab === 'collection' ? 'Collection Section' : 'Parallax Section'}
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {activeTab === 'hero'
                ? 'These images appear as the large banner at the top of your homepage. Recommended size: 1920x1080px (16:9).'
                : activeTab === 'highlights'
                ? 'These images appear in the horizontal scrolling section below "Get the highlights." Recommended size: 800x600px (4:3).'
                : activeTab === 'collection'
                ? 'These images appear in the bottom full-width carousel. Recommended size: 1600x900px (16:9).'
                : 'These images are used in the "Depth in Motion" parallax section. Upload exactly 3 images: Background (1920x1080), Middle (1200x800), and Foreground (1200x800).'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          Add {activeTab === 'hero' ? 'Banner' : activeTab === 'highlights' ? 'Highlight' : activeTab === 'collection' ? 'Collection' : 'Parallax'} Image
        </button>
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No carousel images yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="relative aspect-video">
                <img
                  src={image.image}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => setEditingImage(image)}
                    className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  <button
                    onClick={() => handleReorder('up', index)}
                    disabled={index === 0}
                    className="p-1 bg-white/90 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => handleReorder('down', index)}
                    disabled={index === images.length - 1}
                    className="p-1 bg-white/90 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activeTab === 'hero'
                      ? 'bg-purple-100 text-purple-700'
                      : activeTab === 'highlights'
                      ? 'bg-pink-100 text-pink-700'
                      : activeTab === 'collection'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {activeTab === 'hero' ? 'Banner' : activeTab === 'highlights' ? 'Highlight' : activeTab === 'collection' ? 'Collection' : 'Parallax'}
                  </span>
                  <span className="text-xs text-gray-400">Order: {image.display_order}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{image.title}</h3>
                {image.subtitle && (
                  <p className="text-sm text-gray-500 mt-1">{image.subtitle}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Image Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  Add {activeTab === 'hero' ? 'Banner' : activeTab === 'highlights' ? 'Highlight' : activeTab === 'collection' ? 'Collection' : 'Parallax'} Image
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewImage({ title: '', subtitle: '', image_base64: '' })
                    setPreviewImage(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                    <span className="text-xs text-gray-500 ml-2">
                      ({activeTab === 'hero' ? 'Recommended: 1920x1080px' : activeTab === 'highlights' ? 'Recommended: 800x600px' : activeTab === 'collection' ? 'Recommended: 1600x900px' : 'Recommended: 1920x1080px (BG) / 1200x800px'})
                    </span>
                  </label>
                  {/* Multiple Image Previews Grid */}
                  {previewImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {previewImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square">
                          <img
                            src={img.base64}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removePreview(idx)
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full z-10"
                          >
                            <X size={12} />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors overflow-hidden">
                    {previewImages.length === 0 ? (
                      <div className="pointer-events-none">
                        <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">Select multiple images (PNG, JPG up to 5MB each)</p>
                      </div>
                    ) : (
                      <div className="pointer-events-none">
                        <Upload size={24} className="mx-auto text-purple-500 mb-2" />
                        <p className="text-sm text-purple-600">Click to add more images</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newImage.title}
                    onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={uploadQueue.length > 1 ? "Base title for images (Image 1, Image 2...)" : "Image title"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newImage.subtitle}
                    onChange={(e) => setNewImage({ ...newImage, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setNewImage({ title: '', subtitle: '', image_base64: '', carousel_type: activeTab })
                      setPreviewImage(null)
                      setPreviewImages([])
                      setUploadQueue([])
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={uploadQueue.length === 0 && !newImage.image_base64}
                  >
                    {uploadQueue.length > 1 ? `Add ${uploadQueue.length} Images` : 'Add Image'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Image Modal */}
      <AnimatePresence>
        {editingImage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Edit Carousel Image</h3>
                <button
                  onClick={() => setEditingImage(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={editingImage.image}
                    alt={editingImage.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingImage.title}
                    onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={editingImage.subtitle || ''}
                    onChange={(e) => setEditingImage({ ...editingImage, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingImage.display_order}
                    onChange={(e) => setEditingImage({ ...editingImage, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingImage(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
