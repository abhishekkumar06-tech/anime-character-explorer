const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const container = document.getElementById("characterContainer");
const loading = document.getElementById("loading");

// Fetch Characters
async function fetchCharacters(query) {
  try {
    loading.classList.remove("hidden");
    container.innerHTML = "";

    const response = await fetch(`https://api.jikan.moe/v4/characters?q=${query}&order_by=favorites&sort=desc`);
    const data = await response.json();

    displayCharacters(data.data.slice(0, 15)); // Limit to top 15 results

  } catch (error) {
    container.innerHTML = "<p>Error fetching data</p>";
    console.error(error);
  } finally {
    loading.classList.add("hidden");
  }
}

// Display Characters using map()
function displayCharacters(characters) {
  if (!characters.length) {
    container.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--text-secondary);'>No results found for this search.</p>";
    return;
  }

  container.innerHTML = characters
    .map(character => `
      <div class="card">
        <div class="image-container">
            <img src="${character.images.jpg.image_url}" alt="${character.name}" loading="lazy" />
        </div>
        <div class="card-content">
            <h3>${character.name}</h3>
            <div class="badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                ${character.favorites ? character.favorites.toLocaleString() : '0'}
            </div>
        </div>
      </div>
    `)
    .join("");
}

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