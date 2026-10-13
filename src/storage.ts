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
