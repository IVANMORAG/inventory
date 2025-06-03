import { getSupabase } from './auth.js';
import { loadProducts, updateStats } from './products.js';
import { showNotification } from './ui.js';

const supabase = getSupabase();

export async function addCategory() {
  const name = document.getElementById('category-name').value.trim();
  if (!name) {
    showNotification('Por favor, ingresa un nombre para la categoría.', 'error');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('categories')
      .insert([{ name }]);
    
    if (error) throw error;
    
    document.getElementById('category-name').value = '';
    loadCategories();
    updateStats();
    showNotification('Categoría agregada exitosamente.');
  } catch (error) {
    console.error('Error al agregar categoría:', error);
    showNotification('Error al agregar categoría: ' + error.message, 'error');
  }
}

export async function loadCategories() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) throw error;
    
    const categoryList = document.getElementById('category-list');
    const categorySelect = document.getElementById('product-category');
    const filterSelect = document.getElementById('filter-category');
    
    categoryList.innerHTML = '';
    categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    filterSelect.innerHTML = '<option value="">Todas las categorías</option>';

    categories.forEach(category => {
      const div = document.createElement('div');
      div.className = 'glass-effect p-4 rounded-lg card-hover';
      div.innerHTML = `
        <div class="flex justify-between items-center text-white">
          <span class="font-semibold">${category.name}</span>
          <button data-id="${category.id}" class="delete-category text-red-300 hover:text-red-100 transition-colors">
            🗑️
          </button>
        </div>
      `;
      categoryList.appendChild(div);

      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
      
      const filterOption = document.createElement('option');
      filterOption.value = category.id;
      filterOption.textContent = category.name;
      filterSelect.appendChild(filterOption);
    });

    document.querySelectorAll('.delete-category').forEach(btn => {
      btn.addEventListener('click', (e) => {
        deleteCategory(e.target.closest('button').dataset.id);
      });
    });
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    showNotification('Error al cargar categorías: ' + error.message, 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('¿Estás seguro de eliminar esta categoría? Los productos asociados también se eliminarán.')) return;
  
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    loadCategories();
    loadProducts();
    updateStats();
    showNotification('Categoría eliminada exitosamente.');
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    showNotification('Error al eliminar categoría: ' + error.message, 'error');
  }
}