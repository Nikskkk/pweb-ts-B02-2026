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
