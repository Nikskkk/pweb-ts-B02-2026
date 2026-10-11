type UserRole = "admin" | "moderator" | "user" | string;
type QueuePriority = "Normal" | "Lansia" | "Disabilitas" | "VIP";
type TicketStatus = "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati";

interface AuthSession {
  token: string;
  role: UserRole;
  firstName: string;
}

interface QueueType {
  code: string;
  name: string;
  active: boolean;
}

interface QueueTicket {
  id: string;
  number: string;
  queueCode: string;
  priority: QueuePriority;
  status: TicketStatus;
  createdAt: number;
  updatedAt?: number;
  skippedAt?: number;
}

interface QueueCounters {
  [code: string]: number;
}

const STORAGE_KEYS = {
  session: "authSession",
  queueTypes: "queueTypes",
  tickets: "queueTickets",
  counters: "queueCounters"
} as const;

const VALID_PRIORITIES: QueuePriority[] = [
  "VIP",
  "Disabilitas",
  "Lansia",
  "Normal"
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession(): AuthSession | null {
  return readJson<AuthSession | null>(STORAGE_KEYS.session, null);
}

function saveSession(session: AuthSession): void {
  writeJson(STORAGE_KEYS.session, session);
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function getQueueTypes(): QueueType[] {
  return readJson<QueueType[]>(STORAGE_KEYS.queueTypes, []);
}

function saveQueueTypes(types: QueueType[]): void {
  writeJson(STORAGE_KEYS.queueTypes, types);
}

function getQueueTickets(): QueueTicket[] {
  return readJson<QueueTicket[]>(STORAGE_KEYS.tickets, []);
}

function saveQueueTickets(tickets: QueueTicket[]): void {
  writeJson(STORAGE_KEYS.tickets, tickets);
}

function getQueueCounters(): QueueCounters {
  return readJson<QueueCounters>(STORAGE_KEYS.counters, {});
}

function saveQueueCounters(counters: QueueCounters): void {
  writeJson(STORAGE_KEYS.counters, counters);
}

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

  const ticket: QueueTicket = {
    id: `${code}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    number: `${code}-${String(nextNumber).padStart(3, "0")}`,
    queueCode: code,
    priority,
    status: "Menunggu",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const tickets = getQueueTickets();
  tickets.push(ticket);
  counters[code] = nextNumber;

  saveQueueTickets(tickets);
  saveQueueCounters(counters);

  return ticket;
}

function getPriorityRank(priority: QueuePriority): number {
  const order: QueuePriority[] = [
    "VIP",
    "Disabilitas",
    "Lansia",
    "Normal"
  ];

  return order.indexOf(priority);
}

function getNextWaitingTicket(): QueueTicket | undefined {
  return getQueueTickets()
    .filter(ticket => ticket.status === "Menunggu")
    .sort((a, b) => {
      const priorityDifference =
        getPriorityRank(a.priority) - getPriorityRank(b.priority);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const skippedDifference =
        (a.skippedAt ?? a.createdAt) - (b.skippedAt ?? b.createdAt);

      if (skippedDifference !== 0) {
        return skippedDifference;
      }

      return a.createdAt - b.createdAt;
    })[0];
}