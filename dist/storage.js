"use strict";
const STORAGE_KEYS = {
    session: "authSession",
    queueTypes: "queueTypes",
    tickets: "queueTickets",
    counters: "queueCounters"
};
const VALID_PRIORITIES = [
    "VIP",
    "Disabilitas",
    "Lansia",
    "Normal"
];
function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function getSession() {
    return readJson(STORAGE_KEYS.session, null);
}
function saveSession(session) {
    writeJson(STORAGE_KEYS.session, session);
}
function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
}
function getQueueTypes() {
    return readJson(STORAGE_KEYS.queueTypes, []);
}
function saveQueueTypes(types) {
    writeJson(STORAGE_KEYS.queueTypes, types);
}
function getQueueTickets() {
    return readJson(STORAGE_KEYS.tickets, []);
}
function saveQueueTickets(tickets) {
    writeJson(STORAGE_KEYS.tickets, tickets);
}
function getQueueCounters() {
    return readJson(STORAGE_KEYS.counters, {});
}
function saveQueueCounters(counters) {
    writeJson(STORAGE_KEYS.counters, counters);
}
function createQueueTicket(queueCode, priority) {
    const code = queueCode.trim().toUpperCase();
    if (!/^[A-Z]$/.test(code)) {
        throw new Error("Kode layanan tidak valid.");
    }
    if (!VALID_PRIORITIES.includes(priority)) {
        throw new Error("Prioritas tiket tidak valid.");
    }
    const service = getQueueTypes().find(item => item.code.toUpperCase() === code && item.active);
    if (!service) {
        throw new Error("Layanan tidak ditemukan atau sedang nonaktif.");
    }
    const counters = getQueueCounters();
    const nextNumber = (counters[code] ?? 0) + 1;
    const ticket = {
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
function getPriorityRank(priority) {
    const order = [
        "VIP",
        "Disabilitas",
        "Lansia",
        "Normal"
    ];
    return order.indexOf(priority);
}
function getNextWaitingTicket() {
    return getQueueTickets()
        .filter(ticket => ticket.status === "Menunggu")
        .sort((a, b) => {
        const priorityDifference = getPriorityRank(a.priority) - getPriorityRank(b.priority);
        if (priorityDifference !== 0) {
            return priorityDifference;
        }
        const skippedDifference = (a.skippedAt ?? a.createdAt) - (b.skippedAt ?? b.createdAt);
        if (skippedDifference !== 0) {
            return skippedDifference;
        }
        return a.createdAt - b.createdAt;
    })[0];
}
