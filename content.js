let selectedVoice = null;

function createVoiceSelector() {
  // Avoid duplicates
  if (document.getElementById("tts-voice-selector")) return;

  const container = document.createElement("div");
  container.style.padding = "8px";
  container.style.background = "#f8f8f8";
  container.style.borderBottom = "1px solid #ddd";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.gap = "8px";

  const label = document.createElement("label");
  label.innerText = "Choose voice:";
  label.setAttribute("for", "tts-voice-selector");

  const select = document.createElement("select");
  select.id = "tts-voice-selector";
  select.style.padding = "4px";

  container.appendChild(label);
  container.appendChild(select);

  // Insert at top of the body (or choose a specific container if you prefer)
  document.body.insertBefore(container, document.body.firstChild);

  // Load voices when available
  function populateVoices() {
    const voices = speechSynthesis.getVoices();
    select.innerHTML = "";

    voices.forEach(voice => {
      const option = document.createElement("option");
      option.value = voice.name;
      option.innerText = `${voice.name} (${voice.lang})`;
      if (voice.default) option.innerText += " — DEFAULT";
      select.appendChild(option);
    });

    // Preselect a voice (default or previously chosen)
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
      select.value = selectedVoice.name;
    }
  }

  populateVoices();
  speechSynthesis.onvoiceschanged = populateVoices;

  select.addEventListener("change", () => {
    const voices = speechSynthesis.getVoices();
    selectedVoice = voices.find(v => v.name === select.value);
  });
}

function addReadButtons() {
  // Create voice selector once
  createVoiceSelector();

  const blocks = document.querySelectorAll(
    ".tab-content.tab-content--inverse.inverse--bordered .media__body"
  );

  blocks.forEach(block => {
    if (block.dataset.hasTtsButton) return;

    const button = document.createElement("button");
    button.innerText = "🔊";
    button.style.marginLeft = "8px";
    button.style.cursor = "pointer";
    button.style.fontSize = "0.9em";

    button.addEventListener("click", () => {
      const clone = block.cloneNode(true);
      clone.querySelectorAll("button").forEach(btn => btn.remove());
      const text = clone.innerText.trim();

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });

    const heading = block.querySelector("h1, h2, h3");
    if (heading) {
      heading.insertAdjacentElement("afterend", button);
    } else {
      block.insertBefore(button, block.firstChild);
    }

    block.dataset.hasTtsButton = "true";
  });
}

addReadButtons();
const observer = new MutationObserver(addReadButtons);
observer.observe(document.body, { childList: true, subtree: true });
