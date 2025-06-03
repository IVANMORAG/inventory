import { getSupabase } from './auth.js';
import { showNotification } from './ui.js';

const supabase = getSupabase();

export async function addProduct() {
  const name = document.getElementById('product-name').value.trim();
  const categoryId = parseInt(document.getElementById('product-category').value);
  const stock = parseInt(document.getElementById('product-stock').value);
  const minStock = parseInt(document.getElementById('product-min-stock').value) || 5;
  const description = document.getElementById('product-description').value.trim();

  if (!name || !categoryId || isNaN(stock) || stock < 0) {
    showNotification('Por favor, completa todos los campos correctamente. Las existencias no pueden ser negativas.', 'error');
    return;
  }

  try {
    const { error } = await supabase
      .from('products')
      .insert([{ name, category_id: categoryId, stock, min_stock: minStock, description }]);
    
    if (error) throw error;

    document.getElementById('product-name').value = '';
    document.getElementById('product-category').value = '';
    document.getElementById('product-stock').value = '';
    document.getElementById('product-min-stock').value = '';
    document.getElementById('product-description').value = '';
    
    loadProducts();
    updateStats();
    showNotification('Producto agregado exitosamente.');
  } catch (error) {
    console.error('Error al agregar producto:', error);
    showNotification('Error al agregar producto: ' + error.message, 'error');
  }
}

export async function loadProducts() {
  filterProducts();
}

export async function filterProducts() {
  const searchTerm = document.getElementById('search-products').value.toLowerCase();
  const categoryFilter = document.getElementById('filter-category').value;
  const productList = document.getElementById('product-list');
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name)');
    
    if (error) throw error;

    productList.innerHTML = '';

    let filteredProducts = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                           (product.description && product.description.toLowerCase().includes(searchTerm));
      const matchesCategory = !categoryFilter || product.category_id == categoryFilter;
      return matchesSearch && matchesCategory;
    });

    filteredProducts.forEach(product => {
      const categoryName = product.categories?.name || 'Sin categoría';
      const isLowStock = product.stock <= product.min_stock;
      
      const div = document.createElement('div');
      div.className = `glass-effect p-6 rounded-lg card-hover ${isLowStock ? 'ring-2 ring-red-400 pulse-animation' : ''}`;
      div.innerHTML = `
        <div class="text-white">
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-bold text-lg">${product.name}</h3>
            <span class="text-xs bg-white/20 px-2 py-1 rounded">${categoryName}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm mb-4">
            <div>Stock: <span class="${isLowStock ? 'text-red-300 font-bold' : 'text-green-300'}">${product.stock}</span></div>
            <div>Mín: ${product.min_stock}</div>
          </div>
          ${product.description ? `<p class="text-white/70 text-sm mb-4">${product.description}</p>` : ''}
          ${isLowStock ? '<div class="bg-red-500/50 text-white text-xs p-2 rounded mb-4">⚠️ Stock Bajo</div>' : ''}
          <div class="flex gap-2">
            <button data-id="${product.id}" data-change="1" class="increase-stock bg-green-500/80 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors">+1</button>
            <button data-id="${product.id}" data-change="-1" class="decrease-stock bg-blue-500/80 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">-1</button>
            <button data-id="${product.id}" class="delete-product bg-red-500/80 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">🗑️</button>
          </div>
        </div>
      `;
      productList.appendChild(div);
    });

    document.querySelectorAll('.increase-stock, .decrease-stock').forEach(btn => {
      btn.addEventListener('click', (e) => {
        updateStock(e.target.dataset.id, parseInt(e.target.dataset.change));
      });
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
      btn.addEventListener('click', (e) => {
        deleteProduct(e.target.dataset.id);
      });
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
    showNotification('Error al cargar productos: ' + error.message, 'error');
  }
}

async function updateStock(id, change) {
  try {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;

    const newStock = product.stock + change;
    if (newStock < 0) {
      showNotification('Las existencias no pueden ser negativas.', 'error');
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id);
    
    if (error) throw error;
    
    loadProducts();
    updateStats();
    
    if (newStock <= product.min_stock) {
      showNotification(`¡Alerta! El producto "${product.name}" tiene stock bajo (${newStock}).`, 'error');
    }
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    showNotification('Error al actualizar stock: ' + error.message, 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('¿Estás seguro de eliminar este producto?')) return;
  
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    loadProducts();
    updateStats();
    showNotification('Producto eliminado exitosamente.');
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    showNotification('Error al eliminar producto: ' + error.message, 'error');
  }
}

export async function updateStats() {
  try {
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*');
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*');
    
    if (productError || categoryError) {
      throw productError || categoryError;
    }

    const totalProducts = products.length;
    const totalCategories = categories.length;
    const lowStockProducts = products.filter(p => p.stock <= p.min_stock).length;

    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('total-categories').textContent = totalCategories;
    document.getElementById('low-stock-count').textContent = lowStockProducts;
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    showNotification('Error al cargar estadísticas: ' + error.message, 'error');
  }
}