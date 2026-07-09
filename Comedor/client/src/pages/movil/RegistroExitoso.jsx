import { useLocation, useNavigate } from "react-router-dom";
import MovilStyle from "../../styles/Movil.module.css";

const RegistroExitoso = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mensaje, registradas, servicio } = location.state || {};

  return (
    <div className={MovilStyle.containerMovil}>
      <div className={MovilStyle.errorMovil}>
        {" "}
        {/* Usamos la clase de contenedor de mensajes */}
        <div className={MovilStyle.iconSuccess} style={{ fontSize: "4rem" }}>
          ✅
        </div>
        <h2>{mensaje || "¡Operación Exitosa!"}</h2>
        <p>
          Se han actualizado <strong>{registradas}</strong> registros para el
          servicio de <strong>{servicio}</strong>.
        </p>
        <br />
        <button className={MovilStyle.btnGuardar} onClick={() => navigate("/")}>
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default RegistroExitoso;
