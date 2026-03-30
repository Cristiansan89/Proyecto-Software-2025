// Formatea una cantidad según la unidad:
// - Kilogramo(s), litro(s) y unidades → sin decimales (visualmente enteros)
// - Gramo(s), mililitro(s) → mostrar decimales (2 decimales)
export default function formatCantidad(cantidad, unidad) {
  const val = Number(cantidad);
  if (Number.isNaN(val)) return "0";

  const u = (unidad || "").toString().toLowerCase();
  const tokens = u.split(/[^a-z0-9]+/).filter(Boolean);

  const isKg = tokens.some((t) => t === "kg" || t.startsWith("kilogram"));
  const isL = tokens.some(
    (t) => t === "l" || t === "lt" || t === "ltr" || t.startsWith("litro")
  );
  const isUnit = tokens.some((t) => t === "unidad" || t === "un" || t === "un." || t === "unidades");
  const isGram = tokens.some((t) => t === "g" || t === "gr" || t.startsWith("gram"));
  const isMl = tokens.some((t) => t === "ml" || t.startsWith("mililit"));

  const LOCALE = 'es-AR';

  // Kilogramo(s), litro(s) o unidades → sin decimales
  if (isKg || isL || isUnit) {
    return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(val);
  }

  // Gramo(s) o mililitro(s) → mostrar 2 decimales
  if (isGram || isMl) {
    return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  }

  // Por defecto: mostrar hasta 2 decimales cuando existan
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(val);
}
