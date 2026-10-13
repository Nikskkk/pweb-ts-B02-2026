function screenElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function renderQueueScreen(): void {
  const container = screenElement("serviceCards");
  if (!container) return;

  container.replaceChildren();

  const services = getQueueTypes().filter(service => service.active);
  const tickets = getQueueTickets();

  if (services.length === 0) {
    container.textContent = "Belum ada jenis layanan aktif.";
    return;
  }

  for (const service of services) {
    const serviceTickets = tickets.filter(
      ticket => ticket.queueCode === service.code
    );

    const current = serviceTickets
      .filter(ticket => ticket.status === "Dipanggil")
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];

    const waiting = serviceTickets.filter(
      ticket => ticket.status === "Menunggu"
    ).length;

    const card = document.createElement("section");
    card.className = "service-card";

    const heading = document.createElement("h2");
    heading.textContent = `${service.code} — ${service.name}`;

    const label = document.createElement("p");
    label.textContent = "Nomor dipanggil";

    const number = document.createElement("div");
    number.className = "called-number";
    number.textContent = current?.number ?? "---";

    const count = document.createElement("p");
    count.textContent = `Antrean menunggu: ${waiting}`;

    card.append(heading, label, number);

    if (current) {
      const priority = document.createElement("p");
      priority.textContent = `Prioritas: ${current.priority}`;
      card.appendChild(priority);
    }

    card.appendChild(count);
    container.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const session = requireLogin();
  if (!session) return;

  const sessionName = screenElement<HTMLElement>("sessionName");
  if (sessionName) {
    sessionName.textContent = `${session.firstName} (${session.role})`;
  }
  screenElement<HTMLButtonElement>("logoutButton")
    ?.addEventListener("click", logout);

  screenElement<HTMLButtonElement>("fullscreenBtn")
    ?.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "Mode layar penuh tidak tersedia.";
        console.error("Fullscreen gagal:", message);
      }
    });

  window.addEventListener("storage", renderQueueScreen);
  window.setInterval(renderQueueScreen, 2500);
  renderQueueScreen();
});