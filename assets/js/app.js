// Configuration
const API_KEY = '901666d4'; // Replace with your actual OMDB API key
const BASE_URL = 'https://www.omdbapi.com/';

// Popular movie IMDb IDs for the top-rated section
const TOP_RATED_MOVIES = [
    'tt0111161', // The Shawshank Redemption
    'tt0068646', // The Godfather
    'tt0071562', // The Godfather Part II
    'tt0468569', // The Dark Knight
    'tt0050083', // 12 Angry Men
    'tt0108052', // Schindler's List
    'tt0167260', // The Lord of the Rings: The Return of the King
    'tt0110912', // Pulp Fiction
    'tt0060196', // The Good, the Bad and the Ugly
    'tt0137523', // Fight Club
    'tt0120737', // The Lord of the Rings: The Fellowship of the Ring
    'tt0109830'  // Forrest Gump
];


const DISCOVERY_KEYWORDS = [
    'adventure', 'comedy', 'drama', 'action', 'thriller', 'romance', 'horror',
    'mystery', 'fantasy', 'superhero', 'space', 'war', 'crime', 'family',
    'hero', 'love', 'journey', 'magic', 'friendship', 'courage'
];


function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.add('hidden'));
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove('hidden');
    
    // Update nav active state
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('text-primary', 'font-semibold'));
    event?.target?.classList.add('text-primary', 'font-semibold');
    
    // Load section-specific content
    if (sectionName === 'top-rated') {
        loadTopRatedMovies();
    }
}

function createMovieCard(movie, isDetailed = false) {
    const poster = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
    
    if (isDetailed) {
        return `
            <div class="bg-gray-700 rounded-lg overflow-hidden">
                <div class="md:flex">
                    <img src="${poster}" alt="${movie.Title}" class="w-full md:w-64 h-96 object-cover">
                    <div class="p-6 flex-1">
                        <h3 class="text-2xl font-bold mb-2">${movie.Title}</h3>
                        <div class="space-y-2 text-sm">
                            <p><span class="text-gray-400">Year:</span> ${movie.Year}</p>
                            <p><span class="text-gray-400">Genre:</span> ${movie.Genre || 'N/A'}</p>
                            <p><span class="text-gray-400">Director:</span> ${movie.Director || 'N/A'}</p>
                            <p><span class="text-gray-400">Rating:</span> 
                                <span class="text-accent font-semibold">${movie.imdbRating || 'N/A'}</span>
                            </p>
                        </div>
                        <p class="text-gray-300 mt-4 line-clamp-3">${movie.Plot || 'No plot available.'}</p>
                        <button onclick="showMovieDetails('${movie.imdbID}')" 
                                class="mt-4 bg-primary hover:bg-blue-600 px-4 py-2 rounded transition-colors">
                            View Full Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 cursor-pointer"
             onclick="showMovieDetails('${movie.imdbID}')">
            <img src="${poster}" alt="${movie.Title}" class="w-full h-64 object-cover">
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-2 line-clamp-2">${movie.Title}</h3>
                <p class="text-gray-400 text-sm">${movie.Year}</p>
                ${movie.imdbRating ? `<div class="flex items-center mt-2">
                    <i class="fas fa-star text-accent mr-1"></i>
                    <span class="text-sm font-medium">${movie.imdbRating}</span>
                </div>` : ''}
            </div>
        </div>
    `;
}

// API Functions
async function fetchMovie(params) {
    const url = `${BASE_URL}?apikey=${API_KEY}&${params}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.Response === 'False') {
            throw new Error(data.Error);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function searchMovies(title, page = 1) {
    return await fetchMovie(`s=${encodeURIComponent(title)}&page=${page}`);
}

async function getMovieDetails(imdbId) {
    return await fetchMovie(`i=${imdbId}&plot=full`);
}

// Search Functions
async function quickSearch() {
    const query = document.getElementById('quick-search').value.trim();
    if (!query) return;
    
    showLoading();
    try {
        const results = await searchMovies(query);
        displayQuickResults(results.Search || []);
    } catch (error) {
        showError('Search failed. Please check your API key and try again.');
    } finally {
        hideLoading();
    }
}

async function advancedSearch() {
    const titleQuery = document.getElementById('title-search').value.trim();
    const keywordQuery = document.getElementById('keyword-search').value.trim();
    const imdbId = document.getElementById('imdb-search').value.trim();
    
    if (!titleQuery && !keywordQuery && !imdbId) {
        showError('Please enter a search term.');
        return;
    }
    
    showLoading();
    try {
        let results = [];
        
        if (imdbId) {
            const movie = await getMovieDetails(imdbId);
            results = [movie];
        } else {
            const searchQuery = titleQuery || keywordQuery;
            const searchResults = await searchMovies(searchQuery);
            results = searchResults.Search || [];
        }
        
        displaySearchResults(results);
    } catch (error) {
        showError('Search failed. Please check your input and API key.');
    } finally {
        hideLoading();
    }
}

// Discovery Functions
async function discoverRandomMovie() {
    showLoading();
    try {
        // Use a random keyword to discover movies
        const randomKeyword = DISCOVERY_KEYWORDS[Math.floor(Math.random() * DISCOVERY_KEYWORDS.length)];
        const searchResults = await searchMovies(randomKeyword);
        
        if (searchResults.Search && searchResults.Search.length > 0) {
            // Pick a random movie from the results
            const randomMovie = searchResults.Search[Math.floor(Math.random() * searchResults.Search.length)];
            
            // Get detailed information about the movie
            const movieDetails = await getMovieDetails(randomMovie.imdbID);
            displayRandomMovieResult(movieDetails);
        } else {
            showError('No movies found. Try again!');
        }
    } catch (error) {
        showError('Discovery failed. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display Functions
function displayQuickResults(movies) {
    const resultsDiv = document.getElementById('quick-results');
    const gridDiv = document.getElementById('quick-results-grid');
    
    if (movies.length === 0) {
        resultsDiv.classList.add('hidden');
        showError('No movies found.');
        return;
    }
    
    gridDiv.innerHTML = movies.slice(0, 8).map(movie => createMovieCard(movie)).join('');
    resultsDiv.classList.remove('hidden');
}

function displaySearchResults(movies) {
    const resultsDiv = document.getElementById('search-results');
    const gridDiv = document.getElementById('search-results-grid');
    const countDiv = document.getElementById('results-count');
    
    if (movies.length === 0) {
        resultsDiv.classList.add('hidden');
        showError('No movies found.');
        return;
    }
    
    gridDiv.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    countDiv.textContent = `${movies.length} result${movies.length !== 1 ? 's' : ''} found`;
    resultsDiv.classList.remove('hidden');
}

function displayRandomMovieResult(movie) {
    const resultDiv = document.getElementById('random-movie-result');
    resultDiv.innerHTML = createMovieCard(movie, true);
    resultDiv.classList.remove('hidden');
}

async function loadTopRatedMovies() {
    const gridDiv = document.getElementById('top-rated-grid');
    
    // Show loading placeholder
    gridDiv.innerHTML = Array(8).fill(0).map(() => `
        <div class="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
            <div class="w-full h-64 bg-gray-700"></div>
            <div class="p-4">
                <div class="h-4 bg-gray-700 rounded mb-2"></div>
                <div class="h-3 bg-gray-700 rounded w-16"></div>
            </div>
        </div>
    `).join('');
    
    try {
        const moviePromises = TOP_RATED_MOVIES.slice(0, 8).map(imdbId => getMovieDetails(imdbId));
        const movies = await Promise.all(moviePromises);
        
        gridDiv.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    } catch (error) {
        gridDiv.innerHTML = '<div class="col-span-full text-center text-gray-400">Failed to load top rated movies.</div>';
    }
}

// Movie Details Modal
async function showMovieDetails(imdbId) {
    showLoading();
    try {
        const movie = await getMovieDetails(imdbId);
        displayMovieDetailsModal(movie);
    } catch (error) {
        showError('Failed to load movie details.');
    } finally {
        hideLoading();
    }
}

function displayMovieDetailsModal(movie) {
    const modal = document.getElementById('movie-modal');
    const content = document.getElementById('movie-details-content');
    
    const poster = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/400x600?text=No+Poster';
    
    content.innerHTML = `
        <div class="md:flex gap-8">
            <div class="md:w-1/3 mb-6 md:mb-0">
                <img src="${poster}" alt="${movie.Title}" class="w-full rounded-lg shadow-lg">
            </div>
            <div class="md:w-2/3">
                <h2 class="text-3xl font-bold mb-4">${movie.Title}</h2>
                
                <div class="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <h3 class="font-semibold text-primary mb-2">Basic Information</h3>
                        <div class="space-y-2 text-sm">
                            <p><span class="text-gray-400">Year:</span> ${movie.Year}</p>
                            <p><span class="text-gray-400">Runtime:</span> ${movie.Runtime || 'N/A'}</p>
                            <p><span class="text-gray-400">Genre:</span> ${movie.Genre || 'N/A'}</p>
                            <p><span class="text-gray-400">Language:</span> ${movie.Language || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 class="font-semibold text-primary mb-2">Ratings</h3>
                        <div class="space-y-2 text-sm">
                            <p><span class="text-gray-400">IMDb:</span> 
                                <span class="text-accent font-semibold">${movie.imdbRating || 'N/A'}</span>
                            </p>
                            <p><span class="text-gray-400">Votes:</span> ${movie.imdbVotes || 'N/A'}</p>
                            <p><span class="text-gray-400">Rated:</span> ${movie.Rated || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h3 class="font-semibold text-primary mb-2">Cast & Crew</h3>
                    <div class="space-y-2 text-sm">
                        <p><span class="text-gray-400">Director:</span> ${movie.Director || 'N/A'}</p>
                        <p><span class="text-gray-400">Writer:</span> ${movie.Writer || 'N/A'}</p>
                        <p><span class="text-gray-400">Actors:</span> ${movie.Actors || 'N/A'}</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h3 class="font-semibold text-primary mb-2">Plot</h3>
                    <p class="text-gray-300 leading-relaxed">${movie.Plot || 'No plot available.'}</p>
                </div>
                
                ${movie.Awards && movie.Awards !== 'N/A' ? `
                <div class="mb-6">
                    <h3 class="font-semibold text-primary mb-2">Awards</h3>
                    <p class="text-sm text-gray-300">${movie.Awards}</p>
                </div>
                ` : ''}
                
                <div class="flex items-center space-x-4">
                    <button onclick="closeModal()" 
                            class="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded transition-colors">
                        Close
                    </button>
                    ${movie.imdbID ? `
                    <a href="https://www.imdb.com/title/${movie.imdbID}" target="_blank"
                       class="bg-accent hover:bg-yellow-600 px-6 py-2 rounded transition-colors inline-block">
                        View on IMDb
                    </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('movie-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Error Handling
function showError(message) {
    
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if API key is set
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please set your OMDB API key in the script.js file. Get a free key at omdbapi.com');
    }
    
    // Add enter key support for search inputs
    const searchInputs = ['quick-search', 'title-search', 'keyword-search', 'imdb-search'];
    searchInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    if (inputId === 'quick-search') {
                        quickSearch();
                    } else {
                        advancedSearch();
                    }
                }
            });
        }
    });
    
    // Close modal when clicking outside
    document.getElementById('movie-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Load top rated movies on initial load
    loadTopRatedMovies();
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});