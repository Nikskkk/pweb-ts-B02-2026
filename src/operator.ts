function operatorElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function renderOperator(): void {
  const tickets = getQueueTickets();
  const current = tickets.find(ticket => ticket.status === "Dipanggil");
  const next = getNextWaitingTicket();

  const currentNumber = operatorElement("currentNumber");
  const currentInfo = operatorElement("currentInfo");
  const nextNumber = operatorElement("nextNumber");
  const ticketRows = operatorElement<HTMLTableSectionElement>("ticketRows");

  if (currentNumber) {
    currentNumber.textContent = current?.number ?? "---";
  }

  if (currentInfo) {
    const service = current
      ? getQueueTypes().find(item => item.code === current.queueCode)
      : undefined;

    currentInfo.textContent = current
      ? `${service?.name ?? current.queueCode} · ${current.priority}`
      : "Belum ada antrean yang dipanggil.";
  }

  if (nextNumber) {
    nextNumber.textContent = next?.number ?? "Tidak ada";
  }

  if (!ticketRows) return;

  ticketRows.replaceChildren();

  const waitingTickets = getWaitingTickets();

  if (waitingTickets.length === 0) {
    const row = ticketRows.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 5;
    cell.textContent = "Tidak ada antrean yang menunggu.";
    return;
  }

  waitingTickets.forEach(ticket => {
    const row = ticketRows.insertRow();
    const service = getQueueTypes().find(
      item => item.code === ticket.queueCode
    );

    [
      ticket.number,
      service?.name ?? ticket.queueCode,
      ticket.priority,
      new Date(ticket.createdAt).toLocaleTimeString("id-ID"),
      ticket.status
    ].forEach(value => {
      row.insertCell().textContent = value;
    });
  });
}

function operatorMessage(text: string, error = false): void {
  const message = operatorElement<HTMLElement>("operatorMessage");
  if (!message) return;

  message.textContent = text;
  message.style.color = error ? "#b91c1c" : "#15803d";
}

function callNextTicket(): void {
  const ticket = callNextQueueTicket();

  if (!ticket) {
    operatorMessage("Tidak ada antrean yang menunggu.", true);
    renderOperator();
    return;
  }

  operatorMessage(`Memanggil nomor ${ticket.number}.`);
  renderOperator();
}

function finishCurrentTicket(): void {
  const ticket = finishCurrentQueueTicket();
  if (!ticket) {
    operatorMessage("Tidak ada tiket yang sedang dipanggil.", true);
    return;
  }

  operatorMessage(`Antrean ${ticket.number} telah selesai.`);
  renderOperator();
}

function skipCurrentTicket(): void {
  const ticket = skipCurrentQueueTicket();
  if (!ticket) {
    operatorMessage("Tidak ada tiket yang sedang dipanggil.", true);
    return;
  }

  operatorMessage(`Antrean ${ticket.number} dilewati.`);
  renderOperator();
}

document.addEventListener("DOMContentLoaded", () => {
  const session = requireRole(["admin", "moderator"]);
  if (!session) return;

  const staffInfo = operatorElement("staffInfo");
  if (staffInfo) {
    staffInfo.textContent = `Petugas: ${session.firstName} (${session.role})`;
  }

  operatorElement<HTMLButtonElement>("callNextButton")
    ?.addEventListener("click", callNextTicket);

  operatorElement<HTMLButtonElement>("finishButton")
    ?.addEventListener("click", finishCurrentTicket);

  operatorElement<HTMLButtonElement>("skipButton")
    ?.addEventListener("click", skipCurrentTicket);

  operatorElement<HTMLButtonElement>("logoutBtn")
    ?.addEventListener("click", () => {
      clearSession();
      window.location.replace("login.html");
    });

  window.addEventListener("storage", renderOperator);
  window.setInterval(renderOperator, 2500);

  renderOperator();
});