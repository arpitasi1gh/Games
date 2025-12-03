// track player’s last move
let lastPlayerChoice = null;

// function to get computer move based on difficulty
function getComputerChoice(difficulty) {
    const choices = ["rock", "paper", "scissors"];

    if (difficulty === "easy") {
        return choices[Math.floor(Math.random() * choices.length)];
    }

    else if (difficulty === "normal") {
        if (!lastPlayerChoice) {
            return choices[Math.floor(Math.random() * choices.length)];
        }
        return Math.random() < 0.5
            ? choices[Math.floor(Math.random() * choices.length)]
            : lastPlayerChoice;
    }

    else if (difficulty === "hard") {
        if (!lastPlayerChoice) {
            return choices[Math.floor(Math.random() * choices.length)];
        }
        return lastPlayerChoice === "rock"
            ? "paper"
            : lastPlayerChoice === "paper"
            ? "scissors"
            : "rock";
    }
}


const difficultySelect = document.getElementById("difficulty");
let difficulty = "easy"; // default

difficultySelect.addEventListener("change", (e) => {
    difficulty = e.target.value;
});

const themeSelect = document.getElementById("theme");

themeSelect.addEventListener("change", (e) => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(e.target.value);
});

function updateButtonsForTheme(theme) {
    const buttons = document.querySelectorAll(".choice-button");
    if (theme === "emoji") {
        buttons.forEach(button => {
            if (button.id === "rock") button.textContent = "👊";
            else if (button.id === "paper") button.textContent = "✋";
            else if (button.id === "scissors") button.textContent = "✌️";
        });
    } else {
        buttons.forEach(button => {
            if (button.id === "rock") button.textContent = "Rock";
            else if (button.id === "paper") button.textContent = "Paper";
            else if (button.id === "scissors") button.textContent = "Scissors";
        });
    }
}

const choices = ["rock", "paper", "scissors"];
function playRound(playerChoice) {
    const computerChoice = getComputerChoice(difficulty);

    if (playerChoice === computerChoice) {
        // it's a tie
        lastPlayerChoice = playerChoice;
        document.getElementById("result").textContent = "It's a tie!";
    } else if (
        (playerChoice === "rock" && computerChoice === "scissors") ||
        (playerChoice === "paper" && computerChoice === "rock") ||
        (playerChoice === "scissors" && computerChoice === "paper")
    ) {
        // player wins
        lastPlayerChoice = playerChoice;
        document.getElementById("result").textContent = "You win!";
        playSound("win");
        celebrateWin();
        updateStreak("win");
        updateLeaderboard(winStreak);
    } else {
        // computer wins
        lastPlayerChoice = playerChoice;
        document.getElementById("result").textContent = "You lose!";
        playSound("lose");
        updateStreak("lose");
        updateLeaderboard(winStreak);
    }
}

document.getElementById("rock").addEventListener("click", () => {
    playRound("rock");
});
document.getElementById("paper").addEventListener("click", () => {
    playRound("paper");
});
document.getElementById("scissors").addEventListener("click", () => {
    playRound("scissors");
});

function celebrateWin() {
    const resultDiv = document.getElementById("result");
    resultDiv.classList.add("win");
    resultDiv.addEventListener("animationend", () => {
        resultDiv.classList.remove("win");
    }, { once: true });
}

const winSound = new Audio("assets/win.mp3");
const loseSound = new Audio("assets/lost.mp3");

function playSound(result) {
    if (result === "win") {
        winSound.play();
    } else if (result === "lose") {
        loseSound.play();
    }
}

let winStreak = 0;

function updateStreak(result) {
    if (result === "win") {
        winStreak++;
    } else {
        winStreak = 0;
    }
    document.getElementById("streak").textContent = `Current Streak: ${winStreak}`;
}

// Save best streak
let bestStreak = localStorage.getItem("bestStreak") || 0;

// Update leaderboard
function updateLeaderboard(current) {
    if (current > bestStreak) {
        bestStreak = current;
        localStorage.setItem("bestStreak", bestStreak);
    }
    document.getElementById("best-streak").textContent = `Best Streak: ${bestStreak}`;
}

// Array of meme URLs
const memes = {
    win: [
        "assets/w1.jpeg",
        "assets/w2.png",
        "assets/w3.jpg"
    ],
    lose: [
        "assets/l1.jpg",
        "assets/l2.jpg",
        "assets/l3.jpg"
    ],
    tie: [
        "assets/t1.png",
        "assets/t2.jpg",
        "assets/t3.png"
    ]
};


const emojiToggle = document.getElementById("emoji-toggle");

emojiToggle.addEventListener("change", () => {
    if (emojiToggle.checked) {
        document.body.classList.add("emoji");
        updateButtonsForTheme("emoji");
    } else {
        document.body.classList.remove("emoji");
        updateButtonsForTheme("normal");
    }
});

const memeToggle = document.getElementById("meme-toggle");
let memeEnabled = false;

memeToggle.addEventListener("change", () => {
    memeEnabled = memeToggle.checked;

    if (!memeEnabled) {
        document.getElementById("meme").style.display = "none";
    }
});


function displayMeme(result) {
    const memeImg = document.getElementById("meme");
    if (result === "win") {
        const randomMeme = memes.win[Math.floor(Math.random() * memes.win.length)];
        memeImg.src = randomMeme;
        memeImg.style.display = "block"; // Show the meme
        memeImg.style.border = "5px solid green";
    } else if (result === "lose") {
        const randomMeme = memes.lose[Math.floor(Math.random() * memes.lose.length)];
        memeImg.src = randomMeme;
        memeImg.style.display = "block"; // Show the meme
        memeImg.style.border = "5px solid red";
    } else if (result === "tie") {
        const randomMeme = memes.tie[Math.floor(Math.random() * memes.tie.length)];
        memeImg.src = randomMeme;
        memeImg.style.display = "block"; // Show the meme
        memeImg.style.border = "5px solid blue";
    }
}


function playRound(playerChoice) {
    const computerChoice = getComputerChoice(difficulty);
    let result = "";

    document.getElementById("player-choice").textContent = `You chose: ${playerChoice}`;
    document.getElementById("computer-choice").textContent = `Computer chose: ${computerChoice}`;

    if (playerChoice === computerChoice) {
        result = "tie";
        document.getElementById("result").textContent = "It's a tie!";
        document.getElementById("result").style.color = "blue";
    } 
    else if (
        (playerChoice === "rock" && computerChoice === "scissors") ||
        (playerChoice === "paper" && computerChoice === "rock") ||
        (playerChoice === "scissors" && computerChoice === "paper")
    ) {
        result = "win";
        document.getElementById("result").textContent = "You win!";
        playSound("win");
        celebrateWin();
        updateStreak("win");
        document.getElementById("result").style.color = "green";
    } 
    else {
        result = "lose";
        document.getElementById("result").textContent = "You lose!";
        playSound("lose");
        updateStreak("lose");
        document.getElementById("result").style.color = "red";
    }

    // 🔥 Show meme ONLY IF ENABLED
    if (memeEnabled) {
        displayMeme(result);
    }
}
