const list = document.querySelector("#concert-list");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const artistCount = document.querySelector("#artist-count");
const concertCount = document.querySelector("#concert-count");
const cityCount = document.querySelector("#city-count");

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

const normalize = (value) => value.toString().toLowerCase().trim();

const renderStats = (concerts) => {
  const artists = new Set(concerts.map((concert) => concert.artist));
  const cities = new Set(concerts.map((concert) => concert.city));

  artistCount.textContent = artists.size;
  concertCount.textContent = concerts.length;
  cityCount.textContent = cities.size;
};

const renderConcerts = (concerts) => {
  list.replaceChildren(
    ...concerts.map((concert) => {
      const card = document.createElement("article");
      card.className = "concert-card";

      const date = document.createElement("div");
      date.className = "concert-date";
      date.textContent = formatDate(concert.date);

      const content = document.createElement("div");
      content.className = "concert-main";

      const title = document.createElement("h3");
      title.textContent = concert.artist;

      const meta = document.createElement("p");
      meta.className = "concert-meta";
      meta.textContent = [concert.venue, concert.city, concert.country]
        .filter(Boolean)
        .join(" · ");

      const tags = document.createElement("div");
      tags.className = "concert-tags";

      [concert.tour, concert.era, concert.memory]
        .filter(Boolean)
        .forEach((value) => {
          const tag = document.createElement("span");
          tag.className = "concert-tag";
          tag.textContent = value;
          tags.append(tag);
        });

      content.append(title, meta, tags);

      const kind = document.createElement("span");
      kind.className = "concert-kind";
      kind.textContent = concert.type ?? "Konzert";

      card.append(date, content, kind);
      return card;
    }),
  );

  emptyState.hidden = concerts.length > 0;
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
      concert.tour,
      concert.era,
      concert.memory,
      concert.date,
    ]
      .filter(Boolean)
      .map(normalize)
      .join(" ");

    return haystack.includes(needle);
  });
};

const init = async () => {
  const response = await fetch("./data/concerts.json");
  const concerts = await response.json();
  const sortedConcerts = concerts.sort((a, b) => collator.compare(b.date, a.date));

  renderStats(sortedConcerts);
  renderConcerts(sortedConcerts);

  searchInput.addEventListener("input", () => {
    renderConcerts(filterConcerts(sortedConcerts, searchInput.value));
  });
};

init().catch(() => {
  list.textContent = "Die Konzertdaten konnten nicht geladen werden.";
});
