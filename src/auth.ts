const LOGIN_API = "https://dummyjson.com/auth/login";
const ADMIN_USERS_API =
"https://dummyjson.com/users/filter?key=role&value=admin";
const REGULAR_USERS_API =
"https://dummyjson.com/users/filter?key=role&value=user";

interface LoginApiResponse {
accessToken?: string;
token?: string;
firstName?: string;
username?: string;
role?: string;
message?: string;
}

interface UserReference {
username?: string;
role?: string;
}

interface UsersApiResponse {
users?: UserReference[];
}

function showLoginMessage(
message: string,
type: "error" | "success" = "error"
): void {
const target = document.getElementById("loginMessage");
if (!target) return;

target.textContent = message;
target.className = `message ${type}`;
}

function setLoginLoading(loading: boolean): void {
const button = document.getElementById(
"loginButton"
) as HTMLButtonElement | null;

const username = document.getElementById(
"username"
) as HTMLInputElement | null;

const password = document.getElementById(
"password"
) as HTMLInputElement | null;

if (button) {
button.disabled = loading;
button.textContent = loading ? "Memverifikasi..." : "Masuk";
}

if (username) username.disabled = loading;
if (password) password.disabled = loading;
}

function normalizeRole(role?: string): string {
return (role ?? "").trim().toLowerCase();
}

function isSupportedRole(role?: string): role is "admin" | "moderator" | "user" {
  return ["admin", "moderator", "user"].includes(normalizeRole(role));
}

async function fetchUsers(url: string): Promise<UserReference[]> {
const response = await fetch(url);

if (!response.ok) {
throw new Error("Gagal mengambil referensi role dari server.");
}

const data = await response.json() as UsersApiResponse;
return data.users ?? [];
}

async function determineRole(
username: string,
loginRole?: string
): Promise<string> {
const directRole = normalizeRole(loginRole);

if (["admin", "moderator", "user"].includes(directRole)) {
return directRole;
}

const [admins, users] = await Promise.all([
fetchUsers(ADMIN_USERS_API),
fetchUsers(REGULAR_USERS_API)
]);

const normalizedUsername = username.trim().toLowerCase();

const admin = admins.find(
user => user.username?.trim().toLowerCase() === normalizedUsername
);

if (admin) {
const role = normalizeRole(admin.role);

if (role === "admin" || role === "moderator") {
  return role;
}


}

const regularUser = users.find(
user => user.username?.trim().toLowerCase() === normalizedUsername
);

if (regularUser && normalizeRole(regularUser.role) === "user") {
return "user";
}

throw new Error(
"Role akun tidak ditemukan pada referensi API. Coba akun lain."
);
}

async function handleLogin(event: SubmitEvent): Promise<void> {
event.preventDefault();

const usernameInput = document.getElementById(
"username"
) as HTMLInputElement | null;

const passwordInput = document.getElementById(
"password"
) as HTMLInputElement | null;

if (!usernameInput || !passwordInput) return;

const username = usernameInput.value.trim();
const password = passwordInput.value;

if (!username || !password) {
showLoginMessage("Username dan password wajib diisi.");
return;
}

setLoginLoading(true);
showLoginMessage("");

try {
const response = await fetch(LOGIN_API, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
username,
password,
expiresInMins: 30
})
});


const data = await response.json() as LoginApiResponse;

if (!response.ok) {
  throw new Error(
    data.message || "Login gagal. Periksa username dan password."
  );
}

const token = data.accessToken || data.token;

if (!token) {
  throw new Error("API tidak mengembalikan token autentikasi.");
}

const role = await determineRole(username, data.role);

const session: AuthSession = {
  token,
  role,
  firstName: data.firstName || data.username || username
};

saveSession(session);

if (role === "admin" || role === "moderator") {
  window.location.replace("index.html");
} else {
  window.location.replace("ambil-antrian.html");
}


} catch (error) {
clearSession();


const message = error instanceof Error
  ? error.message
  : "Terjadi kesalahan yang tidak diketahui.";

showLoginMessage(
  message.includes("Failed to fetch")
    ? "Koneksi ke server gagal. Periksa internet dan coba lagi."
    : message
);


} finally {
setLoginLoading(false);
}
}

function requireLogin(): AuthSession | null {
const session = getSession();

if (
  !session ||
  typeof session.token !== "string" ||
  !session.token.trim() ||
  !isSupportedRole(session.role)
) {
clearSession();
window.location.replace("login.html");
return null;
}

session.role = normalizeRole(session.role);
return session;
}

function requireRole(allowedRoles: string[]): AuthSession | null {
const session = requireLogin();
if (!session) return null;

const role = normalizeRole(session.role);

if (!allowedRoles.map(item => normalizeRole(item)).includes(role)) {
clearSession();
window.location.replace("login.html");
return null;
}

return session;
}

function logout(): void {
clearSession();
window.location.replace("login.html");
}

document.addEventListener("DOMContentLoaded", () => {
const loginForm = document.getElementById(
"loginForm"
) as HTMLFormElement | null;

if (loginForm) {
const session = getSession();


if (session?.token && session.role) {
  const role = session.role.trim().toLowerCase();

  if (role === "admin" || role === "moderator") {
    window.location.replace("index.html");
    return;
  }

  if (role === "user") {
    window.location.replace("ambil-antrian.html");
    return;
  }
}

loginForm.addEventListener("submit", event => {
  void handleLogin(event);
});


}

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
logoutButton.addEventListener("click", logout);
}
});