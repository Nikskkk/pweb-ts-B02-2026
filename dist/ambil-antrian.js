"use strict";
function publicElement(id) {
    return document.getElementById(id);
}
function renderPublicServices() {
    const select = publicElement("serviceSelect");
    if (!select)
        return;
    select.replaceChildren(new Option("Pilih layanan aktif", ""));
    getQueueTypes()
        .filter(service => service.active)
        .forEach(service => {
        select.add(new Option(`${service.code} — ${service.name}`, service.code));
    });
}
function renderPublicTickets() {
    const body = publicElement("publicTicketRows");
    if (!body)
        return;
    body.replaceChildren();
    const tickets = getQueueTickets()
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt);
    if (tickets.length === 0) {
        const row = body.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = "Belum ada antrean.";
        return;
    }
    tickets.forEach(ticket => {
        const row = body.insertRow();
        const service = getQueueTypes().find(item => item.code === ticket.queueCode);
        [
            ticket.number,
            service?.name ?? ticket.queueCode,
            ticket.priority,
            ticket.status
        ].forEach(value => {
            row.insertCell().textContent = value;
        });
    });
}
document.addEventListener("DOMContentLoaded", () => {
    if (!requireLogin())
        return;
    const form = publicElement("ticketForm");
    const select = publicElement("serviceSelect");
    const priority = publicElement("prioritySelect");
    const message = publicElement("ticketMessage");
    const result = publicElement("ticketResult");
    const submitButton = form?.querySelector("button[type='submit']");
    const sessionName = publicElement("sessionName");
    const session = getSession();
    if (sessionName && session) {
        sessionName.textContent = `${session.firstName} (${session.role})`;
    }
    publicElement("logoutButton")?.addEventListener("click", logout);
    renderPublicServices();
    renderPublicTickets();
    if (submitButton) {
        submitButton.disabled = !select?.options.length || select.options.length <= 1;
    }
    form?.addEventListener("submit", event => {
        event.preventDefault();
        if (!select?.value || !priority || !message || !result)
            return;
        try {
            const ticket = createQueueTicket(select.value, priority.value);
            result.textContent =
                `Nomor antrean: ${ticket.number} | Prioritas: ${ticket.priority}`;
            message.textContent = "Nomor antrean berhasil dibuat.";
            message.style.color = "#15803d";
            renderPublicServices();
            renderPublicTickets();
            if (submitButton) {
                submitButton.disabled = !select?.value && select?.options.length === 1;
            }
        }
        catch (error) {
            message.textContent = error instanceof Error
                ? error.message
                : "Gagal membuat antrean.";
            message.style.color = "#b91c1c";
        }
    });
    window.addEventListener("storage", () => {
        renderPublicServices();
        renderPublicTickets();
    });
    window.setInterval(() => {
        renderPublicServices();
        renderPublicTickets();
        if (submitButton) {
            submitButton.disabled = !select?.value && select?.options.length === 1;
        }
    }, 2500);
});
