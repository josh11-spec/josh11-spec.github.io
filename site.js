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

function getQuoteId(user, quote) {
    if (quote.id) {
        return quote.id;
    }

    const id = `${normalizeUsername(user.username)}|${quote.addedAt}|${btoa(unescape(encodeURIComponent(String(quote.text).slice(0, 64))))}`;
    quote.id = id;
    return id;
}

function getAllUserQuotes() {
    const users = getUsers();
    const allQuotes = [];

    Object.values(users).forEach((user) => {
        if (!Array.isArray(user.quotes)) return;

        user.quotes.forEach((quote) => {
            const id = getQuoteId(user, quote);
            allQuotes.push({
                id,
                userKey: user.username,
                author: user.displayName || user.username,
                text: quote.text,
                wordCount: quote.wordCount,
                addedAt: quote.addedAt
            });
        });
    });

    return allQuotes.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
}

function deleteCommunityQuote(quoteId) {
    const users = getUsers();
    let deleted = false;

    Object.values(users).forEach((user) => {
        if (!Array.isArray(user.quotes) || deleted) return;

        const quoteIndex = user.quotes.findIndex((quote) => {
            if (quote.id && quote.id === quoteId) return true;
            const fallbackId = `${normalizeUsername(user.username)}|${quote.addedAt}|${btoa(unescape(encodeURIComponent(String(quote.text).slice(0, 64))))}`;
            return fallbackId === quoteId;
        });

        if (quoteIndex >= 0) {
            user.quotes.splice(quoteIndex, 1);
            deleted = true;
        }
    });

    if (deleted) {
        saveUsers(users);
    }

    return deleted;
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
    const newQuote = {
        id: `${user.username}|${Date.now()}|${Math.random().toString(36).slice(2, 10)}`,
        text: quote,
        wordCount,
        addedAt: new Date().toISOString()
    };
    user.quotes.push(newQuote);

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
