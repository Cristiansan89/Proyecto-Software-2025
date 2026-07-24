import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecetaForm from "../../../components/cocinera/RecetaForm";

vi.mock("react-select", () => ({
  default: ({ options, value, onChange, placeholder }) => (
    <select
      data-testid="insumo-select"
      value={value?.value ?? ""}
      onChange={(event) => {
        const selectedOption = options.find(
          (option) => option.value === Number(event.target.value),
        );
        onChange(selectedOption || null);
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../services/serviciosRecetasService", () => ({
  default: {
    getServiciosPorReceta: vi.fn(),
    actualizarServiciosReceta: vi.fn(),
  },
}));

vi.mock("../../utils/alertService", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
  showInfoError: vi.fn(),
  showToast: vi.fn(),
  showConfirm: vi.fn(),
}));

describe("RecetaForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filtra las unidades de medida según la unidad base del insumo seleccionado", () => {
    const insumos = [
      { idInsumo: 1, nombreInsumo: "Harina", unidadMedida: "Kilogramos" },
      { idInsumo: 2, nombreInsumo: "Leche", unidadMedida: "Litros" },
      { idInsumo: 3, nombreInsumo: "Huevos", unidadMedida: "Unidades" },
    ];

    render(
      <RecetaForm
        receta={null}
        mode="create"
        insumos={insumos}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId("insumo-select"), {
      target: { value: "1" },
    });

    const unidadSelect = screen.getByLabelText("Unidad");
    const opciones = Array.from(unidadSelect.options).map(
      (option) => option.value,
    );

    expect(opciones).toEqual(["", "Gramos", "Kilogramos"]);
  });
});
