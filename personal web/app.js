const PROJECTS = {
  work: [
    {
      title: "Studio Atlas",
      type: "Product System",
      year: "2026",
      note: "Research dashboards / placeholder",
      label: "Process",
      motif: "grid",
      accent: "98 118 255",
    },
    {
      title: "Northstar Brief",
      type: "Editorial UX",
      year: "2026",
      note: "Weekly publishing flow / placeholder",
      label: "Layout",
      motif: "lines",
      accent: "255 111 94",
    },
    {
      title: "Signal Board",
      type: "Internal Tool",
      year: "2025",
      note: "Project operations / placeholder",
      label: "System",
      motif: "stack",
      accent: "91 167 156",
    },
    {
      title: "Field Notes",
      type: "Archive Interface",
      year: "2025",
      note: "Interview library / placeholder",
      label: "Archive",
      motif: "frame",
      accent: "195 142 88",
    },
    {
      title: "Workshop OS",
      type: "Education Platform",
      year: "2024",
      note: "Courses and cohort tools / placeholder",
      label: "Flow",
      motif: "orbit",
      accent: "120 92 222",
    },
    {
      title: "Orbit Deck",
      type: "Presentation System",
      year: "2024",
      note: "Reusable narrative slides / placeholder",
      label: "Deck",
      motif: "arc",
      accent: "89 153 235",
    },
  ],
  code: [
    {
      title: "Terminal Garden",
      type: "Creative Coding",
      year: "2026",
      note: "ASCII growth engine / placeholder",
      label: "CLI",
      motif: "field",
      accent: "75 184 135",
    },
    {
      title: "Frame Sync",
      type: "Realtime App",
      year: "2026",
      note: "Review comments in motion / placeholder",
      label: "Sync",
      motif: "grid",
      accent: "107 121 255",
    },
    {
      title: "Quiet Queue",
      type: "Automation",
      year: "2025",
      note: "Task routing and reminders / placeholder",
      label: "Ops",
      motif: "stack",
      accent: "255 126 97",
    },
    {
      title: "Mesh Notes",
      type: "Collaborative Editor",
      year: "2025",
      note: "Shared documents / placeholder",
      label: "Draft",
      motif: "frame",
      accent: "112 171 224",
    },
    {
      title: "Pattern Engine",
      type: "Design Tokens",
      year: "2024",
      note: "Cross-platform component rules / placeholder",
      label: "Tokens",
      motif: "lines",
      accent: "173 116 245",
    },
    {
      title: "Index Zero",
      type: "Search Prototype",
      year: "2024",
      note: "Fast retrieval system / placeholder",
      label: "Query",
      motif: "orbit",
      accent: "231 147 86",
    },
  ],
  make: [
    {
      title: "Fold Lamp",
      type: "Aluminum, Acrylic",
      year: "2026",
      note: "Desk light study / placeholder",
      label: "Object",
      motif: "arc",
      accent: "243 149 86",
    },
    {
      title: "Desk Totem",
      type: "Walnut, Brass",
      year: "2026",
      note: "Stacked organizer / placeholder",
      label: "Material",
      motif: "stack",
      accent: "152 113 86",
    },
    {
      title: "Clay Study 01",
      type: "Stoneware, Glaze",
      year: "2025",
      note: "Form exploration / placeholder",
      label: "Ceramic",
      motif: "orbit",
      accent: "114 145 225",
    },
    {
      title: "Soft Jig",
      type: "Foam, Canvas",
      year: "2025",
      note: "Prototype fixture / placeholder",
      label: "Prototype",
      motif: "field",
      accent: "230 103 138",
    },
    {
      title: "Hanging Shelf",
      type: "Oak, Wire",
      year: "2024",
      note: "Wall storage / placeholder",
      label: "Assembly",
      motif: "frame",
      accent: "87 163 150",
    },
    {
      title: "Cast Block",
      type: "Concrete, Pigment",
      year: "2024",
      note: "Texture test / placeholder",
      label: "Surface",
      motif: "lines",
      accent: "124 123 140",
    },
  ],
};

const page = document.body.dataset.page;

applyTimeTheme();
window.setInterval(applyTimeTheme, 60000);

document.querySelectorAll("[data-last-updated]").forEach((node) => {
  node.textContent = "April 2026";
});

document.querySelectorAll("[data-nav-page]").forEach((link) => {
  const isActive = link.dataset.navPage === page;
  link.classList.toggle("is-active", isActive);
  if (isActive) {
    link.setAttribute("aria-current", "page");
  }
});

const grid = document.querySelector("[data-grid-page]");
if (grid) {
  const items = PROJECTS[grid.dataset.gridPage] || [];
  grid.innerHTML = items
    .map(
      (item, index) => `
        <article class="project-card" style="--accent: ${item.accent}; --delay: ${index * 70}ms;">
          <div class="project-card__meta">
            <div class="project-card__heading">
              <span class="project-card__title">${item.title}</span>
              <span class="project-card__type">${item.type}</span>
            </div>
            <span class="project-card__year">${item.year}</span>
          </div>
          <div class="project-card__visual" data-motif="${item.motif}"></div>
        </article>
      `
    )
    .join("");
}

const moreButton = document.querySelector("[data-more-toggle]");
const morePanel = document.querySelector("[data-more-panel]");

if (moreButton && morePanel) {
  moreButton.addEventListener("click", () => {
    const isOpen = moreButton.getAttribute("aria-expanded") === "true";
    moreButton.setAttribute("aria-expanded", String(!isOpen));
    moreButton.textContent = isOpen ? ">more<" : ">less<";
    morePanel.classList.toggle("is-open", !isOpen);
    morePanel.setAttribute("aria-hidden", String(isOpen));
  });
}

if (page === "home") {
  initHomeQuanta();
}

function applyTimeTheme() {
  const hour = new Date().getHours();
  const nextTheme = hour >= 6 && hour < 18 ? "light" : "dark";
  const previousTheme = document.body.dataset.theme;

  document.body.dataset.theme = nextTheme;

  if (previousTheme && previousTheme !== nextTheme) {
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme: nextTheme },
      })
    );
  }
}

function initHomeQuanta() {
  const canvas = document.querySelector("[data-home-quanta]");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const pointer = {
    active: false,
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    radius: 180,
  };

  let width = 0;
  let height = 0;
  let particles = [];
  let config = getQuantaConfig(window.innerWidth);
  let quantaRgb = getQuantaRgb();

  function getQuantaRgb() {
    return getComputedStyle(document.body).getPropertyValue("--quanta-rgb").trim() || "15 16 20";
  }

  function getQuantaConfig(viewportWidth) {
    if (viewportWidth >= 2400) {
      return {
        count: 132,
        minSize: 2.8,
        maxSize: 5.4,
        radius: 320,
        pull: 0.05,
        drift: 0.024,
        focusBoost: 2.6,
      };
    }

    if (viewportWidth >= 1800) {
      return {
        count: 108,
        minSize: 2.3,
        maxSize: 4.4,
        radius: 270,
        pull: 0.046,
        drift: 0.022,
        focusBoost: 2.2,
      };
    }

    if (viewportWidth >= 1200) {
      return {
        count: 84,
        minSize: 1.8,
        maxSize: 3.4,
        radius: 220,
        pull: 0.043,
        drift: 0.02,
        focusBoost: 1.9,
      };
    }

    if (viewportWidth >= 620) {
      return {
        count: 56,
        minSize: 1.5,
        maxSize: 2.8,
        radius: 190,
        pull: 0.04,
        drift: 0.018,
        focusBoost: 1.7,
      };
    }

    return {
      count: 28,
      minSize: 1.2,
      maxSize: 2.1,
      radius: 150,
      pull: 0.036,
      drift: 0.016,
      focusBoost: 1.35,
    };
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    config = getQuantaConfig(width);
    pointer.radius = config.radius;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createParticles();
  }

  function createParticles() {
    particles = Array.from({ length: config.count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      size:
        Math.random() > 0.82
          ? config.maxSize
          : config.minSize + Math.random() * (config.maxSize - config.minSize) * 0.6,
      alpha: 0.14 + Math.random() * 0.26,
      phase: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.008,
    }));
  }

  function wrapParticle(particle) {
    if (particle.x < -10) {
      particle.x = width + 10;
    } else if (particle.x > width + 10) {
      particle.x = -10;
    }

    if (particle.y < -10) {
      particle.y = height + 10;
    } else if (particle.y > height + 10) {
      particle.y = -10;
    }
  }

  function drawFrame(time) {
    context.clearRect(0, 0, width, height);

    for (const particle of particles) {
      const driftX = Math.cos(time * particle.speed + particle.phase) * config.drift;
      const driftY = Math.sin(time * particle.speed + particle.phase) * config.drift;

      particle.vx += driftX;
      particle.vy += driftY;

      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distance = Math.hypot(dx, dy) || 1;

      if (pointer.active && distance < pointer.radius) {
        const pull = (1 - distance / pointer.radius) * config.pull;
        particle.vx += (dx / distance) * pull;
        particle.vy += (dy / distance) * pull;
      }

      particle.vx *= 0.985;
      particle.vy *= 0.985;
      particle.x += particle.vx;
      particle.y += particle.vy;

      wrapParticle(particle);

      const focus = pointer.active ? Math.max(0, 1 - distance / (pointer.radius * 0.9)) : 0;
      const size = particle.size + focus * config.focusBoost;
      const alpha = particle.alpha + focus * 0.28;

      context.fillStyle = `rgba(${quantaRgb} / ${alpha.toFixed(3)})`;
      context.fillRect(particle.x, particle.y, size, size);
    }

    window.requestAnimationFrame(drawFrame);
  }

  function updatePointer(x, y) {
    pointer.active = true;
    pointer.x = x;
    pointer.y = y;
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    updatePointer(event.clientX, event.clientY);
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) {
        updatePointer(touch.clientX, touch.clientY);
      }
    },
    { passive: true }
  );
  window.addEventListener("touchend", () => {
    pointer.active = false;
  });
  window.addEventListener("themechange", () => {
    quantaRgb = getQuantaRgb();
  });

  resizeCanvas();
  quantaRgb = getQuantaRgb();
  window.requestAnimationFrame(drawFrame);
}
