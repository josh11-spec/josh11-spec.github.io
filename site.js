const STORAGE_KEYS = {
    USERS: "quoteGenUsers",
    CURRENT_USER: "quoteGenCurrentUser"
};

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || {};
    } catch (error) {
        return {};
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function normalizeUsername(username) {
    return String(username || "").trim().toLowerCase();
}

function getCurrentUserKey() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

function getCurrentUser() {
    const username = getCurrentUserKey();
    if (!username) return null;
    return getUser(username);
}

function getUser(username) {
    const users = getUsers();
    return users[normalizeUsername(username)] || null;
}

function getAllUserQuotes() {
    const users = getUsers();
    const allQuotes = [];

    Object.values(users).forEach((user) => {
        if (!Array.isArray(user.quotes)) return;

        user.quotes.forEach((quote) => {
            allQuotes.push({
                author: user.displayName || user.username,
                text: quote.text,
                wordCount: quote.wordCount,
                addedAt: quote.addedAt
            });
        });
    });

    return allQuotes.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
}

function hashPassword(password) {
    return btoa(unescape(encodeURIComponent(String(password))));
}

function createUser(username, password) {
    const normalized = normalizeUsername(username);
    return {
        username: normalized,
        displayName: String(username).trim(),
        password: hashPassword(password),
        createdAt: new Date().toISOString(),
        streakDays: 1,
        dailyUsageCount: 0,
        lastActivityDate: null,
        quotes: []
    };
}

function saveUser(user) {
    const users = getUsers();
    users[normalizeUsername(user.username)] = user;
    saveUsers(users);
}

function registerUser(username, password) {
    const normalized = normalizeUsername(username);
    if (!normalized || getUser(normalized)) {
        return null;
    }

    const user = createUser(username, password);
    saveUser(user);
    return user;
}

function authenticateUser(username, password) {
    const user = getUser(username);
    if (!user) return false;
    return user.password === hashPassword(password);
}

function loginUser(username, password, remember = true) {
    const normalized = normalizeUsername(username);
    const user = getUser(normalized);
    if (!user || user.password !== hashPassword(password)) {
        return null;
    }

    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

    if (remember) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, normalized);
    } else {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, normalized);
    }

    return user;
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey(dateKey) {
    const date = new Date(dateKey);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
}

function recordUserAction() {
    const user = getCurrentUser();
    if (!user) return null;

    const today = getTodayKey();

    if (user.lastActivityDate === today) {
        user.dailyUsageCount += 1;
    } else if (user.lastActivityDate === getYesterdayKey(today)) {
        user.streakDays += 1;
        user.dailyUsageCount = 1;
    } else {
        user.streakDays = 1;
        user.dailyUsageCount = 1;
    }

    user.lastActivityDate = today;
    saveUser(user);
    return user;
}

function addUserQuote(text) {
    const user = getCurrentUser();
    if (!user) return null;

    const quote = text.trim();
    if (!quote) return null;

    const wordCount = quote.split(/\s+/).filter(Boolean).length;
    user.quotes.push({
        text: quote,
        wordCount,
        addedAt: new Date().toISOString()
    });

    saveUser(user);
    return user;
}

function formatShortDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
