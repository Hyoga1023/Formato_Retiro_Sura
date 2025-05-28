document.addEventListener("DOMContentLoaded", () => {
  /**
   * Módulo de validación de campos
   */
  const FieldValidator = {
    /**
     * Aplica validación a un conjunto de campos
     * @param {string[]} ids - Array de IDs de elementos
     * @param {RegExp} regex - Expresión regular para validación
     * @param {Function} [transform] - Función de transformación opcional
     */
    validateInputs(ids, regex, transform) {
      ids.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          this._setupInputValidation(input, regex, transform);
        }
      });
    },

    /**
     * Configura la validación para un input individual
     * @param {HTMLElement} input - Elemento input
     * @param {RegExp} regex - Expresión regular
     * @param {Function} [transform] - Función de transformación
     */
    _setupInputValidation(input, regex, transform) {
      input.addEventListener("input", () => {
        input.value = input.value.replace(regex, "");
        if (transform) {
          input.value = transform(input.value);
        }
      });
    }
  };

  /**
   * Módulo de manejo de checkboxes exclusivos
   */
  const ExclusiveCheckboxManager = {
    /**
     * Hace que los checkboxes con el mismo name sean mutuamente exclusivos
     * @param {string[]} groupNames - Nombres de los grupos de checkboxes
     */
    setupExclusiveGroups(groupNames) {
      groupNames.forEach(groupName => {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        checkboxes.forEach(checkbox => {
          this._setupExclusiveBehavior(checkbox, groupName);
        });
      });
    },

    /**
     * Configura el comportamiento exclusivo para un checkbox individual
     * @param {HTMLElement} checkbox - Elemento checkbox
     * @param {string} groupName - Nombre del grupo
     */
    _setupExclusiveBehavior(checkbox, groupName) {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          this._uncheckOthers(checkbox, groupName);
        }
      });
    },

    /**
     * Desmarca todos los checkboxes del grupo excepto el proporcionado
     * @param {HTMLElement} currentCheckbox - Checkbox que debe permanecer marcado
     * @param {string} groupName - Nombre del grupo
     */
    _uncheckOthers(currentCheckbox, groupName) {
      document.querySelectorAll(`input[name="${groupName}"]`).forEach(cb => {
        if (cb !== currentCheckbox) {
          cb.checked = false;
        }
      });
    }
  };

  /**
   * Módulo de manejo del campo de monto de retiro
   */
  const AmountFieldManager = {
    /**
     * Configura la interacción entre el checkbox y el campo de monto
     */
    setup() {
      const checkbox = document.getElementById("maximo_disponible");
      const input = document.getElementById("monto_retiro");

      if (checkbox && input) {
        this._setupToggleBehavior(checkbox, input);
        this._setupInputClearing(input, checkbox);
        this._toggleInputState(checkbox, input);
      }
    },

    /**
     * Configura el comportamiento de toggle
     * @param {HTMLElement} checkbox - Elemento checkbox
     * @param {HTMLElement} input - Elemento input
     */
    _setupToggleBehavior(checkbox, input) {
      checkbox.addEventListener("change", () => {
        this._toggleInputState(checkbox, input);
      });
    },

    /**
     * Configura el borrado del input cuando se escribe
     * @param {HTMLElement} input - Elemento input
     * @param {HTMLElement} checkbox - Elemento checkbox
     */
    _setupInputClearing(input, checkbox) {
      input.addEventListener("input", e => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
        if (e.target.value) {
          checkbox.checked = false;
        }
      });
    },

    /**
     * Alterna el estado del input basado en el checkbox
     * @param {HTMLElement} checkbox - Elemento checkbox
     * @param {HTMLElement} input - Elemento input
     */
    _toggleInputState(checkbox, input) {
      input.disabled = checkbox.checked;
      input.value = checkbox.checked ? "" : input.value;
      input.parentElement.classList.toggle("disabled", checkbox.checked);
    }
  };

  /**
   * Módulo de generación de PDF mejorado - Sin cuadro negro
   */
  const PdfGenerator = {
    /**
     * Configura el botón de generación de PDF
     */
    setup() {
      const button = document.querySelector(".botón a");
      if (button) {
        button.addEventListener("click", this._generatePdf.bind(this));
      }
    },

    /**
     * Genera el PDF con el contenido del formulario
     * @param {Event} e - Evento de click
     */
    async _generatePdf(e) {
      e.preventDefault();
      
      try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "pt", "a4");
        
        // Ocultar temporalmente el botón de descarga
        const downloadButton = document.querySelector(".contenedor-boton");
        const originalDisplay = downloadButton ? downloadButton.style.display : null;
        if (downloadButton) {
          downloadButton.style.display = "none";
        }

        // Capturar directamente los elementos visibles
        const canvas = await this._captureVisibleContent();
        
        // Restaurar el botón
        if (downloadButton) {
          downloadButton.style.display = originalDisplay || "";
        }

        this._addImageToPdf(pdf, canvas);
        pdf.save("Formato_de_Retiro.pdf");
      } catch (error) {
        this._handlePdfError(error);
      }
    },

    /**
     * Captura el contenido visible directamente
     * @returns {Promise<HTMLCanvasElement>} - Canvas con la imagen
     */
    async _captureVisibleContent() {
      // Seleccionar el contenido principal a capturar
      const contentToCapture = document.body;
      
      return await html2canvas(contentToCapture, {
        scale: 2, // Mejor calidad
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff', // Fondo blanco sólido
        scrollX: 0,
        scrollY: 0,
        width: window.innerWidth,
        height: document.body.scrollHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        logging: false,
        removeContainer: true,
        ignoreElements: (element) => {
          // Ignorar elementos que pueden causar problemas
          return element.classList.contains('no-pdf') || 
                 element.tagName === 'SCRIPT' ||
                 element.tagName === 'STYLE';
        },
        onclone: (clonedDoc, element) => {
          // Asegurar fondos blancos en el documento clonado
          const clonedBody = clonedDoc.body;
          if (clonedBody) {
            clonedBody.style.backgroundColor = '#ffffff';
            clonedBody.style.background = '#ffffff';
          }
          
          // Aplicar estilos adicionales para evitar transparencias
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                computedStyle.backgroundColor === 'transparent') {
              el.style.backgroundColor = 'white';
            }
          });
          
          // Ocultar botón de descarga en el clon
          const clonedButton = clonedDoc.querySelector(".contenedor-boton");
          if (clonedButton) {
            clonedButton.style.display = "none";
          }
        }
      });
    },

    /**
     * Añade la imagen al PDF con mejor ajuste
     * @param {jsPDF} pdf - Instancia de jsPDF
     * @param {HTMLCanvasElement} canvas - Canvas con la imagen
     */
    _addImageToPdf(pdf, canvas) {
      const imageData = canvas.toDataURL("image/png", 1.0); // PNG para mejor calidad
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Margen más conservador
      const margin = 20;
      const maxWidth = pdfWidth - (margin * 2);
      const maxHeight = pdfHeight - (margin * 2);
      
      // Calcular escala manteniendo proporción
      const scaleX = maxWidth / canvas.width;
      const scaleY = maxHeight / canvas.height;
      const scale = Math.min(scaleX, scaleY, 0.8); // Reducir un poco más para evitar recortes
      
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;
      
      // Centrar la imagen
      const xPos = (pdfWidth - imgWidth) / 2;
      const yPos = margin;

      // Si la imagen es muy alta, dividirla en páginas
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
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const scale = imgWidth / canvas.width;
      
      let currentY = 0;
      let pageCount = 0;
      
      while (currentY < canvas.height) {
        if (pageCount > 0) {
          pdf.addPage();
        }
        
        const remainingHeight = canvas.height - currentY;
        const sliceHeight = Math.min(remainingHeight, maxHeight / scale);
        
        // Crear canvas temporal para esta sección
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sliceHeight;
        
        // Copiar la sección correspondiente
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
      alert("Error al generar el PDF. Por favor, intenta nuevamente.");
    }
  };

  /**
   * Versión alternativa simple del generador de PDF
   * (Descomenta este bloque y comenta el PdfGenerator anterior si necesitas una versión más simple)
   */
  /*
  const SimplePdfGenerator = {
    setup() {
      const button = document.querySelector(".botón a");
      if (button) {
        button.addEventListener("click", this._generatePdf.bind(this));
      }
    },

    async _generatePdf(e) {
      e.preventDefault();
      
      try {
        // Ocultar botón temporalmente
        const downloadButton = document.querySelector(".contenedor-boton");
        if (downloadButton) downloadButton.style.display = "none";
        
        // Esperar un poco para que se aplique el cambio
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        
        // Captura más simple y directa
        const canvas = await html2canvas(document.body, {
          backgroundColor: '#ffffff',
          scale: 1,
          logging: false,
          useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        const imgWidth = 190; // A4 width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
        pdf.save('Formato_de_Retiro.pdf');
        
        // Restaurar botón
        if (downloadButton) downloadButton.style.display = "";
        
      } catch (error) {
        console.error("Error:", error);
        alert("Error al generar el PDF");
      }
    }
  };
  */

  // ==========================================
  // INICIALIZACIÓN DE TODOS LOS MÓDULOS
  // ==========================================

  // Validación de campos de texto (solo letras y espacios, convertir a mayúsculas)
  FieldValidator.validateInputs(
    ["nombre", "patrocinadora", "beneficiario_nombre_completo", "entidad_bancaria"],
    /[^a-zA-ZÀ-ÿ\s]/g, // Incluye caracteres con tildes
    val => val.toUpperCase()
  );

  // Validación de campos numéricos (solo números)
  FieldValidator.validateInputs(
    ["num_documento", "telefono", "beneficiario_numero_id", "numero_cuenta_bancaria"],
    /[^0-9]/g
  );

  // Configurar el manejo del campo de monto de retiro
  AmountFieldManager.setup();
  
  // Configurar checkboxes exclusivos para diferentes grupos
  ExclusiveCheckboxManager.setupExclusiveGroups([
    "tipo_retiro", 
    "motivo_retiro", 
    "forma_retiro", 
    "tipo_cuenta"
  ]);

  // Configurar la generación de PDF
  PdfGenerator.setup();
  
  // Para usar la versión simple, descomenta la siguiente línea y comenta la anterior:
  // SimplePdfGenerator.setup();

  // Mensaje de inicialización exitosa (opcional, para debugging)
  console.log("✅ Todos los módulos del formulario han sido inicializados correctamente");
});