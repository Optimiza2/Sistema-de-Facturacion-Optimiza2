    const tablaBody = document.getElementById('tabla-body');
    const btnAgregar = document.getElementById('btnAgregar');
    const subtotalEl = document.getElementById('subtotal');
    const descuentoMontoEl = document.getElementById('descuentoMonto');
    const subtotalDescontadoEl = document.getElementById('subtotalDescontado');
    const ivaMontoEl = document.getElementById('ivaMonto');
    const totalGeneralEl = document.getElementById('totalGeneral');
    const ivaEl = document.getElementById('iva');
    const descuentoEl = document.getElementById('descuento');
    const btnPDF = document.getElementById('btnPDF');

    // Recuperar datos guardados
    const datosGuardados = JSON.parse(localStorage.getItem('tablaDatos')) || [];

    function agregarFila(descripcion = '', cantidad = 1, precio = 0) {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><textarea maxlength="1000" rows="3" placeholder="Descripción">${descripcion}</textarea></td>
        <td><input type="number" class="cantidad" min="1" value="${cantidad}"></td>
        <td><input type="number" class="precio" min="0" step="0.01" value="${precio}"></td>
        <td class="total">CRC 0.00</td>
        <td><button class="eliminar">🗑️</button></td>
      `;
      tablaBody.appendChild(fila);

      fila.querySelectorAll('.cantidad, .precio').forEach(input => {
        input.addEventListener('input', () => {
          actualizarTotales();
          guardarDatos();
        });
      });
      const textarea = fila.querySelector('textarea');
      textarea.addEventListener('input', () => {
        const lineas = textarea.value.split(/\r?\n/).length;
        if (lineas > 10) {
          alert('Máximo 10 líneas permitidas.');
          textarea.value = textarea.value.split(/\r?\n/).slice(0, 10).join('\n');
        }
        guardarDatos();
      });
      fila.querySelector('.eliminar').addEventListener('click', () => {
        fila.remove();
        actualizarTotales();
        guardarDatos();
      });
    }

    function actualizarTotales() {
      let subtotal = 0;
      tablaBody.querySelectorAll('tr').forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('.cantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio').value) || 0;
        const total = cantidad * precio;
        fila.querySelector('.total').textContent = `CRC ${total.toFixed(2)}`;
        subtotal += total;
      });

      const iva = Math.min(100, Math.max(0, parseFloat(ivaEl.value) || 0));
      const descuento = Math.min(100, Math.max(0, parseFloat(descuentoEl.value) || 0));
      const montoDescuento = subtotal * descuento / 100;
      const subtotalDescontado = subtotal - montoDescuento;
      const montoIVA = subtotalDescontado * iva / 100;
      const totalFinal = subtotalDescontado + montoIVA;

      subtotalEl.textContent = `CRC ${subtotal.toFixed(2)}`;
      descuentoMontoEl.textContent = `− CRC ${montoDescuento.toFixed(2)}`;
      subtotalDescontadoEl.textContent = `CRC ${subtotalDescontado.toFixed(2)}`;
      ivaMontoEl.textContent = `CRC ${montoIVA.toFixed(2)}`;
      totalGeneralEl.textContent = `CRC ${totalFinal.toFixed(2)}`;

      return { subtotal, montoDescuento, subtotalDescontado, montoIVA, totalFinal };
    }

    function guardarDatos() {
      const filas = [...tablaBody.querySelectorAll('tr')].map(fila => ({
        descripcion: fila.querySelector('textarea').value,
        cantidad: fila.querySelector('.cantidad').value,
        precio: fila.querySelector('.precio').value
      }));
      const configuracion = {
        filas,
        iva: ivaEl.value,
        descuento: descuentoEl.value
      };
      localStorage.setItem('tablaDatos', JSON.stringify(configuracion));
    }

    function cargarDatos() {
      if (datosGuardados.filas) {
        datosGuardados.filas.forEach(f => agregarFila(f.descripcion, f.cantidad, f.precio));
        ivaEl.value = datosGuardados.iva || 13;
        descuentoEl.value = datosGuardados.descuento || 0;
        actualizarTotales();
      }
    }

    // Exportar a PDF

    btnPDF.addEventListener('click', () => {
      if (!window.jspdf || !window.jspdf.jsPDF ||
          typeof window.jspdf.jsPDF.API.autoTable !== 'function') {
        alert('No se pudieron cargar los archivos del PDF. Asegúrate de copiar también la carpeta vendor junto al programa.');
        return;
      }

      try {
      const calculos = actualizarTotales();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // El logo incrustado evita errores de canvas al abrir el programa desde un archivo local.
      doc.addImage(window.facturaLogoData, 'PNG', 14, 10, 62, 15);
      doc.setFontSize(9);
      doc.setTextColor(45, 49, 87);
      doc.text('Cartago, La Unión', 86, 15);
      doc.text('+506 7177-1532', 86, 21);
      doc.text('info@optimiza2cr.com', 86, 27);
      doc.setDrawColor(190, 195, 210);
      doc.line(14, 34, 196, 34);

      // Número de factura y fecha
      const fecha = new Date();
      const numeroFactura = 'FAC-' + fecha.getFullYear() + (fecha.getMonth()+1) + fecha.getDate() + '-' + Math.floor(Math.random() * 1000);
      doc.text(`Fecha: ${fecha.toLocaleDateString()}`, 14, 41);
      doc.text(`N° Factura: ${numeroFactura}`, 150, 41);

      // Tabla
      const data = [];
      tablaBody.querySelectorAll('tr').forEach(fila => {
        data.push([
          fila.querySelector('textarea').value,
          fila.querySelector('.cantidad').value,
          fila.querySelector('.precio').value,
          fila.querySelector('.total').textContent
        ]);
      });

doc.autoTable({
  startY: 48,
  head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Total']],
  body: data,
  theme: 'grid',
  styles: {
    font: 'Times',
    fontSize: 10,
    cellPadding: 3,
    overflow: 'linebreak',   //Ajuste automático del texto
    valign: 'top',
    lineColor: [0, 0, 0],
    lineWidth: 0.2
  },
  headStyles: {
    fillColor: [45, 49, 87], //Azul head
    textColor: [255, 255, 255],
    fontStyle: 'roboto',
    halign: 'center',
    valign: 'middle'
  },
  bodyStyles: {
    textColor: [0, 0, 0],
    valign: 'middle'
  },
  alternateRowStyles: {
    fillColor: [245, 245, 245], //Gris claro para filas
  },
  columnStyles: {
    0: { cellWidth: 90, overflow: 'linebreak', valign: 'top' },  // Descripción
    1: { halign: 'center', cellWidth: 25 },
    2: { halign: 'center', cellWidth: 30 },
    3: { halign: 'center', cellWidth: 37 }
  },
  margin: { left: 14, right: 14 },
  didParseCell: (data) => {
    // Conserva saltos de línea manuales desde el textarea
    if (data.section === 'body' && data.column.index === 0) {
      data.cell.text = data.cell.text.join(' ').split(/\r?\n/);
    }
  }
});



    const table = doc.lastAutoTable; 
    if (table) {
        const x = table.settings.margin.left;
        const y = table.settings.startY;
        const w = 182; // ancho
        const h = table.finalY - y; // altura
        doc.setDrawColor(0, 0, 0); 
        doc.setLineWidth(0.3); // grosor
        doc.rect(x, y, w, h); 
    }

      // Totales: primero se descuenta y luego se calcula el IVA sobre el saldo.
      const summaryX = 96;
      const summaryWidth = 100;
      let y = doc.lastAutoTable.finalY + 12;
      const summaryTop = y - 7;

      doc.setFillColor(247, 248, 252);
      doc.setDrawColor(225, 228, 238);
      doc.setLineWidth(0.3);
      doc.roundedRect(summaryX, summaryTop, summaryWidth, 43, 3, 3, 'FD');

      const drawSummaryRow = (label, amount, options = {}) => {
        doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
        doc.setFontSize(options.bold ? 10 : 8.5);
        doc.setTextColor(...(options.color || [79, 86, 108]));
        doc.text(label, summaryX + 6, y);
        doc.setTextColor(...(options.valueColor || [35, 40, 61]));
        doc.text(amount, summaryX + summaryWidth - 6, y, { align: 'right' });
      };

      drawSummaryRow('Subtotal', `CRC ${calculos.subtotal.toFixed(2)}`);
      y += 6;
      drawSummaryRow(`Descuento (${descuentoEl.value}%)`, `- CRC ${calculos.montoDescuento.toFixed(2)}`);
      y += 6;
      drawSummaryRow('Subtotal con descuento', `CRC ${calculos.subtotalDescontado.toFixed(2)}`);
      y += 6;
      drawSummaryRow(`IVA (${ivaEl.value}%)`, `CRC ${calculos.montoIVA.toFixed(2)}`);
      y += 2;

      doc.setDrawColor(216, 220, 233);
      doc.line(summaryX + 6, y, summaryX + summaryWidth - 6, y);
      y += 6;
      drawSummaryRow('TOTAL FINAL', `CRC ${calculos.totalFinal.toFixed(2)}`, {
        bold: true,
        color: [69, 77, 135],
        valueColor: [53, 61, 115]
      });

      

      

      // Inicia la descarga directamente desde el clic del usuario.
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = `${numeroFactura}.pdf`;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      } catch (error) {
        console.error('Error al generar el PDF:', error);
        alert(`No se pudo generar o descargar el PDF: ${error.message}`);
      }
    });

    ivaEl.addEventListener('input', () => { actualizarTotales(); guardarDatos(); });
    descuentoEl.addEventListener('input', () => { actualizarTotales(); guardarDatos(); });
    btnAgregar.addEventListener('click', () => { agregarFila(); guardarDatos(); });

    cargarDatos();