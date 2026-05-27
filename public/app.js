const list = document.querySelector("#concert-list");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const sortButtons = document.querySelectorAll("[data-sort]");
const artistCount = document.querySelector("#artist-count");
const concertCount = document.querySelector("#concert-count");
const cityCount = document.querySelector("#city-count");

const state = {
  sortKey: "date",
  sortDirection: "desc",
  concerts: [],
};

const collator = new Intl.Collator("de", {
  numeric: true,
  sensitivity: "base",
});

const formatDate = (value) => {
  if (!value) return "TBA";
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const formatDateRange = (concert) => {
  if (!concert.dateEnd || concert.dateEnd === concert.date) {
    return formatDate(concert.date);
  }

  return `${formatDate(concert.date)} – ${formatDate(concert.dateEnd)}`;
};

const normalize = (value) => value.toString().toLowerCase().trim();

const renderStats = (concerts) => {
  const artists = new Set(concerts.map((concert) => concert.artist));
  const cities = new Set(concerts.map((concert) => concert.city));

  artistCount.textContent = artists.size;
  concertCount.textContent = concerts.length;
  cityCount.textContent = cities.size;
};

const renderConcerts = (concerts) => {
  const header = document.createElement("div");
  header.className = "concert-list-header";
  ["Datum", "Artist", "Event", "Ort", "Typ"].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.append(cell);
  });

  list.replaceChildren(
    header,
    ...concerts.map((concert) => {
      const card = document.createElement("article");
      card.className = "concert-card";

      const date = document.createElement("div");
      date.className = "concert-date concert-cell";
      date.append(createLabel("Datum"));
      date.append(document.createTextNode(formatDateRange(concert)));

      const artist = document.createElement("div");
      artist.className = "concert-cell";
      artist.append(createLabel("Artist"));
      const title = document.createElement("h3");
      title.textContent = concert.artist;
      artist.append(title);

      const event = document.createElement("div");
      event.className = "concert-event concert-cell";
      event.append(createLabel("Event"));
      event.append(document.createTextNode(concert.event ?? "Live"));

      const place = document.createElement("div");
      place.className = "concert-cell";
      place.append(createLabel("Ort"));
      const venue = document.createElement("p");
      venue.className = "concert-venue";
      venue.textContent = concert.venue;
      const meta = document.createElement("p");
      meta.className = "concert-meta";
      meta.textContent = [concert.city, concert.country].filter(Boolean).join(" · ");
      place.append(venue, meta);

      const kind = document.createElement("span");
      kind.className = "concert-kind";
      kind.textContent = concert.type ?? "Concert";

      card.append(date, artist, event, place, kind);
      return card;
    }),
  );

  emptyState.hidden = concerts.length > 0;
};

const createLabel = (text) => {
  const label = document.createElement("span");
  label.className = "concert-label";
  label.textContent = text;
  return label;
};

const filterConcerts = (concerts, query) => {
  const needle = normalize(query);
  if (!needle) return concerts;

  return concerts.filter((concert) => {
    const haystack = [
      concert.artist,
      concert.venue,
      concert.city,
      concert.country,
      concert.type,
      concert.event,
      concert.date,
      concert.dateEnd,
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ");

    return haystack.includes(needle);
  });
};

const sortConcerts = (concerts) => {
  const direction = state.sortDirection === "asc" ? 1 : -1;

  return [...concerts].sort((a, b) => {
    const sortKeys = {
      artist: ["artist", "date", "event"],
      city: ["city", "artist", "date"],
      date: ["date", "artist", "event"],
    }[state.sortKey];

    for (const key of sortKeys) {
      const valueA = a[key] ?? "";
      const valueB = b[key] ?? "";
      const result = collator.compare(valueA, valueB);

      if (result !== 0) {
        return result * direction;
      }
    }

    return 0;
  });
};

const updateSortButtons = () => {
  sortButtons.forEach((button) => {
    const isActive = button.dataset.sort === state.sortKey;
    const directionLabel = state.sortDirection === "asc" ? "↑" : "↓";
    const label = button.dataset.sort === "date"
      ? "Datum"
      : button.dataset.sort === "artist"
        ? "Artist"
        : "Stadt";

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive.toString());
    button.textContent = isActive ? `${label} ${directionLabel}` : label;
  });
};

const renderCurrentView = () => {
  const filteredConcerts = filterConcerts(state.concerts, searchInput.value);
  renderConcerts(sortConcerts(filteredConcerts));
};

const init = async () => {
  const response = await fetch("./data/concerts.json");
  const concerts = await response.json();
  state.concerts = concerts;

  renderStats(state.concerts);
  updateSortButtons();
  renderCurrentView();

  searchInput.addEventListener("input", () => {
    renderCurrentView();
  });

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextSortKey = button.dataset.sort;

      if (state.sortKey === nextSortKey) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = nextSortKey;
        state.sortDirection = nextSortKey === "date" ? "desc" : "asc";
      }

      updateSortButtons();
      renderCurrentView();
    });
  });
};

init().catch(() => {
  list.textContent = "Die Konzertdaten konnten nicht geladen werden.";
});
