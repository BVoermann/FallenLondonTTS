// content.js

let ttsBusy = false; // global lock

async function fetchCoquiTTS(text) {
  try {
    const response = await fetch("http://127.0.0.1:5002/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      console.error("Coqui TTS error:", response.status, response.statusText);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    await audio.play();
  } catch (err) {
    console.error("Coqui TTS fetch failed:", err);
  }
}

// Handle TTS button click
async function handleTTSClick(block, button) {
  if (ttsBusy) return;
  ttsBusy = true;
  button.disabled = true;

  let text = "";
  const headline = block.querySelector("h1, h2, h3");
  const paragraphs = block.querySelectorAll("p");

  if (headline) text += headline.innerText + " ";
  paragraphs.forEach(p => text += p.innerText + " ");
  text = text.trim();

  if (text) await fetchCoquiTTS(text);

  button.disabled = false;
  ttsBusy = false;
}

// Add button to each story block
function addTTSButtonToBlock(block) {
  if (block.dataset.hasTtsButton) return;

  const button = document.createElement("button");
  button.textContent = "🔊";
  button.style.marginLeft = "8px";
  button.style.cursor = "pointer";
  button.style.fontSize = "0.9em";

  button.addEventListener("click", () => handleTTSClick(block, button));

  const container = block.querySelector("h1, h2, h3") || block.querySelector("p");
  if (container) container.insertAdjacentElement("afterend", button);

  block.dataset.hasTtsButton = "true";
}

// Add buttons to current story blocks
function addButtonsToStoryBlocks() {
  document.querySelectorAll(".media__body").forEach(block => {
    addTTSButtonToBlock(block);
  });
}

// Initial run
addButtonsToStoryBlocks();

// Observe dynamically loaded content
const observer = new MutationObserver(addButtonsToStoryBlocks);
observer.observe(document.body, { childList: true, subtree: true });
