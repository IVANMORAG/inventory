import { initSupabase, checkAuth, login, logout } from './modules/auth.js';
import { addCategory, loadCategories } from './modules/categories.js';
import { addProduct, loadProducts, filterProducts, updateStats } from './modules/products.js';
import { generateReport, downloadPDF } from './modules/reports.js';
import { updateCharts } from './modules/analytics.js';
import { loadWeeklyReports, scheduleWeeklyReport } from './modules/weeklyReports.js';
import { updateTime, setupTabs, showTab } from './modules/ui.js';

let currentTab = 'categories';

document.addEventListener('DOMContentLoaded', async () => {
  await initSupabase();
  
  document.getElementById('login-button').addEventListener('click', async () => {
    if (await login()) {
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

  checkAuth();
  setupTabs((tabName) => {
    showTab(tabName);
    currentTab = tabName;
    if (tabName === 'analytics') {
      setTimeout(updateCharts, 100);
    } else if (tabName === 'weekly-reports') {
      loadWeeklyReports();
    }
  });

  updateTime();
  setInterval(updateTime, 1000);

  if (sessionStorage.getItem('isAuthenticated') === 'true') {
    loadData();
  }
});

async function loadData() {
  await loadCategories();
  await loadProducts();
  await updateStats();
  showTab('categories');
  scheduleWeeklyReport();
}