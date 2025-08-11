// js/db.js

// Configure localForage instances for different data types
const projectStore = localforage.createInstance({
    name: 'KidColorByNumber',
    storeName: 'projects' // Stores the main project data (SVG, palette, progress)
});

const settingsStore = localforage.createInstance({
    name: 'KidColorByNumber',
    storeName: 'settings' // Stores user settings
});

const offlineStore = localforage.createInstance({
    name: 'KidColorByNumber',
    storeName: 'offlineQueue' // Stores requests made while offline
});

// --- Project Methods ---
async function saveProject(project) {
    if (!project.id) {
        console.error('Project must have an ID to be saved.');
        return;
    }
    return projectStore.setItem(project.id, project);
}

async function getProject(id) {
    return projectStore.getItem(id);
}

async function getAllProjects() {
    const projects = [];
    await projectStore.iterate((value, key) => {
        projects.push(value);
    });
    return projects;
}

async function deleteProject(id) {
    return projectStore.removeItem(id);
}

// --- Settings Methods ---
async function saveSetting(key, value) {
    return settingsStore.setItem(key, value);
}

async function getSetting(key) {
    return settingsStore.getItem(key);
}

// --- Offline Queue Methods ---
async function queueOfflineRequest(request) {
    const id = `req_${new Date().getTime()}`;
    return offlineStore.setItem(id, request);
}

async function getOfflineRequests() {
    const requests = [];
    await offlineStore.iterate(value => {
        requests.push(value);
    });
    return requests;
}

async function clearOfflineRequests() {
    return offlineStore.clear();
}
