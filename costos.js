document.addEventListener("DOMContentLoaded", () => {
  if (!window.jsPDF) {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js";
    script.onload = function () {};
    document.head.appendChild(script);
  }

  const botonGuardarPdf = document.getElementById("botonGuardarPdf");

  botonGuardarPdf.addEventListener("click", () => {
    try {
      const { jsPDF } = window.jspdf;

      if (!jsPDF) {
        throw new Error("jsPDF no está disponible.");
      }

      const doc = new jsPDF();
      const nombreProyecto =
        document.getElementById("agregarProyecto").value.trim() ||
        "Proyecto sin nombre";

      doc.setFontSize(18);
      doc.text(nombreProyecto, 10, 20);

      const costoTotal = document.getElementById("costoTotal").textContent;
      doc.setFontSize(14);
      doc.text(costoTotal, 10, 30);

      doc.setFontSize(12);
      const requerimientos =
        JSON.parse(localStorage.getItem("requerimientos")) || [];
      requerimientos.forEach((req, index) => {
        doc.text(
          `${index + 1}. ${req.task} - Valor Hora: ${
            req.valorHora
          }, Dificultad: ${req.complexity}`,
          10,
          40 + index * 10
        );
      });

      const canvas = document.getElementById("resultadoChartCanvas");
      const chartImage = canvas.toDataURL("image/png", 1.0);
      doc.addImage(
        chartImage,
        "PNG",
        10,
        60 + requerimientos.length * 10,
        180,
        80
      );

      doc.save(`${nombreProyecto}_Presupuesto.pdf`);
      toastr.success("PDF guardado exitosamente.");
      clearAllData();
    } catch (error) {
      toastr.error("Error al guardar el PDF. Intenta de nuevo.");
    }
  });

  const requerimientosUl = document.getElementById("requerimientosLista");
  const taskListDiv = document.getElementById("taskListDiv");
  const costoTotalElement = document.getElementById("costoTotal");
  const botonPresupuestarNuevo = document.getElementById(
    "botonPresupuestarNuevo"
  );
  let selectedTask = null;
  let selectedDifficulty = null;
  let chartInstance = null;

  function clearAllData() {
    try {
      localStorage.removeItem("requerimientos");
      localStorage.removeItem("proyecto");

      document.getElementById("agregarProyecto").value = "";
      requerimientosUl.innerHTML = "";
      taskListDiv.innerHTML = "";
      costoTotalElement.textContent = "Costo total estimado: $0.00 USD";

      selectedTask = null;
      selectedDifficulty = null;

      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }

      renderTaskList();
      toastr.success("Datos limpiados exitosamente.");
    } catch (error) {
      toastr.error("Error al limpiar los datos.");
    }
  }

  function renderTaskList() {
    try {
      fetch("data/costos.json")
        .then((response) => response.json())
        .then((data) => {
          const taskList = data;
          taskListDiv.innerHTML = "";

          taskList.forEach((task) => {
            const taskDiv = document.createElement("div");
            taskDiv.textContent = task.task;
            taskDiv.className = "taskItem";
            taskDiv.dataset.taskId = task.id;
            taskDiv.onclick = () => {
              selectedTask = task;
              renderTaskDetails(task);
            };
            taskListDiv.appendChild(taskDiv);
          });
        })
        .catch(() => {
          toastr.error("Error al cargar la lista de tareas.");
        });
    } catch {
      toastr.error("Ocurrió un error inesperado.");
    }
  }

  function renderTaskDetails(task) {
    try {
      taskListDiv.innerHTML = "";

      if (task) {
        const title = document.createElement("h3");
        title.textContent = `Tarea: ${task.task}`;
        taskListDiv.appendChild(title);

        const ul = document.createElement("ul");
        Object.keys(task.complexity).forEach((level) => {
          const li = document.createElement("li");
          li.textContent = `${
            level.charAt(0).toUpperCase() + level.slice(1)
          }: ${task.complexity[level]}`;
          li.className = "difficultyItem";
          li.dataset.difficulty = level;
          li.onclick = () => {
            selectedDifficulty = level;
            document.querySelectorAll(".difficultyItem").forEach((item) => {
              item.style.backgroundColor = "";
            });
            li.style.backgroundColor = "#d3d3d3";
          };
          ul.appendChild(li);
        });
        taskListDiv.appendChild(ul);
      }
    } catch {
      toastr.error("Error al mostrar los detalles de la tarea.");
    }
  }

  function updateRequerimientosList() {
    try {
      requerimientosUl.innerHTML = "";

      const requerimientos =
        JSON.parse(localStorage.getItem("requerimientos")) || [];
      requerimientos.forEach((req) => {
        const li = document.createElement("li");
        li.textContent = `${req.task} - Valor Hora: ${req.valorHora}, Dificultad: ${req.complexity}`;
        const removeButton = document.createElement("button");
        removeButton.textContent = "X";
        removeButton.className = "removeTask";
        removeButton.onclick = () => {
          try {
            const index = requerimientos.indexOf(req);
            if (index > -1) {
              requerimientos.splice(index, 1);
              localStorage.setItem(
                "requerimientos",
                JSON.stringify(requerimientos)
              );
              updateRequerimientosList();
              toastr.success("Tarea eliminada.");
            }
          } catch {
            toastr.error("Error al eliminar la tarea.");
          }
        };
        li.appendChild(removeButton);
        requerimientosUl.appendChild(li);
      });
    } catch {
      toastr.error("Error al actualizar la lista de requerimientos.");
    }
  }

  function isTaskDuplicate(requerimientos, newTask) {
    return requerimientos.some(
      (req) =>
        req.task === newTask.task && req.complexity === newTask.complexity
    );
  }

  function renderChart() {
    try {
      const requerimientos =
        JSON.parse(localStorage.getItem("requerimientos")) || [];
      if (chartInstance) {
        chartInstance.destroy();
      }

      let totalCost = 0;
      let totalWeeks = 0;
      const labels = [];
      const ganttData = [];

      requerimientos.forEach((req) => {
        const cost = req.semanas * 20 * 6 * req.valorHora;
        const weeks = req.semanas;
        totalCost += cost;
        totalWeeks += weeks;
        labels.push(req.task);
        ganttData.push({
          label: req.task,
          data: [weeks],
          backgroundColor: `rgba(${75 + ganttData.length * 20}, 192, 192, 0.2)`,
          borderColor: `rgba(${75 + ganttData.length * 20}, 192, 192, 1)`,
          borderWidth: 1,
        });
      });

      costoTotalElement.textContent = `Proyecto: ${
        document.getElementById("agregarProyecto").value.trim() ||
        localStorage.getItem("proyecto") ||
        "No definido"
      } - Costo total estimado: $${totalCost.toFixed(
        2
      )} USD - Tiempo estimado: ${totalWeeks} semanas`;

      const ctx = document
        .getElementById("resultadoChartCanvas")
        .getContext("2d");
      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: ganttData,
        },
        options: {
          indexAxis: "y",
          responsive: true,
          scales: {
            x: {
              beginAtZero: true,
              stacked: true,
              title: {
                display: true,
                text: "Semanas",
              },
            },
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    } catch {
      toastr.error("Error al renderizar el gráfico.");
    }
  }

  document
    .getElementById("botonAgregarRequerimiento")
    .addEventListener("click", () => {
      try {
        const requerimientos =
          JSON.parse(localStorage.getItem("requerimientos")) || [];
        if (selectedTask && selectedDifficulty) {
          const newTask = {
            ...selectedTask,
            complexity: selectedTask.complexity[selectedDifficulty],
            semanas: selectedTask.semanas || 1,
          };

          if (isTaskDuplicate(requerimientos, newTask)) {
            toastr.error("Esta tarea ya está en la lista de requerimientos.");
          } else {
            requerimientos.push(newTask);
            localStorage.setItem(
              "requerimientos",
              JSON.stringify(requerimientos)
            );
            updateRequerimientosList();
            selectedTask = null;
            selectedDifficulty = null;
            renderTaskList();
            renderChart();
            toastr.success("Requerimiento agregado exitosamente.");
          }
        } else {
          toastr.error(
            "Selecciona una tarea y una dificultad antes de agregar."
          );
        }
      } catch {
        toastr.error("Error al agregar el requerimiento.");
      }
    });

  document
    .getElementById("botonFinalizarLista")
    .addEventListener("click", () => {
      try {
        const requerimientos =
          JSON.parse(localStorage.getItem("requerimientos")) || [];
        if (requerimientos.length > 0) {
          const proyectoInput = document
            .getElementById("agregarProyecto")
            .value.trim();
          if (proyectoInput) {
            localStorage.setItem("proyecto", proyectoInput);
          }

          renderChart();
          toastr.success("Lista finalizada con éxito.");
        } else {
          toastr.error("No hay requerimientos para finalizar.");
        }
      } catch {
        toastr.error("Error al finalizar la lista.");
      }
    });

  botonPresupuestarNuevo.addEventListener("click", () => {
    try {
      clearAllData();
      toastr.success(
        "Datos reiniciados. Puedes comenzar a presupuestar un nuevo proyecto."
      );
    } catch {
      toastr.error("Error al reiniciar los datos.");
    }
  });

  updateRequerimientosList();
  renderChart();
});
