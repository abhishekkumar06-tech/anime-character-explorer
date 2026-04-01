const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const container = document.getElementById("characterContainer");
const loading = document.getElementById("loading");

// Fetch Characters
async function fetchCharacters(query) {
  try {
    loading.classList.remove("hidden");
    container.innerHTML = "";

    const response = await fetch(`https://api.jikan.moe/v4/characters?q=${query}`);
    const data = await response.json();

    displayCharacters(data.data);

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
    container.innerHTML = "<p>No results found</p>";
    return;
  }

  container.innerHTML = characters
    .map(character => `
      <div class="card">
        <img src="${character.images.jpg.image_url}" alt="${character.name}" />
        <h3>${character.name}</h3>
        <p>❤️ ${character.favorites}</p>
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