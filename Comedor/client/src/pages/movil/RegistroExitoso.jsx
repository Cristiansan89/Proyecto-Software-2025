import { useLocation, useNavigate } from "react-router-dom";
import "./RegistroAsistenciasMovil.css"; // Reutilizamos estilos

const RegistroExitoso = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mensaje, registradas, servicio } = location.state || {};

  return (
    <div className="movil-container">
      <div className="error-movil">
        {" "}
        {/* Usamos la clase de contenedor de mensajes */}
        <div className="success-icon" style={{ fontSize: "4rem" }}>
          ✅
        </div>
        <h2>{mensaje || "¡Operación Exitosa!"}</h2>
        <p>
          Se han actualizado <strong>{registradas}</strong> registros para el
          servicio de <strong>{servicio}</strong>.
        </p>
        <br />
        <button className="btn-guardar" onClick={() => navigate("/")}>
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default RegistroExitoso;
