
import { initSupabase, checkAuth, login, logout } from './modules/auth.js';
import { addCategory, loadCategories } from './modules/categories.js';
import { addProduct, loadProducts, filterProducts, updateStats } from './modules/products.js';
import { generateReport, downloadPDF } from './modules/reports.js';
import { updateCharts } from './modules/analytics.js';
import { loadWeeklyReports, scheduleWeeklyReport } from './modules/weeklyReports.js';
import { updateTime, setupTabs, showTab } from './modules/ui.js';

let currentTab = 'categories';

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar si Supabase está disponible
  const initialized = await initSupabase();
  if (!initialized) {
    showNotification('Error: Supabase no está disponible', 'error');
    return;
  }

  // Configurar event listeners
  document.getElementById('login-button').addEventListener('click', async () => {
    const success = await login();
    if (success) {
      loadData();
    }
  });
  document.getElementById('logout-button').addEventListener('click', logout);
  document.getElementById('add-category-button').addEventListener('click', addCategory);
  document.getElementById('add-product-button').addEventListener('click', addProduct);
  document.getElementById('generate-report-button').addEventListener('click', generateReport);
  document.getElementById('download-pdf-button').addEventListener('click', downloadPDF);
  document.getElementById('search-products').addEventListener('input', filterProducts);
  document.getElementById('filter-category').addEventListener('change', filterProducts);

  // Verificar autenticación
  checkAuth();

  // Configurar tabs
  setupTabs();
  setupTabs(() => {
    showTab(currentTab);
    if (currentTab === 'analytics') {
      setTimeout(updateCharts, 100);
    } else if (currentTab === 'weekly-reports') {
      loadWeeklyReports();
    }
  });

  // Iniciar reloj
  updateTime();
  setInterval(updateTime, 1000);

  // Cargar datos si está autenticado
  if (sessionStorage.getItem('isAuthenticated') === 'true') {
    loadData();
  }
});

// Función principal para cargar datos
async function loadData() {
  loadCategories();
  loadProducts();
  updateStats();
  showTab('categories');
  updateTime();
  scheduleWeeklyReport();
}
