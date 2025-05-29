/**
 * Módulo de validación de formulario
 */
const FormValidator = {
  /**
   * Configura las validaciones del formulario
   */
  setup() {
    this._setupTextInputs();
    this._setupNumericInputs();
    this._setupExclusiveCheckboxes();
  },

  /**
   * Configura los campos de texto para aceptar solo letras y espacios, y convertir a mayúsculas
   */
  _setupTextInputs() {
    const textInputs = document.querySelectorAll(
      '#nombre, #patrocinadora, #beneficiario_nombre_completo, #entidad_bancaria'
    );
    textInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        // Permitir solo letras y espacios (preservar todos los espacios)
        let value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
        // Convertir a mayúsculas sin normalizar espacios
        value = value.toUpperCase();
        e.target.value = value;
      });
    });

    // Manejar el campo de correo electrónico (permitir formato de email y convertir a mayúsculas)
    const emailInput = document.querySelector('#correo');
    if (emailInput) {
      emailInput.addEventListener('input', (e) => {
        // Convertir a mayúsculas sin normalizar espacios
        let value = e.target.value.toUpperCase();
        e.target.value = value;
      });
    }
  },

  /**
   * Configura los campos numéricos para aceptar solo números
   */
  _setupNumericInputs() {
    const numericInputs = document.querySelectorAll(
      '#num_documento, #telefono, #beneficiario_numero_id, #numero_cuenta_bancaria'
    );
    numericInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        // Permitir solo números
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });
    });
  },

  /**
   * Configura los checkboxes para que sean excluyentes en cada grupo
   */
  _setupExclusiveCheckboxes() {
    const checkboxGroups = [
      {
        name: 'forma_retiro',
        selectors: [
          'input[name="forma_retiro"][value="transferencia"]',
          'input[name="forma_retiro"][value="cheque"]'
        ]
      },
      {
        name: 'tipo_cuenta',
        selectors: [
          'input[name="tipo_cuenta"][value="ahorro"]',
          'input[name="tipo_cuenta"][value="corriente"]'
        ]
      },
      {
        name: 'tipo_retiro',
        selectors: [
          'input[name="tipo_retiro"][value="retiro_total"]',
          'input[name="tipo_retiro"][value="traslado_afc"]',
          'input[name="tipo_retiro"][value="traslado_voluntarios"]'
        ]
      },
      {
        name: 'motivo_retiro',
        selectors: [
          'input[name="motivo_retiro"][value="gastos_inesperados"]',
          'input[name="motivo_retiro"][value="objetivo_ahorro"]',
          'input[name="motivo_retiro"][value="compra_inmobiliaria"]',
          'input[name="motivo_retiro"][value="otra_inversion"]',
          'input[name="motivo_retiro"][value="pago_obligaciones"]'
        ]
      }
    ];

    checkboxGroups.forEach(group => {
      const checkboxes = document.querySelectorAll(group.selectors.join(', '));
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            // Desmarcar otros checkboxes del mismo grupo
            checkboxes.forEach(other => {
              if (other !== checkbox) {
                other.checked = false;
              }
            });
          }
        });
      });
    });
  }
};

/**
 * Módulo de generación de PDF mejorado - Versión con corrección para SELECT y espacios
 */
const PdfGenerator = {
  /**
   * Configura el botón de generación de PDF
   */
  setup() {
    // Inicializar validaciones del formulario
    FormValidator.setup();

    // Buscar múltiples selectores posibles para el botón
    const possibleSelectors = [
      ".botón a",
      ".boton a",
      ".btn a",
      "a[href*='pdf']",
      "a[href*='PDF']",
      ".download-btn",
      ".pdf-btn",
      "#pdfButton"
    ];

    let button = null;
    
    for (const selector of possibleSelectors) {
      button = document.querySelector(selector);
      if (button) break;
    }

    if (button) {
      // Remover event listeners existentes
      button.removeEventListener("click", this._generatePdf);
      
      // Añadir nuevo event listener
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._generatePdf(e);
      });
      
      // Asegurar que el href no interfiera
      if (button.href && button.href !== '#') {
        button.setAttribute('data-original-href', button.href);
        button.href = '#';
      }
      
      console.log("PdfGenerator: Botón configurado correctamente");
    } else {
      console.warn("PdfGenerator: No se encontró el botón de descarga");
    }
  },

  /**
   * Genera el PDF con el contenido del formulario
   * @param {Event} e - Evento de click
   */
  async _generatePdf(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    try {
      // Verificar que jsPDF esté disponible
      if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("jsPDF no está cargado correctamente");
      }

      // Verificar que html2canvas esté disponible
      if (!window.html2canvas) {
        throw new Error("html2canvas no está cargado correctamente");
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "pt", "a4");
      
      // Mostrar indicador de carga
      this._showLoadingIndicator();
      
      // Preparar elementos para captura (solo ocultar botones y footer)
      const elementsToHide = this._prepareForCapture();
      
      // Pequeña pausa para que se apliquen los cambios de estilo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capturar el contenido específico
      const canvas = await this._captureFullContent();
      
      // Restaurar elementos ocultos
      this._restoreElements(elementsToHide);
      
      // Ocultar indicador de carga
      this._hideLoadingIndicator();

      // Añadir imagen al PDF
      this._addImageToPdf(pdf, canvas);
      
      // Generar nombre de archivo único
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `Formato_de_Retiro_${timestamp}.pdf`;
      
      // Descargar el PDF
      pdf.save(filename);
      
      console.log("PDF generado exitosamente:", filename);
      
    } catch (error) {
      this._handlePdfError(error);
    }
  },

  /**
   * Muestra indicador de carga
   */
  _showLoadingIndicator() {
    // Remover indicador existente si existe
    this._hideLoadingIndicator();
    
    const indicator = document.createElement('div');
    indicator.id = 'pdf-loading-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
      ">
        <div style="
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        ">
          <div style="
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
          "></div>
          <p style="margin: 0; color: #333;">Generando PDF...</p>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    document.body.appendChild(indicator);
  },

  /**
   * Oculta indicador de carga
   */
  _hideLoadingIndicator() {
    const indicator = document.getElementById('pdf-loading-indicator');
    if (indicator) {
      indicator.remove();
    }
  },

  /**
   * Prepara los elementos para la captura ocultando SOLO lo que no debe aparecer
   * @returns {Array} - Array de elementos modificados para restaurar después
   */
  _prepareForCapture() {
    const elementsToHide = [];
    
    const selectorsToHide = [
      '.contenedor-boton',
      '.botón',
      '.boton',
      'button',
      '.btn',
      '.download-btn',
      '.pdf-exclude',
      '#pdf-loading-indicator',
      '.no-pdf',
      'footer',
      '.footer'
    ];

    selectorsToHide.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.style.display !== 'none') {
            elementsToHide.push({
              element: element,
              originalDisplay: element.style.display,
              originalVisibility: element.style.visibility
            });
            element.style.display = 'none';
          }
        });
      } catch (error) {
        console.warn(`Error al ocultar elementos con selector ${selector}:`, error);
      }
    });

    return elementsToHide;
  },

  /**
   * Restaura los elementos que fueron ocultados
   * @param {Array} elementsToHide - Array de elementos a restaurar
   */
  _restoreElements(elementsToHide) {
    elementsToHide.forEach(({ element, originalDisplay, originalVisibility }) => {
      try {
        element.style.display = originalDisplay || '';
        element.style.visibility = originalVisibility || '';
      } catch (error) {
        console.warn('Error al restaurar elemento:', error);
      }
    });
  },

  /**
   * Captura el contenido específico del documento con backgrounds preservados
   * @returns {Promise<HTMLCanvasElement>} - Canvas con la imagen
   */
  async _captureFullContent() {
    const container = document.querySelector('.formulario') || document.body;

    if (!container) {
      throw new Error("No se encontró el contenedor del documento");
    }

    const scrollHeight = Math.max(
      container.scrollHeight,
      container.offsetHeight,
      container.clientHeight
    );

    return await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      removeContainer: false,
      width: container.offsetWidth,
      height: scrollHeight,
      imageTimeout: 15000,
      ignoreElements: (element) => {
        if (!element || !element.tagName) return false;

        const tagName = element.tagName.toLowerCase();
        const className = element.className || '';
        const id = element.id || '';

        const shouldIgnore = [
          tagName === 'script',
          tagName === 'style',
          tagName === 'button',
          className.includes('btn') && !className.includes('pdf-include'),
          className.includes('boton') && !className.includes('pdf-include'),
          className.includes('button') && !className.includes('pdf-include'),
          className.includes('no-pdf'),
          className.includes('pdf-exclude'),
          className.includes('download'),
          className.includes('contenedor-boton'),
          id === 'pdf-loading-indicator',
          tagName === 'footer' || className.includes('footer'),
          element.style.display === 'none',
          element.style.visibility === 'hidden'
        ].some(condition => condition);

        return shouldIgnore;
      },
      onclone: (clonedDoc, element) => {
        this._cleanClonedDocument(clonedDoc);
        this._preserveStyles(clonedDoc);
        this._preserveFormStates(clonedDoc);
      }
    });
  },

  /**
   * FUNCIÓN MODIFICADA: Preserva los estados de los elementos de formulario
   * @param {Document} clonedDoc - Documento clonado
   */
  _preserveFormStates(clonedDoc) {
    try {
      // Preservar estados de SELECT con corrección de espacios
      const originalSelects = document.querySelectorAll('select');
      const clonedSelects = clonedDoc.querySelectorAll('select');
      
      originalSelects.forEach((originalSelect, index) => {
        if (clonedSelects[index]) {
          const clonedSelect = clonedSelects[index];
          const selectedValue = originalSelect.value;
          const selectedOption = originalSelect.options[originalSelect.selectedIndex];
          
          let selectedText = selectedOption?.text || selectedOption?.textContent || '';
          // Normalizar espacios solo para el PDF
          selectedText = selectedText.trim().replace(/\s+/g, ' ');
          const selectedTextUpper = selectedText.toUpperCase();
          
          clonedSelect.value = selectedValue;
          Array.from(clonedSelect.options).forEach(option => {
            option.selected = option.value === selectedValue;
            const optionText = (option.textContent || option.text || '').trim().replace(/\s+/g, ' ');
            option.textContent = optionText.toUpperCase();
            option.text = optionText.toUpperCase();
          });
          
          const displaySpan = clonedDoc.createElement('span');
          displaySpan.textContent = selectedTextUpper;
          const originalStyles = window.getComputedStyle(originalSelect);
          
          displaySpan.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            padding-left: 8px;
            background: ${originalStyles.backgroundColor || 'white'};
            border: ${originalStyles.border || '1px solid #ccc'};
            font-family: ${originalStyles.fontFamily || '"Sofia Sans", sans-serif'};
            font-size: ${originalStyles.fontSize || 'inherit'};
            font-weight: ${originalStyles.fontWeight || 'inherit'};
            color: ${originalStyles.color || 'inherit'};
            pointer-events: none;
            z-index: 1;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: normal;
            word-spacing: normal;
            letter-spacing: normal;
          `;
          
          clonedSelect.style.opacity = '0';
          clonedSelect.style.position = 'relative';
          
          if (clonedSelect.parentNode) {
            clonedSelect.parentNode.style.position = 'relative';
            clonedSelect.parentNode.insertBefore(displaySpan, clonedSelect.nextSibling);
          }
        }
      });

      // Preservar estados de INPUT
      const originalInputs = document.querySelectorAll('input');
      const clonedInputs = clonedDoc.querySelectorAll('input');
      
      originalInputs.forEach((originalInput, index) => {
        if (clonedInputs[index]) {
          const clonedInput = clonedInputs[index];
          
          if (originalInput.type === 'checkbox' || originalInput.type === 'radio') {
            clonedInput.checked = originalInput.checked;
          } else if (originalInput.type === 'date') {
            clonedInput.value = originalInput.value;
          } else {
            // Normalizar espacios solo para el PDF
            let cleanValue = originalInput.value.trim().replace(/\s+/g, ' ');
            // Aplicar mayúsculas solo a campos de texto, no a numéricos
            const isNumeric = ['num_documento', 'telefono', 'beneficiario_numero_id', 'numero_cuenta_bancaria'].includes(originalInput.id);
            if (!isNumeric) {
              cleanValue = cleanValue.toUpperCase();
            }
            clonedInput.value = cleanValue;
            
            const originalStyles = window.getComputedStyle(originalInput);
            clonedInput.style.fontFamily = originalStyles.fontFamily || '"Sofia Sans", sans-serif';
            clonedInput.style.fontSize = originalStyles.fontSize;
            clonedInput.style.fontWeight = originalStyles.fontWeight;
            clonedInput.style.wordSpacing = 'normal';
            clonedInput.style.letterSpacing = 'normal';
            if (!isNumeric) {
              clonedInput.style.textTransform = 'uppercase';
            }
          }
        }
      });

      // Preservar estados de TEXTAREA (no hay en este formulario, pero se mantiene por compatibilidad)
      const originalTextareas = document.querySelectorAll('textarea');
      const clonedTextareas = clonedDoc.querySelectorAll('textarea');
      
      originalTextareas.forEach((originalTextarea, index) => {
        if (clonedTextareas[index]) {
          const cleanValue = originalTextarea.value.trim().replace(/\s+/g, ' ');
          const upperValue = cleanValue.toUpperCase();
          clonedTextareas[index].value = upperValue;
          clonedTextareas[index].textContent = upperValue;
          
          const originalStyles = window.getComputedStyle(originalTextarea);
          clonedTextareas[index].style.textTransform = 'uppercase';
          clonedTextareas[index].style.fontFamily = originalStyles.fontFamily || '"Sofia Sans", sans-serif';
          clonedTextareas[index].style.fontSize = originalStyles.fontSize;
          clonedTextareas[index].style.fontWeight = originalStyles.fontWeight;
          clonedTextareas[index].style.wordSpacing = 'normal';
          clonedTextareas[index].style.letterSpacing = 'normal';
        }
      });

    } catch (error) {
      console.warn('Error al preservar estados de formulario:', error);
    }
  },

  /**
   * Limpia SOLO elementos específicos del documento clonado
   * @param {Document} clonedDoc - Documento clonado
   */
  _cleanClonedDocument(clonedDoc) {
    const selectorsToRemove = [
      'button',
      '.btn:not(.pdf-include)',
      '.botón:not(.pdf-include)',
      '.boton:not(.pdf-include)',
      '.contenedor-boton',
      '.no-pdf',
      '.pdf-exclude',
      '.download-btn',
      'script',
      'style:not([data-styled]):not([data-emotion])',
      '#pdf-loading-indicator',
      'footer',
      '.footer'
    ];

    selectorsToRemove.forEach(selector => {
      try {
        const elements = clonedDoc.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      } catch (error) {
        console.warn(`Error al remover elementos ${selector} del clon:`, error);
      }
    });
  },

  /**
   * Preserva todos los estilos originales incluyendo backgrounds y font-family
   * @param {Document} clonedDoc - Documento clonado
   */
  _preserveStyles(clonedDoc) {
    try {
      const allElements = clonedDoc.querySelectorAll('*');
      allElements.forEach(el => {
        try {
          const originalEl = this._findOriginalElement(el);
          if (originalEl) {
            const computedStyle = window.getComputedStyle(originalEl);
            
            if (computedStyle.fontFamily) {
              el.style.fontFamily = computedStyle.fontFamily;
            }
            if (computedStyle.fontSize) {
              el.style.fontSize = computedStyle.fontSize;
            }
            if (computedStyle.fontWeight) {
              el.style.fontWeight = computedStyle.fontWeight;
            }
            if (computedStyle.color) {
              el.style.color = computedStyle.color;
            }
            if (computedStyle.wordSpacing) {
              el.style.wordSpacing = computedStyle.wordSpacing;
            }
            if (computedStyle.letterSpacing) {
              el.style.letterSpacing = computedStyle.letterSpacing;
            }
            if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
              el.style.backgroundColor = computedStyle.backgroundColor;
            }
            if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
              el.style.backgroundImage = computedStyle.backgroundImage;
              el.style.backgroundSize = computedStyle.backgroundSize;
              el.style.backgroundPosition = computedStyle.backgroundPosition;
              el.style.backgroundRepeat = computedStyle.backgroundRepeat;
            }
            if (computedStyle.border && computedStyle.border !== 'none') {
              el.style.border = computedStyle.border;
            }
            if (el.tagName.toLowerCase() === 'img') {
              el.style.maxWidth = computedStyle.maxWidth || '100%';
              el.style.height = computedStyle.height || 'auto';
            }
          }
        } catch (error) {
          // Ignorar errores de elementos individuales
        }
      });
    } catch (error) {
      console.warn('Error al preservar estilos:', error);
    }
  },

  /**
   * Encuentra el elemento original correspondiente en el DOM
   * @param {Element} clonedElement - Elemento clonado
   * @returns {Element|null} - Elemento original o null
   */
  _findOriginalElement(clonedElement) {
    try {
      if (clonedElement.id) {
        return document.getElementById(clonedElement.id);
      }
      if (clonedElement.className) {
        const elements = document.getElementsByClassName(clonedElement.className);
        if (elements.length === 1) {
          return elements[0];
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Añade la imagen al PDF con mejor ajuste
   * @param {jsPDF} pdf - Instancia de jsPDF
   * @param {HTMLCanvasElement} canvas - Canvas con la imagen
   */
  _addImageToPdf(pdf, canvas) {
    const imageData = canvas.toDataURL("image/png", 1.0);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxWidth = pdfWidth - (margin * 2);
    const maxHeight = pdfHeight - (margin * 2);
    const scaleX = maxWidth / canvas.width;
    const scaleY = maxHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY, 1.0);
    const imgWidth = canvas.width * scale;
    const imgHeight = canvas.height * scale;
    const xPos = (pdfWidth - imgWidth) / 2;
    const yPos = margin;

    if (imgHeight > maxHeight) {
      this._addMultiPageImage(pdf, imageData, canvas, imgWidth, maxHeight, xPos, margin);
    } else {
      pdf.addImage(imageData, "PNG", xPos, yPos, imgWidth, imgHeight);
    }
  },

  /**
   * Añade imagen en múltiples páginas si es muy alta
   * @param {jsPDF} pdf - Instancia de jsPDF
   * @param {string} imageData - Datos de la imagen
   * @param {HTMLCanvasElement} canvas - Canvas original
   * @param {number} imgWidth - Ancho de la imagen en el PDF
   * @param {number} maxHeight - Altura máxima por página
   * @param {number} xPos - Posición X
   * @param {number} margin - Margen
   */
  _addMultiPageImage(pdf, imageData, canvas, imgWidth, maxHeight, xPos, margin) {
    const scale = imgWidth / canvas.width;
    let currentY = 0;
    let pageCount = 0;
    
    while (currentY < canvas.height) {
      if (pageCount > 0) {
        pdf.addPage();
      }
      
      const remainingHeight = canvas.height - currentY;
      const sliceHeight = Math.min(remainingHeight, maxHeight / scale);
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sliceHeight;
      
      tempCtx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      
      const sliceImageData = tempCanvas.toDataURL("image/png", 1.0);
      const sliceImgHeight = sliceHeight * scale;
      
      pdf.addImage(sliceImageData, "PNG", xPos, margin, imgWidth, sliceImgHeight);
      
      currentY += sliceHeight;
      pageCount++;
    }
  },

  /**
   * Maneja errores en la generación del PDF
   * @param {Error} error - Error ocurrido
   */
  _handlePdfError(error) {
    console.error("Error al generar PDF:", error);
    this._hideLoadingIndicator();
    let errorMessage = "Error al generar el PDF. ";
    if (error.message.includes('jsPDF')) {
      errorMessage += "La librería jsPDF no está disponible.";
    } else if (error.message.includes('html2canvas')) {
      errorMessage += "La librería html2canvas no está disponible.";
    } else if (error.message.includes('contenedor')) {
      errorMessage += "No se encontró el contenido del documento.";
    } else {
      errorMessage += "Por favor, intenta nuevamente.";
    }
    alert(errorMessage);
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PdfGenerator.setup();
  });
} else {
  PdfGenerator.setup();
}

// También inicializar después de un pequeño delay para asegurar que todo esté cargado
setTimeout(() => {
  PdfGenerator.setup();
}, 1000);