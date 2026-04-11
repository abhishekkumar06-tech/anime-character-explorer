// DOM Elements
const grid = document.getElementById('character-grid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const themeToggle = document.getElementById('theme-toggle');
const moonIcon = document.getElementById('moon-icon');
const sunIcon = document.getElementById('sun-icon');
const navExplore = document.getElementById('nav-explore');
const navFavourites = document.getElementById('nav-favourites');

// State
let charactersData = [];
let debounceTimer;
let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
let currentMode = 'explore'; // 'explore' or 'favourites'

// Theme Initialization
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark');
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
  } else {
    document.body.classList.remove('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  
  if (isDark) {
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
    localStorage.setItem('theme', 'dark');
  } else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
    localStorage.setItem('theme', 'light');
  }
});

// Fetch Characters
async function fetchCharacters(query = '') {
  showLoading(true);
  noResults.classList.add('hidden');
  
  try {
    // If no query, fetch top characters by favorites
    const url = query 
      ? `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=25`
      : `https://api.jikan.moe/v4/characters?order_by=favorites&sort=desc&limit=25`;
      
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const data = await response.json();
    charactersData = data.data; // Cache the data
    
    if (currentMode === 'explore') {
      applyFiltersAndSort(); // Triggers render
    } else {
      showLoading(false); // Make sure loader is removed if they search while in favourites
    }
    
  } catch (error) {
    console.error('Error fetching characters:', error);
    grid.innerHTML = `<div class="alert-msg">Failed to load characters. Please try again later.</div>`;
  } finally {
    if (currentMode === 'explore') showLoading(false);
  }
}

// Display logic
function showLoading(isLoading) {
  if (isLoading) {
    grid.innerHTML = '';
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

function renderCharacters(items) {
  grid.innerHTML = '';
  
  if (!items || items.length === 0) {
    noResults.classList.remove('hidden');
    if (currentMode === 'favourites') {
      noResults.innerHTML = '<p>You have no favourite characters yet.</p>';
    } else {
      noResults.innerHTML = '<p>No characters found! Try searching for another name.</p>';
    }
    return;
  }
  
  noResults.classList.add('hidden');
  
  items.forEach(char => {
    // Safely get image (some might not have one)
    const imgUrl = char.images?.jpg?.image_url;
    const hasImage = imgUrl && !imgUrl.includes('questionmark');
    
    const isLiked = favourites.some(f => f.mal_id === char.mal_id);
    
    const card = document.createElement('div');
    card.className = 'character-card';
    
    card.innerHTML = `
      <div class="card-image-wrapper">
        ${hasImage 
          ? `<img src="${imgUrl}" alt="${char.name}" class="card-image" loading="lazy">` 
          : `<svg class="placeholder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
        }
      </div>
      <div class="card-content">
        <h3 class="char-title">
          <a href="${char.url}" target="_blank" rel="noopener noreferrer">${char.name}</a>
        </h3>
        ${char.name_kanji ? `<p class="char-name-jp">${char.name_kanji}</p>` : ''}
        
        <div class="char-stats">
          <div class="fav-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            ${char.favorites ? char.favorites.toLocaleString() : '0'}
          </div>
          
          <button class="like-btn ${isLiked ? 'liked' : ''}" aria-label="Favourite">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
        </div>
      </div>
    `;
    
    // Bind the like functionality
    const likeBtn = card.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => {
      toggleFavourite(char, likeBtn);
    });

    grid.appendChild(card);
  });
}

function toggleFavourite(char, btnElement) {
  const index = favourites.findIndex(f => f.mal_id === char.mal_id);
  if (index === -1) {
    favourites.push(char);
    btnElement.classList.add('liked');
  } else {
    favourites.splice(index, 1);
    btnElement.classList.remove('liked');
  }
  
  localStorage.setItem('favourites', JSON.stringify(favourites));
  
  // Immediately refresh if we are currently looking at favourites mode
  if (currentMode === 'favourites') {
    applyFiltersAndSort();
  }
}

// Processing Data (Filter + Sort)
function applyFiltersAndSort() {
  let baseData = currentMode === 'explore' ? charactersData : favourites;
  let processedData = [...baseData];
  
  // 1. Implicitly filter out characters without images for a cleaner UI
  processedData = processedData.filter(char => {
    const img = char.images?.jpg?.image_url;
    return img && !img.includes('questionmark');
  });
  
  // 2. Sort
  const sortVal = sortSelect.value;
  processedData.sort((a, b) => {
    // If exploring, default favorites property doesn't always exist perfectly from API so we handle it gracefully like above.
    const favA = a.favorites || 0;
    const favB = b.favorites || 0;
    
    switch(sortVal) {
      case 'pop-desc':
        return favB - favA;
      case 'pop-asc':
        return favA - favB;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  renderCharacters(processedData);
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();
  
  // If the user searches but they are currently looking at Favourites, auto-switch to explore mode
  if (currentMode === 'favourites' && query.length > 0) {
    currentMode = 'explore';
    navExplore.classList.add('active');
    navFavourites.classList.remove('active');
  }
  
  debounceTimer = setTimeout(() => {
    fetchCharacters(query);
  }, 500); // 500ms debounce
});

sortSelect.addEventListener('change', applyFiltersAndSort);

navExplore.addEventListener('click', (e) => {
  e.preventDefault();
  currentMode = 'explore';
  navExplore.classList.add('active');
  navFavourites.classList.remove('active');
  showLoading(false);
  applyFiltersAndSort();
});

navFavourites.addEventListener('click', (e) => {
  e.preventDefault();
  currentMode = 'favourites';
  navFavourites.classList.add('active');
  navExplore.classList.remove('active');
  showLoading(false); // remove any stuck loaders from explore fetches
  applyFiltersAndSort();
});

// App execution
initTheme();
fetchCharacters(); // Load defaults on start