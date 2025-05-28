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
   * Módulo de generación de PDF
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
        const container = this._createPdfContainer();
        
        document.body.appendChild(container);
        const canvas = await this._captureCanvas(container);
        document.body.removeChild(container);

        this._addImageToPdf(pdf, canvas);
        pdf.save("Formato_de_Retiro.pdf");
      } catch (error) {
        this._handlePdfError(error);
      }
    },

    /**
     * Crea el contenedor para el contenido del PDF
     * @returns {HTMLElement} - Contenedor creado
     */
    _createPdfContainer() {
      const container = document.createElement("div");
      container.className = "pdf-container";
      
      // Estilos básicos para el contenedor PDF - mantiene el layout original
      Object.assign(container.style, {
        position: 'absolute',
        top: '-9999px',
        left: '0',
        width: '100%',
        maxWidth: 'none',
        backgroundColor: 'white',
        fontFamily: 'Sofia Sans, sans-serif',
        padding: '0',
        margin: '0'
      });

      // Clonar elementos manteniendo sus estilos originales
      const headerClone = document.querySelector("header").cloneNode(true);
      const mainClone = document.querySelector("main").cloneNode(true);

      // Ocultar el botón de descarga en el PDF
      const hideButton = mainClone.querySelector(".contenedor-boton");
      if (hideButton) {
        hideButton.style.display = "none";
      }

      // Crear un link temporal al CSS para que html2canvas lo capture
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = './estilos.css'; // Ajusta la ruta según tu estructura
      container.appendChild(linkElement);

      container.append(headerClone, mainClone);
      return container;
    },

    /**
     * Captura el contenido como canvas
     * @param {HTMLElement} container - Contenedor a capturar
     * @returns {Promise<HTMLCanvasElement>} - Canvas con la imagen
     */
    async _captureCanvas(container) {
      return await html2canvas(container, { 
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: container.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
    },

    /**
     * Añade la imagen al PDF
     * @param {jsPDF} pdf - Instancia de jsPDF
     * @param {HTMLCanvasElement} canvas - Canvas con la imagen
     */
    _addImageToPdf(pdf, canvas) {
      const imageData = canvas.toDataURL("image/jpeg", 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensiones manteniendo proporción
      const imgWidth = pdfWidth - 40; // Margen de 20px a cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Centrar la imagen
      const xPos = 20; // Margen izquierdo
      const yPos = 20; // Margen superior

      // Si la imagen es más alta que la página, ajustar
      if (imgHeight > pdfHeight - 40) {
        const scaleFactor = (pdfHeight - 40) / imgHeight;
        const newWidth = imgWidth * scaleFactor;
        const newHeight = imgHeight * scaleFactor;
        const centeredX = (pdfWidth - newWidth) / 2;
        
        pdf.addImage(imageData, "JPEG", centeredX, yPos, newWidth, newHeight);
      } else {
        pdf.addImage(imageData, "JPEG", xPos, yPos, imgWidth, imgHeight);
      }
    },

    /**
     * Maneja errores en la generación del PDF
     * @param {Error} error - Error ocurrido
     */
    _handlePdfError(error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF. Revisa la consola para más detalles.");
    }
  };

  // Inicialización de los módulos
  FieldValidator.validateInputs(
    ["nombre", "patrocinadora", "beneficiario_nombre_completo", "entidad_bancaria"],
    /[^a-zA-Z\s]/g,
    val => val.toUpperCase()
  );

  FieldValidator.validateInputs(
    ["num_documento", "telefono", "beneficiario_numero_id", "numero_cuenta_bancaria"],
    /[^0-9]/g
  );

  AmountFieldManager.setup();
  
  ExclusiveCheckboxManager.setupExclusiveGroups([
    "tipo_retiro", 
    "motivo_retiro", 
    "forma_retiro", 
    "tipo_cuenta"
  ]);

  PdfGenerator.setup();
});