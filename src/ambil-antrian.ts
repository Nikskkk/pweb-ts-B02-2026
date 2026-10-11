function publicElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function renderPublicServices(): void {
  const select = publicElement<HTMLSelectElement>("serviceSelect");
  if (!select) return;

  select.replaceChildren(new Option("Pilih layanan aktif", ""));

  getQueueTypes()
    .filter(service => service.active)
    .forEach(service => {
      select.add(new Option(
        `${service.code} — ${service.name}`,
        service.code
      ));
    });
}

function renderPublicTickets(): void {
  const body = publicElement<HTMLTableSectionElement>("publicTicketRows");
  if (!body) return;

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
    const service = getQueueTypes().find(
      item => item.code === ticket.queueCode
    );

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
  const form = publicElement<HTMLFormElement>("ticketForm");
  const select = publicElement<HTMLSelectElement>("serviceSelect");
  const priority = publicElement<HTMLSelectElement>("prioritySelect");
  const message = publicElement<HTMLElement>("ticketMessage");
  const result = publicElement<HTMLElement>("ticketResult");

  renderPublicServices();
  renderPublicTickets();

  form?.addEventListener("submit", event => {
    event.preventDefault();

    if (!select?.value || !priority || !message || !result) return;

    try {
      const ticket = createQueueTicket(
        select.value,
        priority.value as QueuePriority
      );

      result.textContent =
        `Nomor antrean: ${ticket.number} | Prioritas: ${ticket.priority}`;

      message.textContent = "Nomor antrean berhasil dibuat.";
      message.style.color = "#15803d";

      renderPublicServices();
      renderPublicTickets();
    } catch (error) {
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
  }, 2500);
});