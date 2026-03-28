let quoteDisplay = document.getElementById("quote");
let generateBtn = document.getElementById("generateBtn");
let addQuoteBtn = document.getElementById("addQuoteBtn");
let newQuoteInput = document.getElementById("newQuote");


let defaultQuotes = [
    "Power grows in the quiet mind.",
    "A warrior is built in silence.",
    "Dreams are whispers from the future.",
    "Fear is only courage waiting to awaken.",
    "The night teaches what the day forgets."
];


let storedQuotes = JSON.parse(localStorage.getItem("quotes"));

let quotes = storedQuotes ? storedQuotes : defaultQuotes;


function generateQuote(){

    let randomIndex = Math.floor(Math.random() * quotes.length);

    quoteDisplay.textContent = quotes[randomIndex];

}


function addQuote(){

    let newQuote = newQuoteInput.value.trim();

    if(newQuote === ""){
        alert("Write a quote first.");
        return;
    }

    quotes.push(newQuote);

    localStorage.setItem("quotes", JSON.stringify(quotes));

    newQuoteInput.value = "";

    alert("Quote added successfully!");

}


generateBtn.addEventListener("click", generateQuote);
addQuoteBtn.addEventListener("click", addQuote);