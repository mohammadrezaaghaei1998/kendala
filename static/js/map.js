
    
(() => {
  "use strict";

  const explorer = document.getElementById("destination-explorer");
  if (!explorer || typeof L === "undefined") return;

  const grid = explorer.querySelector("#dxDestinationGrid");
  const tabs = [...explorer.querySelectorAll(".dx-country-tab")];
  const countryTitle = explorer.querySelector("#dxCountryTitle");
  const mapTitle = explorer.querySelector("#dxMapTitle");
  const countryCount = explorer.querySelector("#dxCountryCount");
  const resultCount = explorer.querySelector("#dxResultCount");
  const loading = explorer.querySelector("#dxMapLoading");

  /*
   * Coordinates use [latitude, longitude].
   * Replace the example photos with your own destination images.
   */
  const destinations = {
    kazakhstan: {
      name: "Kazakhstan",
      places: [
        {
          id: "almaty",
          name: "Almaty",
          category: "Mountains & City",
          description: "Discover mountain scenery, leafy streets and city life.",
          coordinates: [43.2389, 76.8897],
          image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "astana",
          name: "Astana",
          category: "Architecture & Culture",
          description: "Explore contemporary architecture and cultural landmarks.",
          coordinates: [51.1694, 71.4491],
          image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "charyn",
          name: "Charyn Canyon",
          category: "Nature & Adventure",
          description: "Experience dramatic canyon landscapes and open skies.",
          coordinates: [43.3500, 79.0800],
          image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "turkistan",
          name: "Turkistan",
          category: "Heritage & History",
          description: "Discover historic architecture and Silk Road heritage.",
          coordinates: [43.2973, 68.2518],
          image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "aktau",
          name: "Aktau",
          category: "Coast & Nature",
          description: "Explore Caspian Sea views and unusual desert landscapes.",
          coordinates: [43.6532, 51.1975],
          image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "shymkent",
          name: "Shymkent",
          category: "Local Culture",
          description: "Discover southern Kazakhstan and its lively local culture.",
          coordinates: [42.3417, 69.5901],
          image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80"
        }
      ]
    },

    turkey: {
      name: "Turkey",
      places: [
        {
          id: "antalya",
          name: "Antalya",
          category: "Beaches & Adventure",
          description: "Turquoise coastlines, historic streets and Mediterranean views.",
          coordinates: [36.8969, 30.7133],
          image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "istanbul",
          name: "Istanbul",
          category: "Culture & History",
          description: "Discover iconic architecture and life between two continents.",
          coordinates: [41.0082, 28.9784],
          image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "alanya",
          name: "Alanya",
          category: "Coast & Relaxation",
          description: "Golden beaches, coastal scenery and a historic hilltop castle.",
          coordinates: [36.5438, 31.9998],
          image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "trabzon",
          name: "Trabzon",
          category: "Nature & Mountains",
          description: "Green highlands, mountain views and Black Sea culture.",
          coordinates: [41.0027, 39.7168],
          image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "cappadocia",
          name: "Cappadocia",
          category: "Landscapes & Adventure",
          description: "Explore otherworldly rock formations and valleys.",
          coordinates: [38.6431, 34.8289],
          image: "https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "izmir",
          name: "Izmir",
          category: "Coast & City",
          description: "Enjoy waterfront promenades and the Aegean atmosphere.",
          coordinates: [38.4237, 27.1428],
          image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=700&q=80"
        }
      ]
    },

    oman: {
      name: "Oman",
      places: [
        {
          id: "muscat",
          name: "Muscat",
          category: "Culture & Coast",
          description: "Discover coastal scenery, traditional architecture and souqs.",
          coordinates: [23.5880, 58.3829],
          image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "nizwa",
          name: "Nizwa",
          category: "Heritage & History",
          description: "Explore historic forts, traditional markets and old Oman.",
          coordinates: [22.9333, 57.5333],
          image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "salalah",
          name: "Salalah",
          category: "Nature & Beaches",
          description: "Discover southern Oman, green landscapes and coastal escapes.",
          coordinates: [17.0197, 54.0897],
          image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "jebel-akhdar",
          name: "Jebel Akhdar",
          category: "Mountains & Adventure",
          description: "Experience dramatic mountain scenery and cooler highlands.",
          coordinates: [23.0750, 57.6667],
          image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "sur",
          name: "Sur",
          category: "Coast & Culture",
          description: "Explore maritime heritage, coastal views and traditional dhows.",
          coordinates: [22.5667, 59.5289],
          image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "wahiba-sands",
          name: "Wahiba Sands",
          category: "Desert & Adventure",
          description: "Discover golden dunes, desert camps and open landscapes.",
          coordinates: [21.5000, 58.8000],
          image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=700&q=80"
        }
      ]
    },

    malaysia: {
      name: "Malaysia",
      places: [
        {
          id: "kuala-lumpur",
          name: "Kuala Lumpur",
          category: "City & Culture",
          description: "Experience a modern skyline, local food and vibrant city life.",
          coordinates: [3.1390, 101.6869],
          image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "penang",
          name: "Penang",
          category: "Culture & Food",
          description: "Discover heritage streets, art and renowned local cuisine.",
          coordinates: [5.4141, 100.3288],
          image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "langkawi",
          name: "Langkawi",
          category: "Islands & Beaches",
          description: "Enjoy tropical beaches, island scenery and rainforest.",
          coordinates: [6.3500, 99.8000],
          image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "malacca",
          name: "Malacca",
          category: "Heritage & History",
          description: "Explore historic streets and Malaysia's multicultural heritage.",
          coordinates: [2.1896, 102.2501],
          image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "cameron-highlands",
          name: "Cameron Highlands",
          category: "Nature & Highlands",
          description: "Discover misty hills, tea plantations and cool mountain air.",
          coordinates: [4.4700, 101.3800],
          image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80"
        },
        {
          id: "kota-kinabalu",
          name: "Kota Kinabalu",
          category: "Islands & Adventure",
          description: "Explore Sabah's coast, islands and spectacular mountain region.",
          coordinates: [5.9804, 116.0735],
          image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=80"
        }
      ]
    }
  };

  /* Map setup */

  const map = L.map("dxLeafletMap", {
    zoomControl: false,
    scrollWheelZoom: false,
    worldCopyJump: true
  });

L.tileLayer(
  "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4j2v_1_428fd033531a4e920c6684b1",
  {
    subdomains: "abcd",
    maxZoom: 19,
    attribution:
      '&copy; OpenStreetMap contributors &copy; CARTO'
  }

  ).addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  const markerLayer = L.featureGroup().addTo(map);

  let currentCountry = "kazakhstan";
  let currentPlaces = [];
  let activePlaceId = null;
  let markersById = {};
  let cardsById = {};
  let resizeTimer;

//   const markerIcon = L.divIcon({
//     className: "",
//     html: '<span class="dx-marker-dot"></span>',
//     iconSize: [30, 30],
//     iconAnchor: [15, 15]
//   });

  /* Helpers */

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function formatCount(count) {
    return String(count).padStart(2, "0");
  }

  function setMapLoading(isLoading) {
    loading.classList.toggle("is-hidden", !isLoading);
  }

  /* Render destination cards */

  function renderCards(places) {
    grid.innerHTML = "";
    cardsById = {};

    places.forEach((place, index) => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "dx-destination-card";
      card.dataset.place = place.id;
      card.setAttribute("aria-label", `Explore ${place.name} on the map`);
      card.setAttribute("aria-pressed", "false");

      card.innerHTML = `
        <div class="dx-card-image-wrap">
          <img
            class="dx-card-image"
            src="${escapeHTML(place.image)}"
            alt="${escapeHTML(place.name)}"
            loading="${index < 2 ? "eager" : "lazy"}"
            decoding="async"
          >
          <span class="dx-card-number">${formatCount(index + 1)}</span>
        </div>
        <div class="dx-card-content">
          <span class="dx-card-category">${escapeHTML(place.category)}</span>
          <div class="dx-card-title-row">
            <h4 class="dx-card-title">${escapeHTML(place.name)}</h4>
            <span class="dx-card-arrow" aria-hidden="true">↗</span>
          </div>
        </div>
      `;

      card.addEventListener("mouseenter", () => {
        setActivePlace(place.id, { pan: false });
      });

      card.addEventListener("focus", () => {
        setActivePlace(place.id, { pan: false });
      });

      card.addEventListener("click", () => {
        setActivePlace(place.id, {
          pan: true,
          zoom: 9,
          popup: true
        });
      });

      // Keep broken image URLs from breaking the card layout.
      const img = card.querySelector("img");
      img.addEventListener("error", () => {
        img.style.display = "none";
        img.parentElement.style.background =
          "linear-gradient(135deg, #ece8fa, #dce9ed)";
      }, { once: true });

      cardsById[place.id] = card;
      grid.appendChild(card);
    });
  }

  /* Create map markers */

  function renderMarkers(places) {
    markerLayer.clearLayers();
    markersById = {};

    places.forEach(place => {
      const marker = L.marker(place.coordinates, {
      icon: createMarkerIcon(false),
        keyboard: true,
        title: place.name,
        alt: place.name,
        riseOnHover: true
      });

      marker.bindPopup(`
        <div class="dx-popup">
          <div class="dx-popup-kicker">${escapeHTML(place.category)}</div>
          <div class="dx-popup-title">${escapeHTML(place.name)}</div>
          <div class="dx-popup-description">${escapeHTML(place.description)}</div>
        </div>
      `, {
        closeButton: true,
        autoPan: true
      });

      marker.on("mouseover", () => {
        setActivePlace(place.id, { pan: false });
      });

      marker.on("click", () => {
        setActivePlace(place.id, {
          pan: false,
          popup: true
        });
      });

      marker.on("popupopen", () => {
        setActivePlace(place.id, { pan: false });
      });

      marker.addTo(markerLayer);
      markersById[place.id] = marker;
    });
  }

  /* Synchronize cards and markers */


function setActivePlace(id, options = {}) {
  const place = currentPlaces.find(item => item.id === id);
  if (!place) return;

  activePlaceId = id;

  // Highlight the corresponding destination card.
  Object.entries(cardsById).forEach(([cardId, card]) => {
    const active = cardId === id;

    card.classList.toggle("is-active", active);
    card.setAttribute("aria-pressed", String(active));
  });

  // Highlight the corresponding map marker.
  Object.entries(markersById).forEach(([markerId, marker]) => {
    const active = markerId === id;

    marker.setIcon(createMarkerIcon(active));
    marker.setZIndexOffset(active ? 1000 : 0);
  });

  const marker = markersById[id];

  if (!marker) return;

  if (options.pan) {
    map.flyTo(
      place.coordinates,
      options.zoom || Math.max(map.getZoom(), 8),
      { duration: 0.65 }
    );
  }

  if (options.popup) {
    marker.openPopup();
  }
}

  /*
   * The custom marker icon uses a shell so its active state
   * remains visually distinct from inactive markers.
   */

  function createMarkerIcon(active = false) {
    return L.divIcon({
      className: "",
      html: `
        <span class="dx-marker-shell ${active ? "is-active" : ""}">
          <span class="dx-marker-dot"></span>
        </span>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  /* Country switching */

  function selectCountry(countryKey) {
    const country = destinations[countryKey];
    if (!country) return;

    currentCountry = countryKey;
    currentPlaces = country.places;
    activePlaceId = null;

    tabs.forEach(tab => {
      const selected = tab.dataset.country === countryKey;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    countryTitle.textContent = country.name;
    mapTitle.textContent = country.name;
    countryCount.textContent =
      `${formatCount(country.places.length)} destinations`;
    resultCount.textContent =
      `${formatCount(country.places.length)} places`;

    setMapLoading(true);

    renderCards(currentPlaces);
    renderMarkers(currentPlaces);

    const bounds = markerLayer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [32, 32],
        paddingBottomRight: [32, 32],
        maxZoom: 7,
        animate: true
      });
    }

    // Highlight the first destination without zooming away
    // from the overview of the selected country.
    if (currentPlaces.length) {
      setActivePlace(currentPlaces[0].id, { pan: false });
    }

    // Leaflet needs to recalculate dimensions after a layout change.
    window.setTimeout(() => {
      map.invalidateSize({ pan: false });
      setMapLoading(false);
    }, 180);
  }

  /* Tab interactions */

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      selectCountry(tab.dataset.country);
    });

    tab.addEventListener("keydown", event => {
      let nextIndex = index;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      tabs[nextIndex].focus();
      selectCountry(tabs[nextIndex].dataset.country);
    });
  });

  /* Keep the map sized correctly on responsive layouts */

  const resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          map.invalidateSize({ pan: false });
        }, 100);
      })
    : null;

  if (resizeObserver) {
    resizeObserver.observe(explorer);
  } else {
    window.addEventListener("resize", () => {
      map.invalidateSize({ pan: false });
    });
  }

  /*
   * Ensure all markers use the custom shell icon.
   * This also lets active styling update consistently.
   */
  function refreshMarkerIcons() {
    currentPlaces.forEach(place => {
      const marker = markersById[place.id];
      if (marker) {
        marker.setIcon(createMarkerIcon(place.id === activePlaceId));
      }
    });
  }

  // Initialize the first country.
  selectCountry(currentCountry);

  // Override marker rendering with the consistent custom icon.
  // Reapply active states after country changes.
//   const originalSelectCountry = selectCountry;

  // No global variables are created; everything stays in this closure.
})();
