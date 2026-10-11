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

  const waitingTickets = tickets
    .filter(ticket => ticket.status === "Menunggu")
    .sort((a, b) => {
      const difference =
        getPriorityRank(a.priority) - getPriorityRank(b.priority);

      return difference || a.createdAt - b.createdAt;
    });

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
  const tickets = getQueueTickets();

  // Tiket yang sedang dipanggil diselesaikan terlebih dahulu.
  tickets.forEach(ticket => {
    if (ticket.status === "Dipanggil") {
      ticket.status = "Selesai";
      ticket.updatedAt = Date.now();
    }
  });

  const next = getNextWaitingTicket();

  if (!next) {
    saveQueueTickets(tickets);
    operatorMessage("Tidak ada antrean yang menunggu.", true);
    renderOperator();
    return;
  }

  const ticket = tickets.find(item => item.id === next.id);

  if (!ticket) return;

  ticket.status = "Dipanggil";
  ticket.updatedAt = Date.now();

  saveQueueTickets(tickets);
  operatorMessage(`Memanggil nomor ${ticket.number}.`);
  renderOperator();
}

function finishCurrentTicket(): void {
  const tickets = getQueueTickets();
  const current = tickets.find(ticket => ticket.status === "Dipanggil");

  if (!current) {
    operatorMessage("Tidak ada tiket yang sedang dipanggil.", true);
    return;
  }

  current.status = "Selesai";
  current.updatedAt = Date.now();

  saveQueueTickets(tickets);
  operatorMessage(`Antrean ${current.number} telah selesai.`);
  renderOperator();
}

function skipCurrentTicket(): void {
  const tickets = getQueueTickets();
  const current = tickets.find(ticket => ticket.status === "Dipanggil");

  if (!current) {
    operatorMessage("Tidak ada tiket yang sedang dipanggil.", true);
    return;
  }

  current.status = "Dilewati";
  current.skippedAt = Date.now();
  current.updatedAt = Date.now();

  saveQueueTickets(tickets);
  operatorMessage(`Antrean ${current.number} dilewati.`);
  renderOperator();
}

document.addEventListener("DOMContentLoaded", () => {
  const session = requireRole(["admin", "moderator"]);
  if (!session) return;

  operatorElement("staffInfo")!.textContent =
    `Petugas: ${session.firstName} (${session.role})`;

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