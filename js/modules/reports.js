import { getSupabase } from './auth.js';
import { showNotification } from './ui.js';

const supabase = getSupabase();

export async function generateReport() {
  const filter = document.getElementById('report-filter').value;
  const reportBody = document.getElementById('report-body');
  reportBody.innerHTML = '';

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name)');
    
    if (error) throw error;
    
    let filteredProducts = products;
    
    switch(filter) {
      case 'low-stock':
        filteredProducts = products.filter(p => p.stock <= p.min_stock);
        break;
      case 'no-stock':
        filteredProducts = products.filter(p => p.stock === 0);
        break;
    }

    filteredProducts.forEach(product => {
      const categoryName = product.categories?.name || 'Sin categoría';
      const isLowStock = product.stock <= product.min_stock;
      
      const row = document.createElement('tr');
      row.className = 'border-b border-white/10';
      row.innerHTML = `
        <td class="p-4">${product.name}</td>
        <td class="p-4">${categoryName}</td>
        <td class="p-4 ${isLowStock ? 'text-red-300 font-bold' : ''}">${product.stock}</td>
        <td class="p-4">${product.description || 'N/A'}</td>
        <td class="p-4">
          <span class="px-2 py-1 rounded text-xs ${product.stock === 0 ? 'bg-gray-500/50' : isLowStock ? 'bg-red-500/50' : 'bg-green-500/50'}">
            ${product.stock === 0 ? 'Sin Stock' : isLowStock ? 'Stock Bajo' : 'Normal'}
          </span>
        </td>
      `;
      reportBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    showNotification('Error al generar reporte: ' + error.message, 'error');
  }
}

export async function downloadPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Sushi y más... - Reporte de Inventario', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 20, 45);
    
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
    
    doc.setFontSize(14);
    doc.text('Resumen Ejecutivo:', 20, 65);
    doc.setFontSize(11);
    doc.text(`Total de Productos: ${totalProducts}`, 30, 75);
    doc.text(`Productos con Stock Bajo: ${lowStockProducts}`, 30, 85);
    
    const filter = document.getElementById('report-filter').value;
    let filteredProducts = products;
    
    switch(filter) {
      case 'low-stock':
        filteredProducts = products.filter(p => p.stock <= p.min_stock);
        break;
      case 'no-stock':
        filteredProducts = products.filter(p => p.stock === 0);
        break;
    }
    
    const tableData = filteredProducts.map(product => {
      const categoryName = product.categories?.name || 'Sin categoría';
      const status = product.stock === 0 ? 'Sin Stock' : 
                    product.stock <= product.min_stock ? 'Stock Bajo' : 'Normal';
      
      return [
        product.name,
        categoryName,
        product.stock.toString(),
        product.description || 'N/A',
        status
      ];
    });
    
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
    
    doc.save(`inventario_sushi_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('¡Reporte PDF generado exitosamente!');
  } catch (error) {
    console.error('Error al generar PDF:', error);
    showNotification('Error al generar PDF: ' + error.message, 'error');
  }
}