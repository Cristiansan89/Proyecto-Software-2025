import { useState } from "react";
import PedidoInsumo from "./PedidoInsumo";
import PedidoConfirmado from "./PedidoConfirmado";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";

const Pedidos = () => {
  const [activeTab, setActiveTab] = useState("pedido-insumo");
  const [mostrarPestanas, setMostrarPestanas] = useState(true);

  const tabs = [
    {
      id: "pedido-insumo",
      label: "Pedido de Insumos",
      icon: "fas fa-boxes",
      component: <PedidoInsumo onModoEdicion={setMostrarPestanas} />,
    },
    {
      id: "pedido-confirmado",
      label: "Pedidos Confirmados",
      icon: "fas fa-check-circle",
      component: <PedidoConfirmado />,
    },
  ];

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-clipboard-list"></i>
            Gestión de Pedidos
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administra los pedidos de insumos y confirma recepciones
          </p>
        </div>
      </div>
      {/* Pestañas de navegación */}

      <div className={ContenidoStyle.navigationTabs}>
        <div className={ContenidoStyle.tabsHeader}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${ContenidoStyle.tabsButton} ${tab.id === activeTab ? ContenidoStyle.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del tab activo - siempre renderizado */}
      <div className={ContenidoStyle.tabContent}>
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default Pedidos;
