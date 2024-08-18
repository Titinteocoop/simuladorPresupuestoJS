document.addEventListener("DOMContentLoaded", function () {
  const botonPresupuestarNuevo = document.getElementById(
    "botonPresupuestarNuevo"
  );
  const botonGuardarPdf = document.getElementById("botonGuardarPdf");
  const botonFinalizarLista = document.getElementById("botonFinalizarLista");

  // Muestra todas las secciones excepto la de inicio al hacer clic en "Presupuestar Nuevo"
  botonPresupuestarNuevo.addEventListener("click", function () {
    const secciones = document.querySelectorAll("section");

    secciones.forEach((seccion) => {
      if (seccion.id !== "inicio") {
        seccion.style.display = "flex";
      }
    });

    // Ocultar la sección de inicio si es necesario
    document.getElementById("inicio").style.display = "none";
  });

  // Oculta todas las secciones y muestra la de inicio al hacer clic en "Guardar PDF"
  botonGuardarPdf.addEventListener("click", function () {
    const secciones = document.querySelectorAll("section");

    secciones.forEach((seccion) => {
      if (seccion.id !== "inicio") {
        seccion.style.display = "none";
      }
    });

    // Mostrar la sección de inicio si es necesario
    document.getElementById("inicio").style.display = "flex";
  });

  // Oculta la sección "tareas" y muestra las secciones "resultadoCosto" y "resultadoChart" al hacer clic en "Finalizar Lista"
  botonFinalizarLista.addEventListener("click", function () {
    const tareas = document.getElementById("tareas");
    const resultadoCosto = document.getElementById("resultadoCosto");
    const resultadoChart = document.getElementById("resultadoChart");

    if (tareas) {
      tareas.style.display = "none";
    }

    if (resultadoCosto) {
      resultadoCosto.style.display = "flex";
    }

    if (resultadoChart) {
      resultadoChart.style.display = "flex";
    }

    // Opcionalmente ocultar la sección de inicio si es necesario
    document.getElementById("inicio").style.display = "none";
  });
});
