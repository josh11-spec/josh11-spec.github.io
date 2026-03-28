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

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getCurrentUserKey() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

function getCurrentUser() {
    const email = getCurrentUserKey();
    if (!email) return null;
    const user = getUser(email);
    return user && user.verified ? user : null;
}

function getUser(email) {
    const users = getUsers();
    return users[normalizeEmail(email)] || null;
}

function getAllUserQuotes() {
    const users = getUsers();
    const allQuotes = [];

    Object.values(users).forEach((user) => {
        if (!Array.isArray(user.quotes)) return;

        user.quotes.forEach((quote) => {
            allQuotes.push({
                author: user.email,
                text: quote.text,
                wordCount: quote.wordCount,
                addedAt: quote.addedAt
            });
        });
    });

    return allQuotes.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
}

function createDisplayName(email) {
    const parts = String(email).split("@")[0].replace(/[._]/g, " ").split(" ");
    return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function createUser(email) {
    const normalized = normalizeEmail(email);
    return {
        email: normalized,
        displayName: createDisplayName(normalized),
        verified: false,
        verificationCode: null,
        createdAt: new Date().toISOString(),
        streakDays: 1,
        dailyUsageCount: 0,
        lastActivityDate: null,
        quotes: []
    };
}

function saveUser(user) {
    const users = getUsers();
    users[normalizeEmail(user.email)] = user;
    saveUsers(users);
}

function createOrGetUser(email) {
    const normalized = normalizeEmail(email);
    const users = getUsers();
    let user = users[normalized];

    if (!user) {
        user = createUser(normalized);
        users[normalized] = user;
        saveUsers(users);
    }

    return user;
}

function generateVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function sendVerificationCode(email) {
    const user = createOrGetUser(email);
    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    saveUser(user);
    return verificationCode;
}

function verifyUser(email, code) {
    const user = getUser(email);
    if (!user || user.verificationCode !== code) {
        return false;
    }

    user.verified = true;
    user.verificationCode = null;
    saveUser(user);
    setCurrentUser(user.email);
    return true;
}

function setCurrentUser(email) {
    const user = getUser(email);
    if (!user || !user.verified) return null;

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, normalizeEmail(email));
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
