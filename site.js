const STORAGE_KEYS = {
    USERS: "quoteGenUsers",
    CURRENT_USER: "quoteGenCurrentUser",
    THEME: "quoteGenTheme",
    COMMUNITY_QUOTES: "quoteGenCommunityQuotes"
};

function getSavedTheme() {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    return stored === "dark" ? "dark" : "light";
}

function updateThemeButton(theme) {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function applyTheme(theme) {
    const body = document.body;
    if (!body) return;
    body.classList.toggle("dark-mode", theme === "dark");
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    updateThemeButton(theme);
}

function initThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
        const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
        applyTheme(nextTheme);
    });
    updateThemeButton(getSavedTheme());
}

function initTheme() {
    applyTheme(getSavedTheme());
    initThemeToggle();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
} else {
    initTheme();
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || {};
    } catch (error) {
        return {};
    }
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

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getCommunityQuotes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_QUOTES)) || [];
    } catch (error) {
        return [];
    }
}

function saveCommunityQuotes(quotes) {
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_QUOTES, JSON.stringify(quotes));
}

function addCommunityQuote(user, text) {
    if (!user || !text || !String(text).trim()) {
        return;
    }

    const communityQuotes = getCommunityQuotes();
    communityQuotes.push({
        username: user.username,
        author: user.displayName || user.username,
        text: String(text).trim(),
        wordCount: String(text).trim().split(/\s+/).filter(Boolean).length,
        addedAt: new Date().toISOString()
    });
    saveCommunityQuotes(communityQuotes);
}

function notifyAdminQuoteAdded(quoteText) {
    const currentUser = getCurrentUser();
    const payload = {
        text: String(quoteText).trim(),
        author: currentUser ? (currentUser.displayName || currentUser.username) : 'Unknown',
        addedAt: new Date().toISOString()
    };

    localStorage.setItem('quoteGenAdminQuoteAdded', JSON.stringify(payload));
    localStorage.setItem('quoteGenAdminQuoteAddedSeen', '');
}

function getAdminQuoteNotification() {
    try {
        return JSON.parse(localStorage.getItem('quoteGenAdminQuoteAdded')) || null;
    } catch (error) {
        return null;
    }
}

function markAdminQuoteNotificationSeen() {
    const notification = getAdminQuoteNotification();
    if (notification && notification.addedAt) {
        localStorage.setItem('quoteGenAdminQuoteAddedSeen', notification.addedAt);
    }
}

function isAdminQuoteNotificationNew() {
    const notification = getAdminQuoteNotification();
    return notification && notification.addedAt && localStorage.getItem('quoteGenAdminQuoteAddedSeen') !== notification.addedAt;
}

function registerAdminNotificationListener(callback) {
    window.addEventListener('storage', function (event) {
        if (event.key === 'quoteGenAdminQuoteAdded') {
            callback();
        }
    });
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
    addCommunityQuote(user, quote);
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
