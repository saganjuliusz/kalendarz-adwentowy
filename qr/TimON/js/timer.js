const display = document.getElementById('display');
const startStopBtn = document.getElementById('startStop');
const splitBtn = document.getElementById('split');
const resetBtn = document.getElementById('reset');
const splitTimesDiv = document.getElementById('splitTimes');
const container = document.querySelector('.container');
const tabsContainer = document.getElementById('tabs-container');
const addTabBtn = document.getElementById('add-tab');

// Przechowujemy aktywną zakładkę lokalnie
let activeTabId = localStorage.getItem('activeTabId') || 'tab1';

let timerData = {
    tabs: [{
        id: 'tab1',
        name: 'Timer 1',
        isRunning: false,
        startTime: 0,
        elapsedTime: 0,
        splits: []
    }],
    activeTab: 'tab1' // To pole będzie ignorowane, używamy lokalnego activeTabId
};

// Zmienne dla lokalnego timera, gdy serwer nie odpowiada
let localTimerRunning = false;
let localTimerStart = 0;
let localTimerElapsed = 0;
let lastUpdateTime = Date.now();

let isUpdating = false;
let failedRequests = 0;
const MAX_FAILED_REQUESTS = 3;
let updateInterval = 500; // Zwiększone do 500ms aby zmniejszyć obciążenie serwera

// Dodane - efekt kliknięcia przycisku
function addButtonClickEffect(button) {
    button.addEventListener('mousedown', () => {
        button.classList.add('button-clicked');
    });
    
    button.addEventListener('mouseup', () => {
        button.classList.remove('button-clicked');
    });
    
    button.addEventListener('mouseleave', () => {
        button.classList.remove('button-clicked');
    });
}

// Usuwam niepotrzebne efekty przewijania
function initializeEffects() {
    // Efekty dla przycisków
    addButtonClickEffect(startStopBtn);
    addButtonClickEffect(splitBtn);
    addButtonClickEffect(resetBtn);
    addButtonClickEffect(addTabBtn);
    
    // Usuwam niepożądany efekt przewijania zakładek, który powodował problemy
    /* const tabsWrapper = document.querySelector('.tabs-wrapper');
    if (tabsWrapper) {
        tabsWrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            tabsWrapper.scrollLeft += e.deltaY;
        });
    } */
}

function updateTimerData() {
    // Aktualizuj lokalny timer
    updateLocalTimer();
    
    if (isUpdating) return;
    isUpdating = true;
    
    fetch('timer.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Błąd odpowiedzi serwera');
            }
            return response.json();
        })
        .then(data => {
            // Zachowaj lokalne nazwy przed aktualizacją
            const localTabs = timerData.tabs.reduce((acc, tab) => {
                acc[tab.id] = {
                    name: tab.name,
                    splits: tab.splits.map(split => ({ ...split }))
                };
                return acc;
            }, {});
            
            // Aktualizuj dane z serwera
            timerData.tabs = data.tabs.map(tab => {
                // Jeśli mamy lokalne dane dla tej zakładki, zachowaj nazwę i nazwy międzyczasów
                if (localTabs[tab.id]) {
                    return {
                        ...tab,
                        name: localTabs[tab.id].name,
                        splits: tab.splits.map((split, index) => ({
                            ...split,
                            name: localTabs[tab.id].splits[index]?.name || split.name
                        }))
                    };
                }
                return tab;
            });
            
            // Sprawdź czy aktywna zakładka nadal istnieje
            const activeTabExists = timerData.tabs.some(tab => tab.id === activeTabId);
            if (!activeTabExists && timerData.tabs.length > 0) {
                activeTabId = timerData.tabs[0].id;
                localStorage.setItem('activeTabId', activeTabId);
            }
            
            // Sprawdź stan running
            const activeTabIndex = findActiveTabIndex();
            if (activeTabIndex !== -1) {
                const serverTab = timerData.tabs[activeTabIndex];
                const wasRunning = localTimerRunning;
                
                syncLocalTimerWithServer();
                
                if (wasRunning !== serverTab.isRunning) {
                    updateBackground();
                }
            }
            
            // Aktualizuj interfejs
            updateDisplay();
            updateSplits();
            updateButtons();
            updateTabs();
            
            failedRequests = 0;
            lastUpdateTime = Date.now();
        })
        .catch(error => {
            console.error('Błąd pobierania danych:', error);
            failedRequests++;
            
            if (failedRequests > MAX_FAILED_REQUESTS) {
                clearInterval(timerUpdateInterval);
                updateInterval = Math.min(updateInterval * 2, 2000);
                console.log(`Zwiększono interwał odświeżania do ${updateInterval}ms`);
                timerUpdateInterval = setInterval(updateTimerData, updateInterval);
            }
            
            updateDisplay();
            updateButtons();
        })
        .finally(() => {
            isUpdating = false;
        });
}

function updateLocalTimer() {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1) return;
    
    const now = Date.now();
    const activeTab = timerData.tabs[activeTabIndex];
    
    // Jeśli timer jest uruchomiony, aktualizuj czas lokalnie
    if (activeTab.isRunning) {
        const elapsed = now - lastUpdateTime;
        localTimerElapsed = activeTab.elapsedTime + (now - activeTab.startTime);
        localTimerRunning = true;
        localTimerStart = activeTab.startTime;
    } else {
        localTimerElapsed = activeTab.elapsedTime;
        localTimerRunning = false;
    }
    
    lastUpdateTime = now;
}

function syncLocalTimerWithServer() {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1) return;
    
    const activeTab = timerData.tabs[activeTabIndex];
    localTimerRunning = activeTab.isRunning;
    localTimerStart = activeTab.startTime;
    localTimerElapsed = activeTab.elapsedTime;
}

function applyLocalAction(action, additionalData = {}) {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1 && action !== 'switchTab') return;
    
    const now = Date.now();
    
    switch (action) {
        case 'start':
            if (activeTabIndex !== -1) {
                timerData.tabs[activeTabIndex].isRunning = true;
                timerData.tabs[activeTabIndex].startTime = now;
                localTimerRunning = true;
                localTimerStart = now;
                // Aktualizacja tła
                updateBackground();
            }
            break;
        case 'stop':
            if (activeTabIndex !== -1) {
                timerData.tabs[activeTabIndex].isRunning = false;
                timerData.tabs[activeTabIndex].elapsedTime = localTimerElapsed;
                localTimerRunning = false;
                // Aktualizacja tła
                updateBackground();
            }
            break;
        case 'reset':
            if (activeTabIndex !== -1) {
                timerData.tabs[activeTabIndex].isRunning = false;
                timerData.tabs[activeTabIndex].elapsedTime = 0;
                timerData.tabs[activeTabIndex].splits = [];
                localTimerRunning = false;
                localTimerElapsed = 0;
                // Aktualizacja tła
                updateBackground();
            }
            break;
        case 'switchTab':
            if (additionalData.tabId) {
                // Tylko zapisujemy lokalnie bez zmiany na serwerze
                activeTabId = additionalData.tabId;
                localStorage.setItem('activeTabId', activeTabId);
                syncLocalTimerWithServer();
            }
            break;
        case 'split':
            if (activeTabIndex !== -1 && timerData.tabs[activeTabIndex].isRunning) {
                // Prawidłowe obliczenie międzyczasu
                const activeTab = timerData.tabs[activeTabIndex];
                const splitTime = activeTab.elapsedTime + (Date.now() - activeTab.startTime);
                
                timerData.tabs[activeTabIndex].splits.push({
                    count: timerData.tabs[activeTabIndex].splits.length + 1,
                    time: splitTime,
                    name: ''
                });
                // Aktualizacja interfejsu
                updateSplits();
            }
            break;
        case 'editSplitName':
            if (activeTabIndex !== -1 && additionalData.index !== undefined) {
                if (timerData.tabs[activeTabIndex].splits[additionalData.index]) {
                    timerData.tabs[activeTabIndex].splits[additionalData.index].name = additionalData.newName || '';
                }
            }
            break;
        case 'renameTab':
            if (additionalData.tabId && additionalData.newName) {
                const tabIndex = timerData.tabs.findIndex(tab => tab.id === additionalData.tabId);
                if (tabIndex !== -1) {
                    timerData.tabs[tabIndex].name = additionalData.newName;
                }
            }
            break;
    }
    
    // Aktualizuj interfejs natychmiast
    updateDisplay();
    updateButtons();
}

function updateDisplay() {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1) return;
    
    const activeTab = timerData.tabs[activeTabIndex];
    let currentTime = localTimerElapsed;
    
    if (localTimerRunning) {
        currentTime = activeTab.elapsedTime + (Date.now() - activeTab.startTime);
        container.classList.add('running');
    } else {
        container.classList.remove('running');
    }
    
    display.textContent = formatTime(currentTime);
}

function formatTime(time) {
    const ms = Math.floor((time % 1000) / 10);
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor(time / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function updateSplits() {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1) return;
    
    const splits = timerData.tabs[activeTabIndex].splits;
    
    splitTimesDiv.innerHTML = '';
    
    if (splits.length === 0) {
        const noSplitsDiv = document.createElement('div');
        noSplitsDiv.className = 'no-splits';
        noSplitsDiv.textContent = 'Brak zapisanych międzyczasów';
        splitTimesDiv.appendChild(noSplitsDiv);
        return;
    }
    
    splits.forEach((split, index) => {
        const splitNumber = split.count || (index + 1);
        const name = split.name || `Międzyczas ${splitNumber}`;
        
        const splitItem = document.createElement('div');
        splitItem.className = 'split-item';
        splitItem.setAttribute('data-index', index);
        
        const splitInfo = document.createElement('div');
        splitInfo.className = 'split-info';
        
        const splitNumberElem = document.createElement('span');
        splitNumberElem.className = 'split-number';
        splitNumberElem.textContent = `#${splitNumber}`;
        splitInfo.appendChild(splitNumberElem);
        
        const splitNameElem = document.createElement('span');
        splitNameElem.className = 'split-name';
        splitNameElem.textContent = name;
        
        // Obsługa kliknięcia dla edycji nazwy
        splitNameElem.addEventListener('click', (e) => {
            e.stopPropagation();
            startEditingSplitName(index, splitNameElem);
        });
        
        splitInfo.appendChild(splitNameElem);
        
        const splitTimeElem = document.createElement('div');
        splitTimeElem.className = 'split-time';
        splitTimeElem.textContent = formatTime(split.time);
        
        splitItem.appendChild(splitInfo);
        splitItem.appendChild(splitTimeElem);
        
        splitTimesDiv.appendChild(splitItem);
    });
}

// Całkowicie przebudowana funkcja updateTabs
function updateTabs() {
    tabsContainer.innerHTML = '';
    
    timerData.tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab-id', tab.id);
        
        if (tab.id === activeTabId) {
            tabElement.classList.add('active');
        }
        if (tab.isRunning) {
            tabElement.classList.add('running-tab');
        }
        
        // Kontener dla nazwy
        const tabNameContainer = document.createElement('div');
        tabNameContainer.className = 'tab-name-container';
        
        // Element nazwy
        const tabName = document.createElement('span');
        tabName.className = 'tab-name';
        tabName.textContent = tab.name;
        
        // Przycisk edycji
        const editButton = document.createElement('button');
        editButton.className = 'tab-edit-button';
        editButton.innerHTML = '✎';
        editButton.title = 'Edytuj nazwę';
        
        // Obsługa kliknięcia w przycisk edycji
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const oldName = tab.name;
            const newName = prompt('Wprowadź nową nazwę:', oldName);
            
            if (newName && newName !== oldName) {
                console.log('Próba zmiany nazwy z:', oldName, 'na:', newName);
                
                // Wysyłamy żądanie do serwera
                fetch('timer.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'renameTab',
                        tabId: tab.id,
                        newName: newName
                    })
                })
                .then(response => {
                    console.log('Odpowiedź serwera:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Dane z serwera:', data);
                    if (data.error) {
                        alert('Błąd: ' + data.error);
                        return;
                    }
                    
                    // Aktualizuj lokalnie
                    tab.name = newName;
                    tabName.textContent = newName;
                })
                .catch(error => {
                    console.error('Błąd:', error);
                    alert('Wystąpił błąd podczas zmiany nazwy');
                });
            }
        });
        
        // Obsługa kliknięcia w kontener - przełączanie zakładki
        tabNameContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            switchTab(tab.id);
        });
        
        tabNameContainer.appendChild(tabName);
        tabNameContainer.appendChild(editButton);
        
        // Przycisk zamykania
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Czy na pewno chcesz usunąć tę zakładkę?')) {
                sendAction('removeTab', { tabId: tab.id });
            }
        });
        
        tabElement.appendChild(tabNameContainer);
        tabElement.appendChild(closeBtn);
        tabsContainer.appendChild(tabElement);
    });
}

// Nowa funkcja do rozpoczynania edycji nazwy międzyczasu
function startEditingSplitName(index, splitNameElement) {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1 || !splitNameElement) return;
    
    const currentName = timerData.tabs[activeTabIndex].splits[index].name || '';
    const defaultName = `Międzyczas ${index + 1}`;
    
    // Stwórz input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName || defaultName;
    input.className = 'edit-input';
    input.maxLength = 50;
    input.placeholder = defaultName;
    
    // Wyczyść zawartość elementu i dodaj input
    splitNameElement.textContent = '';
    splitNameElement.appendChild(input);
    splitNameElement.classList.add('editing');
    
    // Focus i zaznaczenie
    input.focus();
    input.select();
    
    const finishEditing = (save = true) => {
        const newName = input.value.trim();
        splitNameElement.classList.remove('editing');
        
        if (save) {
            // Najpierw zaktualizuj lokalnie
            timerData.tabs[activeTabIndex].splits[index].name = newName;
            splitNameElement.textContent = newName || defaultName;
            // Wyślij akcję do serwera
            sendAction('editSplitName', { index: index, newName: newName });
        } else {
            splitNameElement.textContent = currentName || defaultName;
        }
    };
    
    // Obsługa zdarzeń
    input.addEventListener('blur', () => finishEditing(true));
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finishEditing(false);
        }
        e.stopPropagation();
    });
    
    // Zapobiegaj propagacji zdarzeń myszy
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('mouseup', (e) => e.stopPropagation());
}

function updateButtons() {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1) return;
    
    const activeTab = timerData.tabs[activeTabIndex];
    
    if (activeTab.isRunning) {
        startStopBtn.innerHTML = '<i class="fas fa-pause"></i> Stop';
        startStopBtn.classList.add('running');
    } else {
        startStopBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        startStopBtn.classList.remove('running');
    }
    
    // Wyłączanie przycisków
    splitBtn.disabled = !activeTab.isRunning && activeTab.elapsedTime === 0;
    resetBtn.disabled = activeTab.elapsedTime === 0;
    
    // Dodane klasy CSS dla wyłączonych przycisków
    if (splitBtn.disabled) {
        splitBtn.classList.add('disabled');
    } else {
        splitBtn.classList.remove('disabled');
    }
    
    if (resetBtn.disabled) {
        resetBtn.classList.add('disabled');
    } else {
        resetBtn.classList.remove('disabled');
    }
}

function updateBackground() {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1) return;
    
    // Dodane - delikatny efekt tła
    if (timerData.tabs[activeTabIndex].isRunning) {
        document.body.style.background = `linear-gradient(135deg, var(--background-color), #1e3a8a)`;
    } else {
        document.body.style.background = `var(--background-gradient)`;
    }
}

function findActiveTabIndex() {
    return timerData.tabs.findIndex(tab => tab.id === activeTabId);
}

function addNewTab() {
    // Generuj tymczasowe ID dla nowej zakładki
    const tempId = 'tab_temp_' + Date.now();
    
    // Dodaj nową zakładkę do lokalnych danych
    timerData.tabs.push({
        id: tempId,
        name: 'Nowy Timer',
        isRunning: false,
        startTime: 0,
        elapsedTime: 0,
        splits: []
    });
    
    // Przełącz na nową zakładkę
    activeTabId = tempId;
    localStorage.setItem('activeTabId', tempId);
    
    // Aktualizuj interfejs
    updateTabs();
    updateDisplay();
    updateSplits();
    updateButtons();
    
    // Wyślij żądanie do serwera i oczekuj na odpowiedź
    fetch('timer.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'addTab'
        })
    })
    .then(response => response.json())
    .then(data => {
        // Znajdź nową zakładkę (ostatnią) z serwera
        if (data.tabs && data.tabs.length > 0) {
            const newServerTab = data.tabs[data.tabs.length - 1];
            // Aktualizuj lokalne ID
            activeTabId = newServerTab.id;
            localStorage.setItem('activeTabId', newServerTab.id);
            // Aktualizuj dane
            timerData.tabs = data.tabs;
            
            // Aktualizuj interfejs i przewiń do nowej zakładki
            updateTabs();
            const tabsWrapper = document.querySelector('.tabs-wrapper');
            const newTab = tabsWrapper.querySelector('.tab:last-child');
            if (newTab) {
                const tabRect = newTab.getBoundingClientRect();
                const wrapperRect = tabsWrapper.getBoundingClientRect();
                const scrollLeft = newTab.offsetLeft - (wrapperRect.width / 2) + (tabRect.width / 2);
                
                tabsWrapper.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
                
                // Dodaj efekt podświetlenia
                newTab.style.transition = 'all 0.3s ease';
                newTab.style.backgroundColor = 'rgba(138, 43, 226, 0.3)';
                setTimeout(() => {
                    newTab.style.backgroundColor = '';
                }, 1000);
            }
        }
    });
}

function switchTab(tabId) {
    if (tabId === activeTabId) return;
    
    // Znajdź element zakładki
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (!tabElement) return;
    
    // Usuń klasę active ze wszystkich zakładek
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    // Dodaj klasę active do wybranej zakładki
    tabElement.classList.add('active');
    
    // Zaktualizuj lokalny stan
    activeTabId = tabId;
    localStorage.setItem('activeTabId', activeTabId);
    
    // Natychmiast zaktualizuj interfejs
    updateDisplay();
    updateSplits();
    updateButtons();
    updateBackground();
    
    // Przewiń do aktywnej zakładki
    const tabsWrapper = document.querySelector('.tabs-wrapper');
    if (tabsWrapper && tabElement) {
        const tabRect = tabElement.getBoundingClientRect();
        const wrapperRect = tabsWrapper.getBoundingClientRect();
        const scrollLeft = tabElement.offsetLeft - (wrapperRect.width / 2) + (tabRect.width / 2);
        
        tabsWrapper.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    
    // Wyślij informację do serwera
    fetch('timer.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'switchTab',
            tabId: tabId
        })
    }).catch(error => {
        console.error('Błąd podczas zmiany zakładki:', error);
    });
}

// Dodane - wyświetlanie informacji o wersji
function showVersionInfo() {
    console.info('TimON v6 - Professional Timer Application');
    console.info('© 2023 Juliusz Sagan');
}

// Inicjalizacja timerów i interwałów
let displayUpdateInterval;
let timerUpdateInterval;

// Inicjalizacja
document.addEventListener('DOMContentLoaded', () => {
    // Informacja o wersji
    showVersionInfo();
    
    // Inicjalizacja efektów
    initializeEffects();
    
    // Pierwsze pobranie danych z serwera
    updateTimerData();
    
    // Aktualizacja wyświetlacza co 40ms (25 FPS) dla płynnego timera
    displayUpdateInterval = setInterval(() => {
        if (localTimerRunning) {
            updateDisplay();
        }
    }, 40);
    
    // Ustawienie interwału z zabezpieczeniem dla połączenia z serwerem
    timerUpdateInterval = setInterval(updateTimerData, updateInterval);
    
    // Obsługa przycisków
    startStopBtn.addEventListener('click', () => {
        const activeTabIndex = findActiveTabIndex();
        if (activeTabIndex === -1) return;
        
        const action = timerData.tabs[activeTabIndex].isRunning ? 'stop' : 'start';
        sendAction(action);
    });
    
    splitBtn.addEventListener('click', () => {
        const activeTabIndex = findActiveTabIndex();
        if (activeTabIndex === -1 || !timerData.tabs[activeTabIndex].isRunning) return;
        
        sendAction('split');
    });
    
    resetBtn.addEventListener('click', () => {
        const activeTabIndex = findActiveTabIndex();
        if (activeTabIndex === -1 || timerData.tabs[activeTabIndex].elapsedTime === 0) return;
        
        if (confirm('Czy na pewno chcesz zresetować stoper? Wszystkie międzyczasy zostaną usunięte.')) {
            sendAction('reset');
        }
    });
    
    addTabBtn.addEventListener('click', () => {
        addNewTab();
    });
});

// Dodane - obsługa klawiszy
document.addEventListener('keydown', (event) => {
    const activeTabIndex = findActiveTabIndex();
    if (activeTabIndex === -1) return;
    
    // Space - start/stop
    if (event.code === 'Space') {
        event.preventDefault();
        const action = timerData.tabs[activeTabIndex].isRunning ? 'stop' : 'start';
        sendAction(action);
    }
    
    // S or L - split
    if ((event.code === 'KeyS' || event.code === 'KeyL') && timerData.tabs[activeTabIndex].isRunning) {
        event.preventDefault();
        sendAction('split');
    }
    
    // R - reset
    if (event.code === 'KeyR' && !timerData.tabs[activeTabIndex].isRunning && timerData.tabs[activeTabIndex].elapsedTime > 0) {
        event.preventDefault();
        sendAction('reset');
    }
});

// Naprawiona funkcja sendAction z bezpośrednimi zapytaniami do serwera
function sendAction(action, additionalData = {}) {
    // Efekty animacji przycisków
    if (action === 'start') {
        startStopBtn.classList.add('button-clicked');
        setTimeout(() => startStopBtn.classList.remove('button-clicked'), 200);
    } else if (action === 'stop') {
        startStopBtn.classList.add('button-clicked');
        setTimeout(() => startStopBtn.classList.remove('button-clicked'), 200);
    } else if (action === 'split') {
        splitBtn.classList.add('button-clicked');
        setTimeout(() => splitBtn.classList.remove('button-clicked'), 200);
    } else if (action === 'reset') {
        resetBtn.classList.add('button-clicked');
        setTimeout(() => resetBtn.classList.remove('button-clicked'), 200);
    }
    
    // Jeśli akcja to switchTab, obsługujemy ją lokalnie
    if (action === 'switchTab') {
        applyLocalAction(action, additionalData);
        return;
    }
    
    // Przygotuj dane do wysłania
    const actionData = { 
        ...additionalData, 
        action: action,
        tabId: activeTabId 
    };
    
    // Stosujemy akcję lokalnie dla natychmiastowej reakcji
    applyLocalAction(action, additionalData);
    
    // Wysyłamy żądanie do serwera
    fetch('timer.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Błąd odpowiedzi serwera');
        }
        return response.json();
    })
    .then(data => {
        // Zachowaj lokalne nazwy przed aktualizacją
        const localTabs = timerData.tabs.reduce((acc, tab) => {
            acc[tab.id] = {
                name: tab.name,
                splits: tab.splits.map(split => ({ ...split }))
            };
            return acc;
        }, {});
        
        // Aktualizujemy dane zakładek, zachowując lokalne nazwy
        timerData.tabs = data.tabs.map(tab => {
            if (localTabs[tab.id]) {
                return {
                    ...tab,
                    name: localTabs[tab.id].name,
                    splits: tab.splits.map((split, index) => ({
                        ...split,
                        name: localTabs[tab.id].splits[index]?.name || split.name
                    }))
                };
            }
            return tab;
        });
        
        // Sprawdzamy czy aktywna zakładka nadal istnieje
        const activeTabExists = timerData.tabs.some(tab => tab.id === activeTabId);
        if (!activeTabExists && timerData.tabs.length > 0) {
            activeTabId = timerData.tabs[0].id;
            localStorage.setItem('activeTabId', activeTabId);
        }
        
        // Aktualizujemy interfejs
        syncLocalTimerWithServer();
        updateDisplay();
        updateSplits();
        updateButtons();
        updateBackground();
        updateTabs();
    })
    .catch(error => {
        console.error('Błąd wysyłania akcji:', error);
        // Aktualizuj UI na podstawie lokalnych danych
        updateDisplay();
        updateButtons();
        updateTabs();
        updateSplits();
    });
} 