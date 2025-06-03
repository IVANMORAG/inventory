
import { getSupabase } from './auth.js';
import { showNotification } from './ui.js';

let categoryChartInstance = null;
let stockChartInstance = null;

export async function updateCharts() {
  await updateCategoryChart();
  await updateStockChart();
}

async function updateCategoryChart() {
  const supabase = await getSupabase();
  try {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }
    
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*');
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*');
    
    if (productError || categoryError) {
      throw productError || categoryError;
    }
    
    const categoryData = {};
    categories.forEach(cat => {
      categoryData[cat.name] = products.filter(p => p.category_id === cat.id).length;
    });
    
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: 'white'
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error al cargar gráfico de categorías:', error);
    showNotification('Error al cargar gráfico de categorías: ' + error.message, 'error');
  }
}

async function updateStockChart() {
  const supabase = await getSupabase();
  try {
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    if (stockChartInstance) {
      stockChartInstance.destroy();
    }
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) throw error;
    
    const normalStock = products.filter(p => p.stock > p.min_stock).length;
    const lowStock = products.filter(p => p.stock <= p.min_stock && p.stock > 0).length;
    const noStock = products.filter(p => p.stock === 0).length;
    
    stockChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Stock Normal', 'Stock Bajo', 'Sin Stock'],
        datasets: [{
          data: [normalStock, lowStock, noStock],
          backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: 'white'
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          },
          x: {
            ticks: {
              color: 'white'
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error al cargar gráfico de stock:', error);
    showNotification('Error al cargar gráfico de stock: ' + error.message, 'error');
  }
}
