let quoteDisplay = document.getElementById("quote");
let generateBtn = document.getElementById("generateBtn");
let addQuoteBtn = document.getElementById("addQuoteBtn");
let newQuoteInput = document.getElementById("newQuote");
let loginAction = document.getElementById("loginAction");
let userPanel = document.getElementById("userPanel");
let quoteTableBody = document.getElementById("quoteTableBody");
let publicQuoteBody = document.getElementById("publicQuoteBody");

let defaultQuotes = [
    { text: "Power grows in the quiet mind.", author: "QuoteGen" },
    { text: "A warrior is built in silence.", author: "QuoteGen" },
    { text: "Dreams are whispers from the future.", author: "QuoteGen" },
    { text: "Fear is only courage waiting to awaken.", author: "QuoteGen" },
    { text: "The night teaches what the day forgets.", author: "QuoteGen" }
];

function getAvailableQuotes() {
    const userQuotes = getAllUserQuotes().map((quote) => ({
        text: quote.text,
        author: quote.author || "User"
    }));

    return defaultQuotes.concat(userQuotes);
}


function generateQuote(){
    const availableQuotes = getAvailableQuotes();
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    const selected = availableQuotes[randomIndex];
    quoteDisplay.textContent = selected.author
        ? `${selected.text} — ${selected.author}`
        : selected.text;
    const user = recordUserAction();
    if (user) {
        updateUserUI();
    }

}


function addQuote(){
    let newQuote = newQuoteInput.value.trim();

    if (newQuote === "") {
        alert("Write a quote first.");
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Please log in to save custom quotes and track your streak.");
        return;
    }

    addUserQuote(newQuote);
    recordUserAction();
    updateUserUI();

    newQuoteInput.value = "";
    alert("Quote added successfully!");
}


generateBtn.addEventListener("click", generateQuote);
addQuoteBtn.addEventListener("click", addQuote);

function renderQuoteTable() {
    const user = getCurrentUser();
    quoteTableBody.innerHTML = "";

    if (user && user.quotes.length) {
        user.quotes.forEach((quote) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(quote.text)}</td>
                <td>${quote.wordCount}</td>
                <td>${formatShortDate(quote.addedAt)}</td>
            `;
            quoteTableBody.appendChild(row);
        });
    } else {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td colspan="3">${user ? "No custom quotes added yet." : "Login to save quotes and see your quote table."}</td>
        `;
        quoteTableBody.appendChild(row);
    }
}

function renderPublicQuoteFeed() {
    const quotes = getAllUserQuotes();
    publicQuoteBody.innerHTML = "";

    if (quotes.length) {
        quotes.forEach((quote) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(quote.text)}</td>
                <td>${escapeHtml(quote.author)}</td>
                <td>${quote.wordCount}</td>
                <td>${formatShortDate(quote.addedAt)}</td>
            `;
            publicQuoteBody.appendChild(row);
        });
    } else {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td colspan="4">No community quotes yet. Add one to share it with others.</td>
        `;
        publicQuoteBody.appendChild(row);
    }
}

function updateUserUI() {
    const user = getCurrentUser();

    if (user) {
        loginAction.textContent = "Logout";
        loginAction.href = "#";
        loginAction.onclick = function (event) {
            event.preventDefault();
            clearCurrentUser();
            location.reload();
        };

        userPanel.innerHTML = `
            <div class="user-panel-card">
                <p>Signed in as <strong>${escapeHtml(user.displayName || user.username)}</strong></p>
                <p>Streak: <strong>${user.streakDays}</strong> day(s)</p>
                <p>Today's uses: <strong>${user.dailyUsageCount}</strong></p>
                <p>Saved quotes: <strong>${user.quotes.length}</strong></p>
            </div>
        `;
    } else {
        loginAction.textContent = "Login";
        loginAction.href = "login.html";
        loginAction.onclick = null;
        userPanel.innerHTML = `
            <div class="user-panel-card guest">
                <p><a href="login.html">Login</a> to save quotes and build your streak.</p>
            </div>
        `;
    }

    renderQuoteTable();
    renderPublicQuoteFeed();
}

updateUserUI();