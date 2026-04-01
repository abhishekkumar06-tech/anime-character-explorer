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