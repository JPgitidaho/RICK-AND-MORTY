document.addEventListener('DOMContentLoaded', () => {
  // Modo oscuro
  const darkModeToggle = document.getElementById('darkModeToggle');
  const html = document.documentElement;

  function updateDarkModeIcon() {
    darkModeToggle.textContent = html.classList.contains('dark') ? '☀️' : '🌙';
  }

  updateDarkModeIcon();

  darkModeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    updateDarkModeIcon();
  });

  // Toggle menú hamburguesa 
  const btnToggle = document.getElementById('btnHamburger');
  const mobileMenu = document.getElementById('navbar-dropdown');

  if (btnToggle && mobileMenu) {
    btnToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  const API_URL = 'https://rickandmortyapi.com/api/character';
  let currentPage = 1;
  let filters = { species: '', status: '', gender: '' };

  async function fetchCharacters(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) throw new Error('Error al cargar personajes');
    const data = await res.json();
    return data;
  }

  function createCard(character, filtersApplied) {
    const wrapper = document.createElement('div');
    wrapper.className = 'perspective w-full max-w-2xl h-64';

    const card = document.createElement('div');
    card.className = 'card-3d w-full h-full';

    // Cara frontal con tu estilo original
    const front = document.createElement('div');
    front.className = `
  card-face card-front flex rounded-lg shadow-md overflow-hidden
  bg-gradient-to-r via-green-200 to-blue-400
  dark:via-gray-700 dark:to-gray-900
`;
    front.innerHTML = `
    <img src="${character.image}" alt="${character.name}" class="w-1/2 h-full object-cover">
    <div class="p-4 flex flex-col justify-center">
      <h2 class="text-xl font-bold mb-1">${character.name}</h2>
      <p class="text-gray-600 dark:text-gray-300">ID: ${character.id}</p>
      ${filtersApplied.length ? `<p class="text-sm text-blue-600 dark:text-blue-400 mt-1">${filtersApplied.join(', ')}</p>` : ''}
    </div>
  `;

    // Cara trasera con más info
    const back = document.createElement('div');
    back.className = 'card-face card-back bg-white dark:bg-gray-800 text-gray-100 dark:text-white p-4 flex flex-col justify-center rounded-lg';
    back.innerHTML = `
    <h2 class="text-xl font-semibold mb-2">${character.name}</h2>
    <p><strong>Especie:</strong> ${character.species}</p>
    <p><strong>Estado:</strong> ${character.status}</p>
    <p><strong>Género:</strong> ${character.gender}</p>
    <p><strong>Origen:</strong> ${character.origin.name}</p>
    <p><strong>Ubicación:</strong> ${character.location.name}</p>
  `;

    card.append(front, back);
    wrapper.append(card);

    card.addEventListener('click', () => {
      card.classList.toggle('card-flip-float');
    });

    return wrapper;
  }

  function renderCharacters(characters) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    const limitedCharacters = characters.slice(0, 6);
    limitedCharacters.forEach(char => {
      const applied = [];
      if (filters.species) applied.push(`Especie: ${filters.species}`);
      if (filters.status) applied.push(`Estado: ${filters.status}`);
      if (filters.gender) applied.push(`Género: ${filters.gender}`);
      container.appendChild(createCard(char, applied));
    });
  }
function renderSkeletons() {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = `
      w-full max-w-2xl h-64 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex  mb-4
    `;

    skeleton.innerHTML = `
      <div class="w-1/2 h-full bg-gray-300 dark:bg-gray-700"></div>
      <div class="p-4 w-1/2 flex flex-col justify-center space-y-3">
        <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    `;

    container.appendChild(skeleton);
  }
}


async function loadCharacters() {
  try {
    renderSkeletons(); 
    const data = await fetchCharacters(currentPage, filters);
    renderCharacters(data.results);
    updatePagination(data.info);
  } catch (err) {
    console.error(err);
    document.getElementById('cards-container').innerHTML = '<p class="text-red-500">No se encontraron personajes.</p>';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
  }
}


  function updatePagination(info) {
    document.getElementById('prevBtn').disabled = !info.prev;
    document.getElementById('nextBtn').disabled = !info.next;
  }

  function setupEvents() {
    document.getElementById('prevBtn').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadCharacters();
      }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      if (!document.getElementById('nextBtn').disabled) {
        currentPage++;
        loadCharacters();
      }
    });

    ['species', 'status', 'gender'].forEach(key => {
      // Filtro escritorio
      const dropdown = document.getElementById(`${key}Dropdown`);
      if (dropdown) {
        dropdown.addEventListener('change', e => {
          filters[key] = e.target.value;
          currentPage = 1;
          loadCharacters();
        });
      }

      // Filtro móvil (por clase)
      const mobileDropdowns = document.querySelectorAll(`.mobile-filter.${key}`);
      mobileDropdowns.forEach(mobileDropdown => {
        mobileDropdown.addEventListener('change', e => {
          filters[key] = e.target.value;
          currentPage = 1;
          loadCharacters();

          if (window.innerWidth < 768) {
            mobileMenu.classList.add('hidden');
          }
        });
      });
    });
  }

  async function loadFilterOptions() {
    try {
      const speciesSet = new Set();
      const statusSet = new Set();
      const genderSet = new Set();

      let nextUrl = API_URL;
      while (nextUrl) {
        const res = await fetch(nextUrl);
        const data = await res.json();
        data.results.forEach(char => {
          if (char.species) speciesSet.add(char.species);
          if (char.status) statusSet.add(char.status);
          if (char.gender) genderSet.add(char.gender);
        });
        nextUrl = data.info.next;
      }

      fillDropdown('speciesDropdown', [...speciesSet]);
      fillDropdown('statusDropdown', [...statusSet]);
      fillDropdown('genderDropdown', [...genderSet]);
    } catch (error) {
      console.error('Error al cargar filtros:', error);
    }
  }

  function fillDropdown(id, options) {
    // Llenar el select principal (por ID)
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.innerHTML = `<option value="" >TODOS</option>`;
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        dropdown.appendChild(option);
      });
    }

    // Obtener la clave para filtrar selects móviles por clase
    const key = id.replace('Dropdown', '');
    const mobileDropdowns = document.querySelectorAll(`.mobile-filter.${key}`);
    mobileDropdowns.forEach(mobileDropdown => {
      mobileDropdown.innerHTML = `<option value="">TODOS</option>`;
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        mobileDropdown.appendChild(option.cloneNode(true));
      });
    });
  }

  // Inicialización
  loadFilterOptions();
  loadCharacters();
  setupEvents();
});
