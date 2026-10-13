const QUEUE_PRIORITY_ORDER: QueuePriority[] = [
  "VIP",
  "Disabilitas",
  "Lansia",
  "Normal"
];

function createQueueTicket(
  queueCode: string,
  priority: QueuePriority
): QueueTicket {
  const code = queueCode.trim().toUpperCase();

  if (!/^[A-Z]$/.test(code)) {
    throw new Error("Kode layanan tidak valid.");
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error("Prioritas tiket tidak valid.");
  }

  const service = getQueueTypes().find(
    item => item.code.toUpperCase() === code && item.active
  );

  if (!service) {
    throw new Error("Layanan tidak ditemukan atau sedang nonaktif.");
  }

  const counters = getQueueCounters();
  const nextNumber = (counters[code] ?? 0) + 1;
  const now = Date.now();
  const ticket: QueueTicket = {
    id: `${code}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    number: `${code}-${String(nextNumber).padStart(3, "0")}`,
    queueCode: code,
    priority,
    status: "Menunggu",
    createdAt: now,
    updatedAt: now
  };

  const tickets = getQueueTickets();
  tickets.push(ticket);
  counters[code] = nextNumber;
  saveQueueTickets(tickets);
  saveQueueCounters(counters);

  return ticket;
}

function getPriorityRank(priority: QueuePriority): number {
  return QUEUE_PRIORITY_ORDER.indexOf(priority);
}

function getWaitingTickets(): QueueTicket[] {
  return getQueueTickets()
    .filter(ticket => ticket.status === "Menunggu")
    .sort((a, b) => {
      const priorityDifference =
        getPriorityRank(a.priority) - getPriorityRank(b.priority);

      if (priorityDifference !== 0) return priorityDifference;

      const aOrder = a.skippedAt ?? a.createdAt;
      const bOrder = b.skippedAt ?? b.createdAt;
      return aOrder - bOrder;
    });
}

function getNextWaitingTicket(): QueueTicket | undefined {
  return getWaitingTickets()[0];
}

function getCurrentTicket(): QueueTicket | undefined {
  return getQueueTickets().find(ticket => ticket.status === "Dipanggil");
}

function callNextQueueTicket(): QueueTicket | undefined {
  const tickets = getQueueTickets();

  tickets.forEach(ticket => {
    if (ticket.status === "Dipanggil") {
      ticket.status = "Selesai";
      ticket.updatedAt = Date.now();
    }
  });

  const next = getNextWaitingTicket();
  if (!next) {
    saveQueueTickets(tickets);
    return undefined;
  }

  const ticket = tickets.find(item => item.id === next.id);
  if (!ticket) {
    saveQueueTickets(tickets);
    return undefined;
  }

  ticket.status = "Dipanggil";
  ticket.updatedAt = Date.now();
  saveQueueTickets(tickets);
  return ticket;
}

function finishCurrentQueueTicket(): QueueTicket | undefined {
  const tickets = getQueueTickets();
  const current = tickets.find(ticket => ticket.status === "Dipanggil");
  if (!current) return undefined;

  current.status = "Selesai";
  current.updatedAt = Date.now();
  saveQueueTickets(tickets);
  return current;
}

function skipCurrentQueueTicket(): QueueTicket | undefined {
  const tickets = getQueueTickets();
  const current = tickets.find(ticket => ticket.status === "Dipanggil");
  if (!current) return undefined;

  current.status = "Dilewati";
  current.skippedAt = Date.now();
  current.updatedAt = Date.now();
  saveQueueTickets(tickets);
  return current;
}
