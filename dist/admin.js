"use strict";
const ADMIN_PRIORITIES = ["Normal", "Lansia", "Disabilitas", "VIP"];
function element(id) {
    return document.getElementById(id);
}
function showAdminMessage(message, type = "success") {
    const target = element("adminMessage");
    if (!target)
        return;
    target.textContent = message;
    target.className = `message ${type}`;
}
function showTicketMessage(message, type = "success") {
    const target = element("ticketMessage");
    if (!target)
        return;
    target.textContent = message;
    target.className = `message ${type}`;
}
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return map[character];
    });
}
function renderDashboard() {
    const types = getQueueTypes();
    const tickets = getQueueTickets();
    const totalServices = element("totalServices");
    const activeServices = element("activeServices");
    const waitingTickets = element("waitingTickets");
    if (totalServices)
        totalServices.textContent = String(types.length);
    if (activeServices)
        activeServices.textContent = String(types.filter(item => item.active).length);
    if (waitingTickets)
        waitingTickets.textContent = String(tickets.filter(ticket => ticket.status === "Menunggu").length);
    renderServiceTable();
    renderManualServiceOptions();
}
function renderServiceTable() {
    const body = element("serviceTableBody");
    const empty = element("emptyServices");
    if (!body)
        return;
    const types = getQueueTypes();
    body.replaceChildren();
    if (empty)
        empty.classList.toggle("hidden", types.length > 0);
    for (const service of types) {
        const row = document.createElement("tr");
        const codeCell = document.createElement("td");
        codeCell.innerHTML = `<span class="code-badge">${escapeHtml(service.code)}</span>`;
        const nameCell = document.createElement("td");
        nameCell.textContent = service.name;
        const statusCell = document.createElement("td");
        statusCell.innerHTML = service.active
            ? '<span class="status status-active">Aktif</span>'
            : '<span class="status status-inactive">Nonaktif</span>';
        const actionCell = document.createElement("td");
        actionCell.className = "action-cell";
        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = "button button-small button-outline";
        toggleButton.textContent = service.active ? "Nonaktifkan" : "Aktifkan";
        toggleButton.addEventListener("click", () => toggleService(service.code));
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "button button-small button-danger";
        deleteButton.textContent = "Hapus";
        deleteButton.addEventListener("click", () => deleteService(service.code));
        actionCell.append(toggleButton, deleteButton);
        row.append(codeCell, nameCell, statusCell, actionCell);
        body.append(row);
    }
}
function renderManualServiceOptions() {
    const select = element("manualService");
    if (!select)
        return;
    const previousValue = select.value;
    select.replaceChildren(new Option("Pilih layanan aktif", ""));
    for (const service of getQueueTypes().filter(item => item.active)) {
        select.add(new Option(`${service.code} — ${service.name}`, service.code));
    }
    if (Array.from(select.options).some(option => option.value === previousValue)) {
        select.value = previousValue;
    }
}
function addService(event) {
    event.preventDefault();
    const codeInput = element("serviceCode");
    const nameInput = element("serviceName");
    if (!codeInput || !nameInput)
        return;
    const code = codeInput.value.trim().toUpperCase();
    const name = nameInput.value.trim();
    if (!/^[A-Z]$/.test(code)) {
        showAdminMessage("Kode layanan harus tepat satu huruf A–Z.", "error");
        codeInput.focus();
        return;
    }
    if (!name) {
        showAdminMessage("Nama layanan wajib diisi.", "error");
        nameInput.focus();
        return;
    }
    const types = getQueueTypes();
    const duplicateCode = types.some(item => item.code.toLowerCase() === code.toLowerCase());
    const duplicateName = types.some(item => item.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicateCode) {
        showAdminMessage(`Kode "${code}" sudah digunakan.`, "error");
        return;
    }
    if (duplicateName) {
        showAdminMessage(`Nama layanan "${name}" sudah digunakan.`, "error");
        return;
    }
    types.push({ code, name, active: true });
    saveQueueTypes(types);
    codeInput.value = "";
    nameInput.value = "";
    showAdminMessage(`Layanan ${code} — ${name} berhasil ditambahkan.`);
    renderDashboard();
}
function toggleService(code) {
    const types = getQueueTypes();
    const service = types.find(item => item.code === code);
    if (!service)
        return;
    service.active = !service.active;
    saveQueueTypes(types);
    showAdminMessage(`${service.name} sekarang ${service.active ? "aktif" : "nonaktif"}.`);
    renderDashboard();
}
function deleteService(code) {
    const types = getQueueTypes();
    const service = types.find(item => item.code === code);
    if (!service)
        return;
    const confirmed = window.confirm(`Hapus jenis layanan "${service.name}" (${service.code})? Tiket lama tidak otomatis dihapus.`);
    if (!confirmed)
        return;
    saveQueueTypes(types.filter(item => item.code !== code));
    showAdminMessage(`Layanan ${service.code} berhasil dihapus.`);
    renderDashboard();
}
function issueManualTicket(event) {
    event.preventDefault();
    const serviceSelect = element("manualService");
    const prioritySelect = element("manualPriority");
    if (!serviceSelect || !prioritySelect)
        return;
    const code = serviceSelect.value;
    const priority = prioritySelect.value;
    if (!code) {
        showTicketMessage("Pilih jenis layanan yang aktif.", "error");
        return;
    }
    if (!ADMIN_PRIORITIES.includes(priority)) {
        showTicketMessage("Prioritas tiket tidak valid.", "error");
        return;
    }
    try {
        const ticket = createQueueTicket(code, priority);
        const result = element("ticketResult");
        const number = element("createdTicketNumber");
        const details = element("createdTicketDetails");
        const service = getQueueTypes().find(item => item.code === code);
        if (number)
            number.textContent = ticket.number;
        if (details)
            details.textContent = `${service?.name ?? code} · Prioritas ${ticket.priority}`;
        if (result)
            result.classList.remove("hidden");
        showTicketMessage("Tiket berhasil diterbitkan dan masuk ke antrian.");
        renderDashboard();
    }
    catch (error) {
        showTicketMessage(error instanceof Error ? error.message : "Tiket gagal dibuat.", "error");
    }
}
function resetAllQueues() {
    const confirmed = window.confirm("Yakin ingin menghapus SEMUA tiket dan mengembalikan nomor ke awal? Tindakan ini tidak dapat dibatalkan.");
    if (!confirmed)
        return;
    saveQueueTickets([]);
    saveQueueCounters({});
    const result = element("ticketResult");
    if (result)
        result.classList.add("hidden");
    showTicketMessage("Seluruh tiket telah dihapus dan penghitung nomor direset.");
    renderDashboard();
}
document.addEventListener("DOMContentLoaded", () => {
    // Role guard dijalankan sebelum fitur dashboard dipasang.
    const session = requireRole(["admin", "moderator"]);
    if (!session)
        return;
    const userName = element("activeUser");
    const userRole = element("activeRole");
    const userInitial = element("userInitial");
    const todayLabel = element("todayLabel");
    if (userName)
        userName.textContent = session.firstName;
    if (userRole)
        userRole.textContent = session.role;
    if (userInitial)
        userInitial.textContent = session.firstName.charAt(0).toUpperCase();
    if (todayLabel) {
        todayLabel.textContent = new Intl.DateTimeFormat("id-ID", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        }).format(new Date());
    }
    element("serviceForm")?.addEventListener("submit", addService);
    element("manualTicketForm")?.addEventListener("submit", issueManualTicket);
    element("resetQueueButton")?.addEventListener("click", resetAllQueues);
    // Perbarui dashboard ketika tab lain pada origin yang sama mengubah data.
    window.addEventListener("storage", event => {
        if (event.key === STORAGE_KEYS.queueTypes ||
            event.key === STORAGE_KEYS.tickets ||
            event.key === STORAGE_KEYS.counters)
            renderDashboard();
    });
    // Polling juga memperbarui tampilan bila ada perubahan data di halaman lain.
    window.setInterval(renderDashboard, 2500);
    renderDashboard();
});
