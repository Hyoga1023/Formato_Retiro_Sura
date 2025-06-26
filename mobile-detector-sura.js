// Función para detectar dispositivos móviles - VERSIÓN CORREGIDA
function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Obtener dimensiones de pantalla
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    
    // Detectar explícitamente tablets para excluirlas
    const isTablet = /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook|bb10.*touch/i.test(userAgent);
    
    // Detectar específicamente teléfonos móviles
    const isPhone = /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
    
    // Verificar si es claramente una laptop/desktop por resolución
    const isDesktopResolution = screenWidth >= 768 && screenHeight >= 600;
    
    // Detectar laptops táctiles comunes (Surface, etc.)
    const isTouchLaptop = /windows.*touch|surface/i.test(userAgent) && screenWidth >= 768;
    
    // Verificar ratio de aspecto típico de teléfonos (más alto que ancho)
    const isPhoneAspectRatio = screenHeight > screenWidth && (screenHeight / screenWidth) >= 1.3;
    
    // LÓGICA PRINCIPAL:
    // Es móvil SOLO si:
    // 1. Es detectado como teléfono en user agent
    // 2. Y tiene pantalla pequeña (máximo 767px de ancho)
    // 3. Y NO es tablet
    // 4. Y NO es laptop táctil
    const isMobile = isPhone && 
                     screenWidth <= 767 && 
                     !isTablet && 
                     !isTouchLaptop &&
                     !isDesktopResolution;
    
    return isMobile;
}

// Función para mostrar la alerta de SweetAlert2
function showMobileAlert() {
    // Inyectar SweetAlert2 CSS personalizado - Tema Sura
    const style = document.createElement('style');
    style.textContent = `
        .swal2-popup {
            font-family: 'Sofia Sans', sans-serif !important;
            border-radius: 15px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
        }
        
        .swal2-title {
            color: #d32f2f !important;
            font-weight: 800 !important;
            font-size: 1.5rem !important;
            margin-bottom: 10px !important;
        }
        
        .swal2-html-container {
            color: #333 !important;
            font-size: 1rem !important;
            line-height: 1.5 !important;
            margin: 15px 0 !important;
        }
        
        .swal2-icon.swal2-warning {
            border-color: #333 !important;
            color: #333 !important;
        }
        
        .swal2-confirm {
            background: linear-gradient(135deg, #333 0%, #555 100%) !important;
            border: none !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            padding: 12px 30px !important;
            font-size: 1rem !important;
            transition: all 0.3s ease !important;
            color: white !important;
        }
        
        .swal2-confirm:hover {
            background: linear-gradient(135deg, #222 0%, #444 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 5px 15px rgba(51, 51, 51, 0.4) !important;
        }
        
        .swal2-backdrop {
            background-color: rgba(0, 0, 0, 0.6) !important;
        }
        
        .sura-brand-accent {
            border-left: 4px solid #333;
            padding-left: 12px;
            margin: 15px 0;
        }
        
        @media (max-width: 768px) {
            .swal2-popup {
                width: 90% !important;
                margin: 0 auto !important;
            }
            
            .swal2-title {
                font-size: 1.3rem !important;
            }
            
            .swal2-html-container {
                font-size: 0.9rem !important;
            }
        }
    `;
    document.head.appendChild(style);

    // Mostrar la alerta con tema Sura
    Swal.fire({
        title: '⚠️ Dispositivo No Compatible',
        html: `
            <div style="text-align: left; padding: 10px;">
                <div class="sura-brand-accent">
                    <p><strong>Estimado usuario,</strong> este formulario de <strong>Solicitud de Retiro/Traslado Sura</strong> está optimizado únicamente para:</p>
                </div>
                <ul style="margin: 15px 0; padding-left: 20px; color: #333;">
                    <li>💻 <strong>Computadores de escritorio</strong></li>
                    <li>💻 <strong>Laptops y portátiles</strong></li>
                </ul>
                <div style="background-color: #f5f5f5; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #333;">
                    <p style="margin: 0; color: #333; font-size: 0.9rem;">
                        <strong>Importante:</strong> Para garantizar la correcta cumplimentación del formulario y evitar errores en su solicitud, necesita una pantalla más grande.
                    </p>
                </div>
                <p style="margin-top: 15px; font-size: 0.9rem; color: #666;">
                    <em>Gracias por su comprensión y confianza en Sura.</em>
                </p>
            </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: true,
        buttonsStyling: true,
        customClass: {
            popup: 'sura-mobile-alert-popup',
            title: 'sura-mobile-alert-title',
            htmlContainer: 'sura-mobile-alert-content',
            confirmButton: 'sura-mobile-alert-button'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Ocultar el contenido y mostrar un mensaje estilo Sura
            document.body.style.display = 'none';
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #333 0%, #555 100%);
                    font-family: 'Sofia Sans', sans-serif;
                    color: white;
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="max-width: 500px;">
                        <div style="font-size: 3rem; margin-bottom: 20px;">
                            📱➡️💻
                        </div>
                        <h1 style="font-size: 2rem; margin-bottom: 15px; font-weight: 800;">
                            Formato Retiro Sura
                        </h1>
                        <h2 style="margin-bottom: 20px; font-weight: 400; color: #e6f3ff;">
                            Acceso desde Computador Requerido
                        </h2>
                        <div style="
                            background-color: rgba(255, 255, 255, 0.1);
                            padding: 20px;
                            border-radius: 10px;
                            margin: 20px 0;
                        ">
                            <p style="font-size: 1.1rem; opacity: 0.9; margin: 0;">
                                Por favor, acceda a este formulario desde un computador o laptop para una experiencia óptima.
                            </p>
                        </div>
                        <p style="font-size: 0.9rem; opacity: 0.7;">
                            Plan Institucional Fondo Sura - Cód 9872
                        </p>
                    </div>
                </div>
            `;
            document.body.style.display = 'block';
        }
    });
}

// Función principal que se ejecuta cuando se carga la página
function checkDeviceCompatibility() {
    if (isMobileDevice()) {
        // Esperar un poco para que SweetAlert2 se cargue completamente
        setTimeout(() => {
            showMobileAlert();
        }, 500);
    }
}

// Debug: Función para verificar qué está detectando
function debugDeviceInfo() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    
    console.log('=== SURA DEVICE DEBUG INFO ===');
    console.log('User Agent:', userAgent);
    console.log('Screen Width:', screenWidth);
    console.log('Screen Height:', screenHeight);
    console.log('Screen Ratio (H/W):', (screenHeight / screenWidth).toFixed(2));
    console.log('Is Phone (UserAgent):', /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent));
    console.log('Is Tablet (UserAgent):', /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook|bb10.*touch/i.test(userAgent));
    console.log('Is Touch Laptop:', /windows.*touch|surface/i.test(userAgent) && screenWidth >= 768);
    console.log('Is Desktop Resolution:', screenWidth >= 768 && screenHeight >= 600);
    console.log('FINAL RESULT - Is Mobile:', isMobileDevice());
    console.log('==============================');
}

// Ejecutar la verificación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        debugDeviceInfo(); // Puedes eliminar esta línea en producción
        checkDeviceCompatibility();
    });
} else {
    debugDeviceInfo(); // Puedes eliminar esta línea en producción
    checkDeviceCompatibility();
}

// También verificar en caso de cambio de orientación o redimensionamiento
let resizeTimer;
window.addEventListener('resize', () => {
    // Debounce para evitar múltiples llamadas
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (isMobileDevice() && !document.querySelector('.swal2-container')) {
            showMobileAlert();
        }
    }, 300);
});

// Verificar cuando cambia la orientación del dispositivo
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (isMobileDevice() && !document.querySelector('.swal2-container')) {
            showMobileAlert();
        }
    }, 500);
});