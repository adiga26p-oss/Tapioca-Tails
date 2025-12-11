//anime the title first 
anime({
    targets: '#title-text',
    scale: [0, 1],
    opacity: [0, 1],
    easing: 'easeOutElastic(1, .6)',
    duration: 2000
});

//animes the start button after title
anime({
    targets: '.start-button',
    translateY: [50, 0],
    opacity: [0, 1],
    easing: 'easeOutQuad',
    delay: 800,
    duration: 1200
});

//radio difficulty button
const radios = document.querySelectorAll('input[name="difficulty"]');
const startBtn = document.getElementById('startBtn');

let chosenDifficulty = null;

//enables start button after difficulty is selected
radios.forEach(radio => {
    radio.addEventListener('change', () => {
        chosenDifficulty = radio.value;
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
    });
});

//creates game -> site of potential expansion to include crossplatform multiplayer
startBtn.addEventListener('click', async () => {
    if (chosenDifficulty) {
        try {
            const response = await fetch('/api/createGame?difficulty=' + chosenDifficulty);
            const data = await response.json();
            window.generatedGameId = data.gameid;
        } catch (err) {
            console.error("Error creating game:", err);
        }

        // Instead of immediately going to game.html → start dialogue first
        startDialogue();
    }
});

const dialogueScreen = document.getElementById("dialogueScreen");
const characterName = document.getElementById("characterName");
const dialogueText = document.getElementById("dialogueText");

//List of all dialogue that plays in correct order with speaker and text given
const dialogue = [
    { speaker: "Bobber", text: ". . ." },
    { speaker: "Bobber", text: "Whoa... this place is way bigger than I imagined." },
    { speaker: "Mr. Sea", text: "Welcome, Bobber. I am Mr. Sea, reigning champion of the Tapioca City Racing League." },
    { speaker: "Bobber", text: "You’re the one I need to beat to become the Racer Legend, right?" },
    { speaker: "Mr. Sea", text: "Exactly. But earning that title won’t be easy." },
    { speaker: "Mr. Sea", text: "To challenge me, you must reach four checkpoints in order — as fast as possible." },
    { speaker: "Mr. Sea", text: "And you must compete against your fellow citizen. Two players. One keyboard. And one winner." },
    { speaker: "Bobber", text: "Four checkpoints… speed… Tapioca… got it!" },
    { speaker: "Mr. Sea", text: "Do that, and you may just become the greatest racer this city has ever seen." },
    { speaker: "Bobber", text: "Alright! Let’s do this!" }
];

let dialogueIndex = 0;
let dialogueActive = false;

// Show first dialogue line
function startDialogue() {
    dialogueActive = true;
    dialogueScreen.style.display = "flex";
    showDialogueLine();
}

//Continues to display dialogue
function showDialogueLine() {
    const line = dialogue[dialogueIndex];
    characterName.textContent = line.speaker + ":";
    dialogueText.textContent = line.text;
}

//Progresses through dialogue with enter key
document.addEventListener("keydown", (e) => {
    if (!dialogueActive) return;

    if (e.key === "Enter") {
        dialogueIndex++;

        if (dialogueIndex >= dialogue.length) {
            dialogueActive = false;

            // After dialogue finishes → go to game page
            window.location.href =
                'game.html?difficulty=' +
                chosenDifficulty;
        } else {
            showDialogueLine();
        }
    }
});