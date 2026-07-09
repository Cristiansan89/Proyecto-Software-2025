import { useState } from "react";
import InstruccionesStyle from "../../styles/Instrucciones.module.css";

const TelegramInstructionsModal = ({
  show,
  onClose,
  botName = "@DocenteComedor_Bot",
}) => {
  const [activeTab, setActiveTab] = useState("docente");

  if (!show) return null;

  return (
    <div>
      <div onClick={(e) => e.stopPropagation()}>
        {/* Tabs */}
        <div className={InstruccionesStyle.tabs}>
          <button
            className={`${InstruccionesStyle.tabBtn} ${activeTab === "docente" ? InstruccionesStyle.active : ""}`}
            onClick={() => setActiveTab("docente")}
          >
            <i className="fas fa-chalkboard-user me-2"></i>
            Para Docentes
          </button>

          <button
            className={`${InstruccionesStyle.tabBtn} ${activeTab === "proveedor" ? InstruccionesStyle.active : ""}`}
            onClick={() => setActiveTab("proveedor")}
          >
            <i className="fas fa-store me-2"></i>
            Para Proveedores
          </button>

          <button
            className={`${InstruccionesStyle.tabBtn} ${activeTab === "faq" ? InstruccionesStyle.active : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            <i className="fas fa-question-circle me-2"></i>
            Preguntas Frecuentes
          </button>
        </div>

        {/* Content */}
        <div className={InstruccionesStyle.modalBody}>
          {/* Docentes */}
          {activeTab === "docente" && (
            <div className={InstruccionesStyle.content}>
              <h3 className={InstruccionesStyle.sectionTitle}>
                <i className="fas fa-graduation-cap me-2"></i>
                Configuración para Docentes
              </h3>

              <div className={InstruccionesStyle.step}>
                <div className={`${InstruccionesStyle.stepNumber} text-white`}>
                  1
                </div>
                <div className={InstruccionesStyle.stepContent}>
                  <h4>Buscar el Bot de Telegram</h4>
                  <p>
                    Abre <strong>Telegram</strong> en tu teléfono o navegador y
                    busca:
                  </p>
                  <div className={InstruccionesStyle.codeBlock}>
                    <code>{botName}</code>
                    <button
                      className={InstruccionesStyle.copyBtn}
                      onClick={() => {
                        navigator.clipboard.writeText(botName);
                        alert("Copiado al portapapeles");
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className={InstruccionesStyle.step}>
                <div className={`${InstruccionesStyle.stepNumber} text-white`}>
                  2
                </div>
                <div className={InstruccionesStyle.stepContent}>
                  <h4>Iniciar Conversación con /start</h4>
                  <p>
                    Una vez hayas encontrado el bot,{" "}
                    <strong>haz clic en él</strong> y luego escribe:
                  </p>
                  <div className={InstruccionesStyle.codeBlock}>
                    <code>/start</code>
                  </div>
                  <p className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Este comando es importante. El bot necesita saber que
                    iniciaste conversación con él.
                  </p>
                </div>
              </div>

              <div className={InstruccionesStyle.step}>
                <div className={`${InstruccionesStyle.stepNumber} text-white`}>
                  3
                </div>
                <div className={InstruccionesStyle.stepContent}>
                  <h4>Obtener tu Chat ID</h4>
                  <p>
                    Después de escribir <code>/start</code>, el bot te
                    responderá. Luego, escribe:
                  </p>
                  <div className={InstruccionesStyle.codeBlock}>
                    <code>/chatid</code>
                  </div>
                  <p>El bot te mostrará un número largo como:</p>
                  <div className={InstruccionesStyle.exampleBlock}>
                    <strong>Tu Chat ID es: 1234567890</strong>
                  </div>
                  <p className="text-muted">
                    <i className="fas fa-clipboard me-1"></i>
                    <strong>Copia este número.</strong> Lo necesitarás en el
                    siguiente paso.
                  </p>
                </div>
              </div>

              <div className={InstruccionesStyle.step}>
                <div className={`${InstruccionesStyle.stepNumber} text-white`}>
                  4
                </div>
                <div className={InstruccionesStyle.stepContent}>
                  <h4>Guardar el Chat ID en la App</h4>
                  <ol className={InstruccionesStyle.stepsList}>
                    <li>Vuelve a esta página (Configuración Telegram)</li>
                    <li>Busca tu nombre en la tabla "Docentes"</li>
                    <li>
                      Haz clic en el botón <strong>"Editar"</strong> (lapicito)
                    </li>
                    <li>Pega el Chat ID que copiaste en el paso anterior</li>
                    <li>
                      Haz clic en <strong>"Guardar"</strong>
                    </li>
                  </ol>
                  <p className={InstruccionesStyle.successText}>
                    <i className="fas fa-check-circle me-1"></i>
                    ¡Listo! Ahora recibirás los mensajes de asistencias en
                    Telegram
                  </p>
                </div>
              </div>

              <div className={InstruccionesStyle.alertInfo}>
                <i className="fas fa-lightbulb me-2"></i>
                <strong>Consejo:</strong> Si al hacer clic en "Enviar por
                Telegram" ves un error "chat not found", significa que olvidaste
                hacer /start. Repite el paso 2.
              </div>
            </div>
          )}

          {/* Proveedores */}
          {activeTab === "proveedor" && (
            <div className={InstruccionesStyle.content}>
              <h3 className={InstruccionesStyle.sectionTitle}>
                <i className="fas fa-shopping-cart me-2"></i>
                Configuración para Proveedores
              </h3>

              <div className={InstruccionesStyle.step}>
                <div className={`${InstruccionesStyle.stepNumber} text-white`}>
                  1
                </div>
                <div className={InstruccionesStyle.stepContent}>
                  <h4>Buscar el Bot de Telegram para Proveedores</h4>
                  <p>
                    Abre <strong>Telegram</strong> y busca:
                  </p>
                  <div className={InstruccionesStyle.codeBlock}>
                    <code>@ProveedorComedor_Bot</code>
                    <button
                      className={InstruccionesStyle.copyBtn}
                      onClick={() => {
                        navigator.clipboard.writeText("@ProveedorComedor_Bot");
                        alert("Copiado al portapapeles");
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className={InstruccionesStyle.step}>
                <div className={`${InstruccionesStyle.stepNumber} text-white`}>
                  2
                </div>
                <div className={InstruccionesStyle.stepContent}>
                  <h4>Iniciar Conversación con /start</h4>
                  <p>Escribe:</p>
                  <div className={InstruccionesStyle.codeBlock}>
                    <code>/start</code>
                  </div>
                </div>
              </div>

              <div className={InstruccionesStyle.step}>
                <div className={`${InstruccionesStyle.stepNumber} text-white`}>
                  3
                </div>
                <div className={InstruccionesStyle.stepContent}>
                  <h4>Obtener tu Chat ID</h4>
                  <p>Escribe:</p>
                  <div className={InstruccionesStyle.codeBlock}>
                    <code>/chatid</code>
                  </div>
                  <p>Copia el número que te muestre el bot.</p>
                </div>
              </div>

              <div className={InstruccionesStyle.step}>
                <div className={`${InstruccionesStyle.stepNumber} text-white`}>
                  4
                </div>
                <div className={InstruccionesStyle.stepContent}>
                  <h4>Guardar el Chat ID en la App</h4>
                  <ol className={InstruccionesStyle.stepsList}>
                    <li>Busca tu nombre en la tabla "Proveedores"</li>
                    <li>
                      Haz clic en el botón <strong>"Editar"</strong>
                    </li>
                    <li>Pega el Chat ID</li>
                    <li>
                      Haz clic en <strong>"Guardar"</strong>
                    </li>
                  </ol>
                  <p className={InstruccionesStyle.successText}>
                    <i className="fas fa-check-circle me-1"></i>
                    ¡Listo! Recibirás notificaciones de pedidos en Telegram
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FAQ */}
          {activeTab === "faq" && (
            <div className={InstruccionesStyle.content}>
              <h3 className={InstruccionesStyle.sectionTitle}>
                <i className="fas fa-question-circle me-2"></i>
                Preguntas Frecuentes
              </h3>

              <div className={InstruccionesStyle.faqItem}>
                <h4>
                  <i className="fas fa-chevron-right me-2"></i>
                  ¿Qué es un Chat ID?
                </h4>
                <p>
                  Un Chat ID es un número único que identifica tu conversación
                  con el bot en Telegram. Es como tu "dirección de correo" pero
                  para Telegram.
                </p>
              </div>

              <div className={InstruccionesStyle.faqItem}>
                <h4>
                  <i className="fas fa-chevron-right me-2"></i>
                  ¿Por qué necesito /start?
                </h4>
                <p>
                  El comando /start inicia la conversación entre tú y el bot.
                  Sin esto, el bot no puede enviarte mensajes.
                </p>
              </div>

              <div className={InstruccionesStyle.faqItem}>
                <h4>
                  <i className="fas fa-chevron-right me-2"></i>
                  Recibo un error "chat not found"
                </h4>
                <p>
                  Significa que olvidaste hacer /start en Telegram. Ve a tu chat
                  con el bot y escribe /start nuevamente.
                </p>
              </div>

              <div className={InstruccionesStyle.faqItem}>
                <h4>
                  <i className="fas fa-chevron-right me-2"></i>
                  ¿Puedo usar el mismo Chat ID en varios bots?
                </h4>
                <p>
                  Sí. Tu Chat ID es personal y único. Si configuras el mismo
                  Chat ID en múltiples bots, recibirás mensajes de todos.
                </p>
              </div>

              <div className={InstruccionesStyle.faqItem}>
                <h4>
                  <i className="fas fa-chevron-right me-2"></i>
                  ¿Cuándo empezaré a recibir mensajes?
                </h4>
                <p>
                  Una vez que guardes tu Chat ID en la app, los próximos
                  mensajes que se envíen llegaran a tu Telegram automáticamente.
                </p>
              </div>

              <div className={InstruccionesStyle.faqItem}>
                <h4>
                  <i className="fas fa-chevron-right me-2"></i>
                  ¿Necesito estar conectado a WhatsApp?
                </h4>
                <p>
                  No. Telegram y WhatsApp son aplicaciones diferentes. Solo
                  necesitas tener Telegram descargar en tu teléfono.
                </p>
              </div>

              <div className={InstruccionesStyle.faqItem}>
                <h4>
                  <i className="fas fa-chevron-right me-2"></i>
                  ¿Qué pasa si pierdo mi Chat ID?
                </h4>
                <p>
                  No hay problema. Solo ejecuta /chatid nuevamente en el bot y
                  obtén un nuevo número.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={InstruccionesStyle.modalFooter}>
          <p className={InstruccionesStyle.footerText}>
            <i className="fas fa-shield-alt me-1"></i>
            Tu Chat ID es privado y solo lo usa el sistema para enviarte
            notificaciones.
          </p>
          <button
            className={`${InstruccionesStyle.btn} ${InstruccionesStyle.btnPrimary}`}
            onClick={onClose}
          >
            <i className="fas fa-check me-2"></i>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramInstructionsModal;
