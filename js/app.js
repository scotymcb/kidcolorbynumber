// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const CONFIG = {
        maxImageDimension: 512, // px, smaller is faster
        paletteSize: 8,         // 4-12 is a good range
        undoStackLimit: 20,
        unsplashApiKey: '6UN57EEN9M9f_1K_8CVY8t2FYc4X1DLl1bNZPS7iNGE', // IMPORTANT: See README for security
        imageTraceOptions: {
            numberofcolors: 8, // This should match paletteSize
            ltres: 1,
            qtres: 1,
            pathomit: 8,
            mincolorratio: 0.02,
        }
    };
    CONFIG.imageTraceOptions.numberofcolors = CONFIG.paletteSize;

    // --- STATE ---
    let state = {
        currentPage: 'home', // 'home', 'editor', 'settings'
        currentProject: null, // The project object being edited
        selectedColorIndex: 0,
        undoStack: [],
        redoStack: [],
        isOnline: navigator.onLine,
    };

    // --- DOM ELEMENTS ---
    const pages = {
        home: document.getElementById('home-screen'),
        editor: document.getElementById('editor-screen'),
        settings: document.getElementById('settings-screen'),
    };
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');
    const savedProjectsContainer = document.getElementById('saved-projects');
    const sampleProjectsContainer = document.getElementById('sample-projects');
    const canvasContainer = document.getElementById('canvas-container');
    const paletteContainer = document.getElementById('palette');
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');
    const parentalGate = document.getElementById('parental-gate');
    
    // --- INITIALIZATION ---
    function init() {
        bindEventListeners();
        updateOnlineStatus();
        loadProjects();
        renderPage();
        checkOfflineQueue();
    }

    // --- PAGE & UI RENDERING ---
    function renderPage() {
        Object.values(pages).forEach(page => page.classList.remove('active'));
        pages[state.currentPage].classList.add('active');
    }

    function showLoading(text = 'Processing...') {
        loadingText.textContent = text;
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    async function loadProjects() {
        // Render sample projects
        sampleProjectsContainer.innerHTML = `
            <div class="project-card" data-sample="dinosaur">
                <img src="assets/images/sample-dinosaur.jpg" alt="Dinosaur">
                <p>Dinosaur</p>
            </div>
            <div class="project-card" data-sample="rocket">
                <img src="assets/images/sample-rocket.jpg" alt="Rocket">
                <p>Rocket</p>
            </div>
        `;

        // Render saved projects
        const projects = await getAllProjects();
        savedProjectsContainer.innerHTML = '';
        if (projects.length === 0) {
            savedProjectsContainer.innerHTML = `<p>Your saved projects will appear here!</p>`;
        } else {
            projects.forEach(p => {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.dataset.id = p.id;
                // Use a snapshot of the SVG as a thumbnail
                card.innerHTML = `<div class="thumbnail-svg">${p.progressSvg || p.template.svg}</div><p>${p.name}</p>`;
                savedProjectsContainer.appendChild(card);
            });
        }
    }

    function renderEditor() {
        const project = state.currentProject;
        document.getElementById('project-title').textContent = project.name;
        
        // Render SVG
        canvasContainer.innerHTML = project.progressSvg || project.template.svg;
        
        // Render Palette
        paletteContainer.innerHTML = '';
        project.template.palette.forEach((color, index) => {
            const el = document.createElement('div');
            el.className = 'palette-color';
            el.dataset.colorIndex = index;
            el.innerHTML = `
                <div class="color-swatch" style="background-color: ${color}"></div>
                <span class="color-number">${index + 1}</span>
            `;
            if (index === state.selectedColorIndex) {
                el.classList.add('selected');
            }
            paletteContainer.appendChild(el);
        });

        // Add event listeners to SVG paths
        canvasContainer.querySelectorAll('path').forEach(path => {
            path.addEventListener('click', handleRegionClick);
        });

        updateUndoRedoButtons();
    }
    
    // --- EVENT LISTENERS & HANDLERS ---
    function bindEventListeners() {
        // Navigation
        document.getElementById('back-to-home-button').addEventListener('click', () => openProject(null));
        
        // Home Screen Actions
        searchButton.addEventListener('click', handleSearch);
        uploadButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileUpload);
        sampleProjectsContainer.addEventListener('click', handleProjectCardClick);
        savedProjectsContainer.addEventListener('click', handleProjectCardClick);
        
        // Parental Gate
        document.getElementById('confirm-search-button').addEventListener('click', () => {
            parentalGate.classList.add('hidden');
            executeSearch(searchInput.value);
        });
        document.getElementById('cancel-search-button').addEventListener('click', () => parentalGate.classList.add('hidden'));

        // Editor
        paletteContainer.addEventListener('click', handlePaletteClick);
        undoButton.addEventListener('click', handleUndo);
        redoButton.addEventListener('click', handleRedo);
        document.getElementById('export-button').addEventListener('click', toggleExportOptions);
        document.getElementById('export-png-button').addEventListener('click', () => exportAs('png'));

        // Online/Offline status
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    }

    function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        parentalGate.classList.remove('hidden');
    }

    async function executeSearch(query) {
        if (!state.isOnline) {
            await queueOfflineRequest({ type: 'search', query });
            alert('You are offline. Your search for "' + query + '" has been saved and will run when you reconnect.');
            return;
        }

        showLoading(`Searching for "${query}"...`);
        try {
            const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=1`, {
                headers: { Authorization: `Client-ID ${CONFIG.unsplashApiKey}` }
            });
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                // Unsplash requires cors-enabled images. We need a proxy for canvas.
                // A simple trick is to use a free CORS proxy for development.
                const imageUrl = data.results[0].urls.regular;
                const proxyUrl = `https://cors-anywhere.herokuapp.com/${imageUrl}`;
                const imageBlob = await fetch(proxyUrl).then(res => res.blob());
                const reader = new FileReader();
                reader.onload = (e) => createNewProject(e.target.result, query);
                reader.readAsDataURL(imageBlob);
            } else {
                alert('No images found for "' + query + '"');
                hideLoading();
            }
        } catch (error) {
            console.error('Unsplash API error:', error);
            alert('Could not fetch image. The API might be down or the key is invalid.');
            hideLoading();
        }
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => createNewProject(e.target.result, file.name);
            reader.readAsDataURL(file);
        }
    }

    async function handleProjectCardClick(event) {
        const card = event.target.closest('.project-card');
        if (!card) return;

        if (card.dataset.id) {
            // Load existing project
            showLoading('Loading project...');
            const project = await getProject(card.dataset.id);
            hideLoading();
            if (project) {
                openProject(project);
            }
        } else if (card.dataset.sample) {
            // Create from sample
            const sampleName = card.dataset.sample;
            const imageUrl = `assets/images/sample-${sampleName}.jpg`;
            createNewProject(imageUrl, sampleName);
        }
    }

    function handleRegionClick(event) {
        const path = event.target;
        const currentColor = path.getAttribute('fill');
        const newColor = state.currentProject.template.palette[state.selectedColorIndex];

        if (currentColor !== newColor) {
            pushToUndoStack();
            path.setAttribute('fill', newColor);
            saveCurrentProgress();
        }
    }


    function handlePaletteClick(event) {
        const swatch = event.target.closest('.palette-color');
        if (swatch) {
            state.selectedColorIndex = parseInt(swatch.dataset.colorIndex, 10);
            renderEditor(); // Re-render to show selection
        }
    }

    // --- CORE LOGIC ---
    async function createNewProject(imageDataUrl, name) {
        showLoading('Processing image...');
        try {
            const template = await processImage(imageDataUrl, CONFIG);
            const project = {
                id: `proj_${new Date().getTime()}`,
                name: name.split('.')[0], // Remove file extension
                createdAt: new Date().toISOString(),
                template: template,
                progressSvg: null, // Initially no progress
            };
            await saveProject(project);
            await loadProjects(); // Refresh home screen list
            hideLoading();
            openProject(project);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Sorry, there was an error processing that image. Please try another one.');
            hideLoading();
        }
    }

    function openProject(project) {
        if (!project) {
            // Go back to home
            state.currentPage = 'home';
            state.currentProject = null;
        } else {
            state.currentPage = 'editor';
            state.currentProject = project;
            state.undoStack = [];
            state.redoStack = [];
            renderEditor();
        }
        renderPage();
    }
    
    function saveCurrentProgress() {
        if (!state.currentProject) return;
        const svgContent = canvasContainer.innerHTML;
        state.currentProject.progressSvg = svgContent;
        // Debounce saving? For this app, immediate save is fine.
        saveProject(state.currentProject);
    }
    
    // --- UNDO / REDO ---
    function pushToUndoStack() {
        const currentSvg = canvasContainer.innerHTML;
        state.undoStack.push(currentSvg);
        if (state.undoStack.length > CONFIG.undoStackLimit) {
            state.undoStack.shift(); // Keep stack size limited
        }
        state.redoStack = []; // Clear redo stack on new action
        updateUndoRedoButtons();
    }

    function handleUndo() {
        if (state.undoStack.length > 0) {
            const currentSvg = canvasContainer.innerHTML;
            state.redoStack.push(currentSvg);

            const lastState = state.undoStack.pop();
            canvasContainer.innerHTML = lastState;
            // Re-attach listeners after replacing innerHTML
            canvasContainer.querySelectorAll('path').forEach(path => {
                path.addEventListener('click', handleRegionClick);
            });
            saveCurrentProgress();
            updateUndoRedoButtons();
        }
    }

    function handleRedo() {
        if (state.redoStack.length > 0) {
            const currentSvg = canvasContainer.innerHTML;
            state.undoStack.push(currentSvg);

            const nextState = state.redoStack.pop();
            canvasContainer.innerHTML = nextState;
            // Re-attach listeners
            canvasContainer.querySelectorAll('path').forEach(path => {
                path.addEventListener('click', handleRegionClick);
            });
            saveCurrentProgress();
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        undoButton.disabled = state.undoStack.length === 0;
        redoButton.disabled = state.redoStack.length === 0;
    }

    // --- EXPORT ---
    function toggleExportOptions() {
        document.getElementById('export-options').classList.toggle('hidden');
    }

    function exportAs(format) {
        const svgElement = canvasContainer.querySelector('svg');
        const { width, height } = svgElement.getBBox();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL(`image/${format}`);
            const link = document.createElement('a');
            link.download = `${state.currentProject.name}.${format}`;
            link.href = dataUrl;
            link.click();
        };
        const svgString = new XMLSerializer().serializeToString(svgElement);
        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
        toggleExportOptions(); // Hide options after click
    }

    // --- OFFLINE HANDLING ---
    function updateOnlineStatus() {
        state.isOnline = navigator.onLine;
        document.body.classList.toggle('offline', !state.isOnline);
        if (state.isOnline) {
            checkOfflineQueue();
        }
    }

    async function checkOfflineQueue() {
        const requests = await getOfflineRequests();
        if (requests.length > 0) {
            if (confirm(`You have ${requests.length} saved search(es) from when you were offline. Run them now?`)) {
                showLoading('Syncing offline searches...');
                for (const req of requests) {
                    if (req.type === 'search') {
                        await executeSearch(req.query);
                    }
                }
                await clearOfflineRequests();
                hideLoading();
            }
        }
    }

    // --- START THE APP ---
    init();
});
