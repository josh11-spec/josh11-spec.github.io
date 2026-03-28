let quoteDisplay = document.getElementById("quote");
let generateBtn = document.getElementById("generateBtn");
let addQuoteBtn = document.getElementById("addQuoteBtn");
let newQuoteInput = document.getElementById("newQuote");
let loginAction = document.getElementById("loginAction");
let userPanel = document.getElementById("userPanel");
let quoteTableBody = document.getElementById("quoteTableBody");


let defaultQuotes = [
    "Power grows in the quiet mind.",
    "A warrior is built in silence.",
    "Dreams are whispers from the future.",
    "Fear is only courage waiting to awaken.",
    "The night teaches what the day forgets."
];

let storedQuotes = [];

try {
    storedQuotes = JSON.parse(localStorage.getItem("quotes")) || [];
} catch (error) {
    storedQuotes = [];
}

let quotes = storedQuotes.length ? storedQuotes : defaultQuotes;


function generateQuote(){

    let randomIndex = Math.floor(Math.random() * quotes.length);
    quoteDisplay.textContent = quotes[randomIndex];
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

    quotes.push(newQuote);
    localStorage.setItem("quotes", JSON.stringify(quotes));
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
}

updateUserUI();