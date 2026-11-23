const STORAGE = {
    habits: "ecoluz_habitos",
    date: "ecoluz_fecha",
    bill: "ecoluz_recibo",
    history: "ecoluz_historial",
    reminder: "ecoluz_recordatorio"
};

// NAVEGACIÓN ENTRE PESTAÑAS
document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(b =>
            b.classList.remove("active")
        );

        document.querySelectorAll(".page").forEach(p =>
            p.classList.remove("active")
        );

        button.classList.add("active");
        document.getElementById(button.dataset.tab)
            .classList.add("active");
    });
});

// HÁBITOS DIARIOS
const actividades = [
    "Apagar las luces que no utilizo",
    "Desconectar cargadores sin uso",
    "Aprovechar la luz natural",
    "Apagar el televisor cuando nadie lo ve",
    "Evitar dejar aparatos encendidos",
    "Usar la lavadora con carga adecuada"
];

function fechaHoy() {
    const d = new Date();
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function obtenerHabitos() {
    const fecha = fechaHoy();
    let datos = JSON.parse(localStorage.getItem(STORAGE.habits) || "{}");

    if (localStorage.getItem(STORAGE.date) !== fecha) {
        datos = {};
        localStorage.setItem(STORAGE.habits, JSON.stringify(datos));
        localStorage.setItem(STORAGE.date, fecha);
    }

    return datos;
}

let habitos = obtenerHabitos();

function mostrarHabitos() {
    const lista = document.getElementById("listaHabitos");
    lista.innerHTML = "";

    actividades.forEach((actividad, i) => {
        const div = document.createElement("div");
        div.className = "habit" + (habitos[i] ? " done" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!habitos[i];
        checkbox.id = "habito" + i;

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = actividad;

        checkbox.addEventListener("change", () => {
            habitos[i] = checkbox.checked;
            localStorage.setItem(STORAGE.habits, JSON.stringify(habitos));
            mostrarHabitos();
        });

        div.append(checkbox, label);
        lista.appendChild(div);
    });

    const total = Object.values(habitos).filter(Boolean).length;

    document.getElementById("progresoHabitos").textContent =
        `${total} de ${actividades.length} hábitos completados.`;

    document.getElementById("progresoInicio").textContent =
        `${total} hábitos completados hoy.`;
}

mostrarHabitos();

// RECIBOS Y CÁLCULO DE AHORRO
let recibo = JSON.parse(localStorage.getItem(STORAGE.bill) || "null");
let historial = JSON.parse(localStorage.getItem(STORAGE.history) || "[]");

function mostrarRecibo() {
    if (!recibo) return;

    document.getElementById("inicioRecibo").textContent =
        `S/ ${recibo.monto.toFixed(2)}`;

    document.getElementById("inicioMeta").textContent =
        `S/ ${recibo.meta.toFixed(2)}`;

    document.getElementById("inicioAhorro").textContent =
        `S/ ${recibo.ahorro.toFixed(2)}`;

    document.getElementById("resultadoRecibo").innerHTML = `
        <h3>Tu objetivo de ahorro</h3>
        <p>Recibo anterior: S/ ${recibo.monto.toFixed(2)}</p>
        <p>Ahorro esperado: S/ ${recibo.ahorro.toFixed(2)}</p>
        <p>Nuevo recibo objetivo: S/ ${recibo.meta.toFixed(2)}</p>
        <p>Porcentaje de ahorro: ${recibo.porcentaje}%</p>
    `;
}

function mostrarHistorial() {
    const contenedor = document.getElementById("historial");
    contenedor.innerHTML = "";

    historial.forEach(item => {
        const p = document.createElement("p");
        p.textContent = `${item.fecha}: S/ ${item.monto.toFixed(2)} → Meta S/ ${item.meta.toFixed(2)}`;
        contenedor.appendChild(p);
    });
}

document.getElementById("guardarRecibo").addEventListener("click", () => {
    const monto = Number(document.getElementById("montoRecibo").value);
    const porcentaje = Number(document.getElementById("porcentaje").value);

    if (!Number.isFinite(monto) || monto <= 0) {
        alert("Ingresa un importe válido.");
        return;
    }

    const ahorro = monto * porcentaje / 100;
    const meta = monto - ahorro;

    recibo = {
        monto,
        porcentaje,
        ahorro,
        meta
    };

    historial.unshift({
        ...recibo,
        fecha: new Date().toLocaleDateString("es-PE")
    });

    localStorage.setItem(STORAGE.bill, JSON.stringify(recibo));
    localStorage.setItem(STORAGE.history, JSON.stringify(historial));

    mostrarRecibo();
    mostrarHistorial();

    alert("¡Tu meta de ahorro se ha guardado!");
});

mostrarRecibo();
mostrarHistorial();

// RECORDATORIOS
let recordatorio = JSON.parse(
    localStorage.getItem(STORAGE.reminder) || "null"
);

if (recordatorio) {
    document.getElementById("horaAviso").value = recordatorio.hora;
    document.getElementById("estadoAviso").textContent =
        "Recordatorio configurado para las " + recordatorio.hora;
}

document.getElementById("guardarAviso").addEventListener("click", async () => {
    const hora = document.getElementById("horaAviso").value;

    if (!hora) {
        alert("Selecciona una hora.");
        return;
    }

    if (!("Notification" in window)) {
        alert("Tu navegador no admite notificaciones.");
        return;
    }

    const permiso = await Notification.requestPermission();

    if (permiso !== "granted") {
        alert("Debes permitir las notificaciones en tu navegador.");
        return;
    }

    recordatorio = { hora };

    localStorage.setItem(STORAGE.reminder, JSON.stringify(recordatorio));

    document.getElementById("estadoAviso").textContent =
        "¡Recordatorio activado para las " + hora + "!";

    programarAviso();
});

let ultimoAviso = "";

function programarAviso() {
    if (!recordatorio || Notification.permission !== "granted") return;

    const ahora = new Date();
    const [h, m] = recordatorio.hora.split(":").map(Number);

    const clave = `${fechaHoy()}-${recordatorio.hora}`;

    if (ahora.getHours() === h && ahora.getMinutes() === m
        && ultimoAviso !== clave) {

        new Notification("ECOLUZ ⚡", {
            body: "¡Es hora de revisar tus hábitos de ahorro energético!"
        });

        ultimoAviso = clave;
    }
}

programarAviso();
setInterval(programarAviso, 15000);
