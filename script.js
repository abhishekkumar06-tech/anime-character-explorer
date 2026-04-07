const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const container = document.getElementById("characterContainer");
const loading = document.getElementById("loading");

// New Controls
const sortSelect = document.getElementById("sortSelect");
const applyRangeBtn = document.getElementById("applyRangeBtn");
const minFavInput = document.getElementById("minFav");
const maxFavInput = document.getElementById("maxFav");
const resetBtn = document.getElementById("resetBtn");
const controlsDiv = document.getElementById("controls");
const themeToggle = document.getElementById("themeToggle");

// State
let currentCharacters = [];

// LocalStorage Favorites
let savedFavorites = JSON.parse(localStorage.getItem('animeFavorites')) || [];

// Fetch Characters
async function fetchCharacters(query) {
  try {
    loading.classList.remove("hidden");
    controlsDiv.classList.add("hidden");
    container.innerHTML = "";

    const response = await fetch(`https://api.jikan.moe/v4/characters?q=${query}&order_by=favorites&sort=desc`);
    const data = await response.json();

    // Limit to top 15 results and store in our global state
    currentCharacters = data.data.slice(0, 15);
    
    // reset UI controls
    sortSelect.value = "default";
    if (minFavInput) minFavInput.value = "";
    if (maxFavInput) maxFavInput.value = "";
    resetBtn.classList.add("hidden");

    displayCharacters(currentCharacters);

    if(currentCharacters.length > 0) {
        controlsDiv.classList.remove("hidden");
    }

  } catch (error) {
    container.innerHTML = "<p style='color: var(--text-secondary);'>Error fetching data</p>";
    console.error(error);
  } finally {
    loading.classList.add("hidden");
  }
}

// Display Characters using .map()
function displayCharacters(charactersToRender) {
  if (!charactersToRender.length) {
    container.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--text-secondary);'>No results found for this search/filter.</p>";
    return;
  }

  // higher order function: .map()
  container.innerHTML = charactersToRender
    .map(character => {
      const isFav = savedFavorites.includes(character.mal_id);
      return `
      <div class="card">
        <div class="image-container">
            <img src="${character.images.jpg.image_url}" alt="${character.name}" loading="lazy" />
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${character.mal_id})">
                ${isFav ? '❤️' : '🤍'}
            </button>
        </div>
        <div class="card-content">
            <h3>${character.name}</h3>
            <div class="badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                ${character.favorites ? character.favorites.toLocaleString() : '0'}
            </div>
        </div>
      </div>
    `})
    .join("");
}

// ----------------------------------------------------
// MILESTONE 3: HIGHER ORDER FUNCTIONS
// ----------------------------------------------------

// Master Filter & Sort Engine
function applyFiltersAndSort() {
    let result = [...currentCharacters];
    
    // 1. FILTERING (.filter)
    const minValStr = minFavInput.value;
    const maxValStr = maxFavInput.value;
    
    if (minValStr || maxValStr) {
        const minVal = minValStr ? parseInt(minValStr) : 0;
        const maxVal = maxValStr ? parseInt(maxValStr) : Infinity;
        
        result = result.filter(c => {
            const favs = c.favorites || 0;
            return favs >= minVal && favs <= maxVal;
        });
    }

    // 2. SORTING (.sort)
    const sortType = sortSelect.value;
    if (sortType === "favorites-desc") {
        result.sort((a, b) => b.favorites - a.favorites);
    } else if (sortType === "favorites-asc") {
        result.sort((a, b) => a.favorites - b.favorites);
    } else if (sortType === "name-asc") {
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    displayCharacters(result);
}

// Event Listeners for Filters
applyRangeBtn.addEventListener("click", () => {
    applyFiltersAndSort();
    resetBtn.classList.remove("hidden");
});

resetBtn.addEventListener("click", () => {
    sortSelect.value = "default";
    minFavInput.value = "";
    maxFavInput.value = "";
    applyFiltersAndSort();
    resetBtn.classList.add("hidden");
});

sortSelect.addEventListener("change", applyFiltersAndSort);

// 3. BUTTON INTERACTIONS & LOCAL STORAGE (.find)
window.toggleFavorite = (id) => {
    // Higher order block: `.find()` to locate the exact object
    const character = currentCharacters.find(c => c.mal_id === id);
    if(!character) return;

    const index = savedFavorites.indexOf(id);
    if (index === -1) {
        savedFavorites.push(id); // add to favorites
    } else {
        savedFavorites.splice(index, 1); // remove from favorites
    }

    localStorage.setItem('animeFavorites', JSON.stringify(savedFavorites));
    
    // Re-render currently sorted/filtered list to maintain UI matching state
    applyFiltersAndSort();
};


// ----------------------------------------------------
// OTHER INTERACTIONS
// ----------------------------------------------------

// Search Button
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) fetchCharacters(query);
});

// Enter Key Support
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

// 4. THEME TOGGLE
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    if(document.body.classList.contains("light-theme")) {
        themeToggle.innerText = "🌙";
    } else {
        themeToggle.innerText = "☀️";
    }
});