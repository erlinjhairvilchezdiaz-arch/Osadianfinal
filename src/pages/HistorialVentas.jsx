import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import { colors, fonts, FONT_IMPORT } from "../styles/theme";

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [ventaEditar, setVentaEditar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");

  useEffect(() => {
    cargarVentas();
  }, []);

  async function cargarVentas() {
    setLoading(true);

    const { data, error } = await supabase
      .from("ventas")
      .select("id, fecha, total, metodo_pago, anulada")
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error cargando ventas:", error);
    } else {
      setVentas(data || []);
    }

    setLoading(false);
  }

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatearHora(fecha) {
    return new Date(fecha).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function prepararEdicion(venta) {
    const fecha = new Date(venta.fecha);

    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");

    setVentaEditar(venta);
    setNuevaFecha(`${año}-${mes}-${dia}T${horas}:${minutos}`);
  }

  async function guardarFecha() {
    if (!ventaEditar || !nuevaFecha) return;

    setProcesando(true);

    const fechaISO = new Date(nuevaFecha).toISOString();

    const { error } = await supabase
      .from("ventas")
      .update({ fecha: fechaISO })
      .eq("id", ventaEditar.id);

    if (error) {
      console.error("Error actualizando fecha:", error);
      alert("No se pudo actualizar la fecha.");
    } else {
      setVentaEditar(null);
      setNuevaFecha("");
      await cargarVentas();
    }

    setProcesando(false);
  }

  async function eliminarVenta(venta) {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar la Venta #${venta.id}?\n\n` +
      `Total: S/ ${Number(venta.total).toFixed(2)}\n\n` +
      `El stock será devuelto automáticamente y el movimiento de caja será eliminado.`
    );

    if (!confirmar) return;

    setProcesando(true);

    const { error } = await supabase.rpc("eliminar_venta", {
      p_venta_id: venta.id,
    });

    if (error) {
      console.error("Error eliminando venta:", error);
      alert("No se pudo eliminar la venta.");
    } else {
      await cargarVentas();
    }

    setProcesando(false);
  }

  return (
    <div
      style={{
        fontFamily: fonts.body,
        background: colors.bg,
        minHeight: "100vh",
        display: "flex",
        color: colors.text,
      }}
    >
      <style>{FONT_IMPORT}</style>

      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "32px 40px",
          maxWidth: 1100,
        }}
      >
        {/* ENCABEZADO */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                fontWeight: 600,
                margin: 0,
                color: colors.plum,
              }}
            >
              Historial de ventas
            </p>

            <p
              style={{
                fontSize: 13.5,
                color: colors.textSoft,
                margin: "4px 0 0",
              }}
            >
              Consulta y administra todas las ventas registradas
            </p>
          </div>

          <button
            onClick={cargarVentas}
            style={{
              fontSize: 12.5,
              color: colors.sageText,
              background: colors.sageBg,
              padding: "7px 14px",
              borderRadius: 20,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            <i
              className="ti ti-refresh"
              style={{
                fontSize: 13,
                marginRight: 5,
              }}
            />

            Actualizar
          </button>
        </div>

        {/* TABLA */}
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${colors.borderLight}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontFamily: fonts.display,
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                color: colors.plum,
              }}
            >
              Ventas registradas
            </p>

            <span
              style={{
                fontSize: 12,
                color: colors.textSoft,
              }}
            >
              {ventas.length} ventas
            </span>
          </div>

          {loading && (
            <p
              style={{
                padding: "20px",
                fontSize: 13.5,
                color: colors.textFaint,
              }}
            >
              Cargando ventas...
            </p>
          )}

          {!loading && ventas.length === 0 && (
            <p
              style={{
                padding: "20px",
                fontSize: 13.5,
                color: colors.textFaint,
              }}
            >
              No hay ventas registradas.
            </p>
          )}

          {!loading &&
            ventas.map((venta, i) => (
              <div
                key={venta.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px 20px",
                  borderTop:
                    i === 0
                      ? "none"
                      : `1px solid ${colors.borderLight}`,
                }}
              >
                {/* INFORMACIÓN DE VENTA */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        margin: 0,
                        color: colors.plum,
                      }}
                    >
                      Venta #{venta.id}
                    </p>

                    <p
                      style={{
                        fontSize: 11.5,
                        color: colors.textFaint,
                        margin: "4px 0 0",
                      }}
                    >
                      {formatearFecha(venta.fecha)} ·{" "}
                      {formatearHora(venta.fecha)}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: 11.5,
                      color: colors.sageText,
                      background: colors.sageBg,
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontWeight: 500,
                    }}
                  >
                    {venta.metodo_pago}
                  </span>
                </div>

                {/* TOTAL Y ACCIONES */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    S/ {Number(venta.total).toFixed(2)}
                  </span>

                  <button
                    onClick={() => prepararEdicion(venta)}
                    disabled={procesando}
                    title="Modificar fecha"
                    style={{
                      border: "none",
                      background: colors.amberBg,
                      color: colors.amber,
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <i className="ti ti-calendar-edit" />
                  </button>

                  <button
                    onClick={() => eliminarVenta(venta)}
                    disabled={procesando}
                    title="Eliminar venta"
                    style={{
                      border: "none",
                      background: colors.redBg,
                      color: colors.red,
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </main>

      {/* MODAL EDITAR FECHA */}
      {ventaEditar && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36, 24, 31, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 380,
              background: colors.card,
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            }}
          >
            <p
              style={{
                fontFamily: fonts.display,
                fontSize: 20,
                fontWeight: 600,
                color: colors.plum,
                margin: "0 0 6px",
              }}
            >
              Modificar fecha
            </p>

            <p
              style={{
                fontSize: 13,
                color: colors.textSoft,
                margin: "0 0 20px",
              }}
            >
              Venta #{ventaEditar.id}
            </p>

            <label
              style={{
                fontSize: 11.5,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: colors.textSoft,
                fontWeight: 600,
              }}
            >
              Nueva fecha y hora
            </label>

            <input
              type="datetime-local"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                marginTop: 7,
                marginBottom: 22,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                fontSize: 13.5,
                fontFamily: fonts.body,
                outline: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              <button
                onClick={() => {
                  setVentaEditar(null);
                  setNuevaFecha("");
                }}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.textMuted,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Cancelar
              </button>

              <button
                onClick={guardarFecha}
                disabled={procesando}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 8,
                  border: "none",
                  background: colors.plum,
                  color: colors.bg,
                  cursor: "pointer",
                  fontWeight: 600,
                  opacity: procesando ? 0.7 : 1,
                }}
              >
                {procesando ? "Guardando..." : "Guardar fecha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}