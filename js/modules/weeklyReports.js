import { getSupabase } from './auth.js';
import { showNotification } from './ui.js';

const supabase = getSupabase();

export async function loadWeeklyReports() {
  try {
    const { data: reports, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const reportList = document.getElementById('weekly-reports-list');
    reportList.innerHTML = '';
    
    reports.forEach(report => {
      const div = document.createElement('div');
      div.className = 'glass-effect p-4 rounded-lg mb-2';
      div.innerHTML = `
        <div class="text-white">
          <p><strong>Fecha:</strong> ${new Date(report.created_at).toLocaleString()}</p>
          <p><strong>Total Productos:</strong> ${report.report_data.totalProducts}</p>
          <p><strong>Stock Bajo:</strong> ${report.report_data.lowStockProducts}</p>
          <button data-id="${report.id}" class="download-weekly-report bg-blue-500/80 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
            Descargar PDF
          </button>
        </div>
      `;
      reportList.appendChild(div);
    });

    document.querySelectorAll('.download-weekly-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        downloadWeeklyReport(e.target.dataset.id);
      });
    });
  } catch (error) {
    console.error('Error al cargar reportes semanales:', error);
    showNotification('Error al cargar reportes semanales: ' + error.message, 'error');
  }
}

async function downloadWeeklyReport(reportId) {
  try {
    const { data: report, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('id', reportId)
      .single();
    
    if (error) throw error;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Sushi y más... - Reporte Semanal de Inventario', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date(report.created_at).toLocaleDateString()}`, 20, 35);
    doc.text(`Hora: ${new Date(report.created_at).toLocaleTimeString()}`, 20, 45);
    
    doc.setFontSize(14);
    doc.text('Resumen Ejecutivo:', 20, 65);
    doc.setFontSize(11);
    doc.text(`Total de Productos: ${report.report_data.totalProducts}`, 30, 75);
    doc.text(`Productos con Stock Bajo: ${report.report_data.lowStockProducts}`, 30, 85);
    
    const tableData = report.report_data.products.map(product => [
      product.name,
      product.category,
      product.stock.toString(),
      product.description,
      product.status
    ]);
    
    doc.autoTable({
      head: [['Producto', 'Categoría', 'Stock', 'Descripción', 'Estado']],
      body: tableData,
      startY: 100,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [52, 73, 185],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        2: { halign: 'center' },
        4: { halign: 'center' }
      }
    });
    
    const finalY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(10);
    doc.text('Generado por Sistema de Inventarios - Sushi y más...', 20, finalY + 20);
    
    doc.save(`reporte_semanal_sushi_${new Date(report.created_at).toISOString().split('T')[0]}.pdf`);
    showNotification('¡Reporte descargado exitosamente!');
  } catch (error) {
    console.error('Error al descargar reporte:', error);
    showNotification('Error al descargar reporte: ' + error.message, 'error');
  }
}

export async function generateWeeklyReport() {
  try {
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*, categories(name)');
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*');
    
    if (productError || categoryError) {
      throw productError || categoryError;
    }

    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock <= p.min_stock).length;
    const reportData = {
      date: new Date().toISOString(),
      totalProducts,
      lowStockProducts,
      products: products.map(product => ({
        name: product.name,
        category: product.categories?.name || 'Sin categoría',
        stock: product.stock,
        min_stock: product.min_stock,
        description: product.description || 'N/A',
        status: product.stock === 0 ? 'Sin Stock' : 
                product.stock <= product.min_stock ? 'Stock Bajo' : 'Normal'
      }))
    };

    const { error } = await supabase
      .from('weekly_reports')
      .insert([{ report_data: reportData }]);
    
    if (error) throw error;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Sushi y más... - Reporte Semanal de Inventario', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 20, 45);
    
    doc.setFontSize(14);
    doc.text('Resumen Ejecutivo:', 20, 65);
    doc.setFontSize(11);
    doc.text(`Total de Productos: ${totalProducts}`, 30, 75);
    doc.text(`Productos con Stock Bajo: ${lowStockProducts}`, 30, 85);
    
    const tableData = reportData.products.map(product => [
      product.name,
      product.category,
      product.stock.toString(),
      product.description,
      product.status
    ]);
    
    doc.autoTable({
      head: [['Producto', 'Categoría', 'Stock', 'Descripción', 'Estado']],
      body: tableData,
      startY: 100,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [52, 73, 185],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        2: { halign: 'center' },
        4: { halign: 'center' }
      }
    });
    
    const finalY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(10);
    doc.text('Generado por Sistema de Inventarios - Sushi y más...', 20, finalY + 20);
    
    doc.save(`reporte_semanal_sushi_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('¡Reporte semanal generado y guardado exitosamente!');
  } catch (error) {
    console.error('Error al generar reporte semanal:', error);
    showNotification('Error al generar reporte semanal: ' + error.message, 'error');
  }
}

export function scheduleWeeklyReport() {
  const now = new Date();
  const nextMonday = new Date();
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
  nextMonday.setHours(0, 0, 0, 0);
  
  const timeUntilMonday = nextMonday - now;
  
  setTimeout(() => {
    generateWeeklyReport();
    setInterval(generateWeeklyReport, 7 * 24 * 60 * 60 * 1000);
  }, timeUntilMonday);
}