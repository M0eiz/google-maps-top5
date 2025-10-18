// Your Google Maps API key
const apiKey = "AIzaSyBF0avc-YS9d9KIcEDkNcollHRi44T9GxU";

let map;
let placesService;
let markers = [];
let activeCard = null;

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const resultsContainer = document.getElementById('results-container');
const loadingOverlay = document.getElementById('loading-overlay');

/**
 * Initialize Google Map
 */
function initMap() {
    const defaultCenter = { lat: 39.8283, lng: -98.5795 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultCenter,
        zoom: 4,
        mapId: 'DEMO_MAP_ID'
    });

    placesService = new google.maps.places.PlacesService(map);

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) performSearch(query);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) performSearch(query);
        }
    });
}

/**
 * Perform Google Places Text Search
 */
function performSearch(query) {
    clearResults();
    showLoading(true);

    const request = {
        query: query,
        fields: ['name', 'geometry', 'formatted_address', 'rating', 'user_ratings_total', 'types', 'business_status'],
        bounds: map.getBounds() || map.getCenter()
    };

    placesService.textSearch(request, (results, status) => {
        showLoading(false);

        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const top5 = results.slice(0, 5);
            if (top5.length === 0) {
                showNoResults();
                return;
            }

            const bounds = new google.maps.LatLngBounds();
            top5.forEach(p => bounds.extend(p.geometry.location));
            map.fitBounds(bounds);

            top5.forEach((place, i) => {
                createMarker(place, i + 1);
                createCard(place, i + 1);
            });
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            showNoResults();
        } else {
            resultsContainer.innerHTML = `<p class="text-center text-red-500">Places API Error: ${status}</p>`;
            console.error('Places API Error:', status);
        }
    });
}

/**
 * Create custom marker
 */
function createMarker(place, index) {
    if (!place.geometry || !place.geometry.location) return;

    const markerIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="16" fill="#ef4444"/>
                <circle cx="20" cy="20" r="13" fill="#ffffff"/>
                <circle cx="20" cy="20" r="12" fill="#ef4444"/>
                <text x="20" y="24" font-family="Arial" font-size="16" fill="#ffffff" text-anchor="middle" alignment-baseline="middle" font-weight="bold">${index}</text>
            </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40)
    };

    const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
        title: place.name,
        icon: markerIcon
    });

    marker.placeIndex = index;
    markers.push(marker);
    marker.addListener("click", () => focusResult(index));
}

/**
 * Create and display result card
 */
function createCard(place, index) {
    const card = document.createElement('div');
    card.className = `place-card p-4 bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition duration-300 ease-in-out`;
    card.dataset.index = index;
    card.id = `card-${index}`;

    const types = (place.types || [])
        .slice(0, 1)
        .map(t => `<span class="capitalize">${t.replace(/_/g, ' ')}</span>`)
        .join(' • ');

    const rating = place.rating
        ? `<span class="font-bold text-yellow-600">${place.rating}</span> (${place.user_ratings_total || 0})`
        : 'No rating';

    const status = place.business_status === 'OPERATIONAL'
        ? `<span class="text-green-600">Open now</span>`
        : `<span class="text-red-600">${place.business_status ? place.business_status.replace(/_/g, ' ') : 'Status unknown'}</span>`;

    card.innerHTML = `
        <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-500 text-white font-bold rounded-full text-lg shadow-md">
                ${index}
            </div>
            <div class="min-w-0 flex-1">
                <h2 class="text-lg font-semibold text-gray-800 truncate">${place.name}</h2>
                <p class="text-sm text-gray-500">${place.formatted_address}</p>
                <div class="flex flex-wrap items-center text-sm mt-2 text-gray-600 space-x-2">
                    <span class="bg-gray-100 px-2 py-0.5 rounded-full text-xs">${types}</span>
                    ${rating ? `<span>${rating}</span>` : ''}
                    <span>•</span>
                    ${status}
                </div>
            </div>
        </div>
    `;

    card.addEventListener('click', () => focusResult(index));
    resultsContainer.appendChild(card);
}

/**
 * Focus map + highlight card
 */
function focusResult(index) {
    const marker = markers.find(m => m.placeIndex === index);
    const card = document.getElementById(`card-${index}`);

    if (marker) {
        map.panTo(marker.getPosition());
        map.setZoom(map.getZoom() < 12 ? 12 : map.getZoom());

        if (activeCard) activeCard.classList.remove('active', 'ring-2', 'ring-blue-500', 'ring-offset-2');
        if (card) {
            card.classList.add('active', 'ring-2', 'ring-blue-500', 'ring-offset-2');
            activeCard = card;
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

/**
 * Helpers
 */
function clearResults() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    resultsContainer.innerHTML = '';
    activeCard = null;
}

function showLoading(visible) {
    loadingOverlay.style.display = visible ? 'flex' : 'none';
}

function showNoResults() {
    resultsContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No places found for this search.</p>';
}
