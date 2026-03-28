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

function getCurrentUserKey() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

function getCurrentUser() {
    const username = getCurrentUserKey();
    if (!username) return null;
    return getUser(username);
}

function getUser(username) {
    const users = getUsers();
    return users[username] || null;
}

function createUser(username) {
    return {
        name: username,
        createdAt: new Date().toISOString(),
        streakDays: 1,
        dailyUsageCount: 0,
        lastActivityDate: null,
        quotes: []
    };
}

function saveUser(user) {
    const users = getUsers();
    users[user.name] = user;
    saveUsers(users);
}

function setCurrentUser(username) {
    const key = username.trim();
    if (!key) return null;

    const users = getUsers();
    let user = users[key];

    if (!user) {
        user = createUser(key);
        users[key] = user;
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, key);
    saveUsers(users);
    return user;
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
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
