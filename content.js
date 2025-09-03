let selectedVoice = null;
let currentUtterance = null;
let currentText = "";
let currentVolume = 1; // default full volume

// ===== Floating Control Bar =====
function createControlBar() {
    if (document.getElementById("tts-control-bar")) return;

    const bar = document.createElement("div");
    bar.id = "tts-control-bar";
    bar.style.position = "fixed";
    bar.style.bottom = "0";
    bar.style.left = "0";
    bar.style.right = "0";
    bar.style.padding = "8px";
    bar.style.background = "#f0f0f0";
    bar.style.borderTop = "1px solid #ccc";
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.style.gap = "8px";
    bar.style.zIndex = "9999";

    // Voice selector
    const label = document.createElement("label");
    label.innerText = "Voice:";
    label.setAttribute("for", "tts-voice-selector");

    const select = document.createElement("select");
    select.id = "tts-voice-selector";
    select.style.padding = "4px";

    // Volume slider
    const volLabel = document.createElement("label");
    volLabel.innerText = "Volume:";
    volLabel.setAttribute("for", "tts-volume-slider");

    const volSlider = document.createElement("input");
    volSlider.type = "range";
    volSlider.id = "tts-volume-slider";
    volSlider.min = "0";
    volSlider.max = "1";
    volSlider.step = "0.1";
    volSlider.value = currentVolume;
    volSlider.style.cursor = "pointer";

    // Buttons
    const playBtn = document.createElement("button");
    playBtn.innerText = "▶️";
    playBtn.style.cursor = "pointer";

    const pauseBtn = document.createElement("button");
    pauseBtn.innerText = "⏸️";
    pauseBtn.style.cursor = "pointer";

    const resumeBtn = document.createElement("button");
    resumeBtn.innerText = "⏯️";
    resumeBtn.style.cursor = "pointer";

    const stopBtn = document.createElement("button");
    stopBtn.innerText = "⏹️";
    stopBtn.style.cursor = "pointer";

    // Append all
    bar.appendChild(label);
    bar.appendChild(select);
    bar.appendChild(volLabel);
    bar.appendChild(volSlider);
    bar.appendChild(playBtn);
    bar.appendChild(pauseBtn);
    bar.appendChild(resumeBtn);
    bar.appendChild(stopBtn);

    document.body.appendChild(bar);

    // Load voices
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

    // Volume slider action
    volSlider.addEventListener("input", () => {
        currentVolume = parseFloat(volSlider.value);
    });

    // Button actions
    playBtn.addEventListener("click", () => {
        if (!currentText) return;
        playText(currentText);
    });

    pauseBtn.addEventListener("click", () => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
        }
    });

    resumeBtn.addEventListener("click", () => {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        }
    });

    stopBtn.addEventListener("click", () => {
        speechSynthesis.cancel();
    });
}

// ===== TTS playback function =====
function playText(text) {
    speechSynthesis.cancel(); // stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = currentVolume; // apply slider volume
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

// ===== Add 🔊 buttons to blocks =====
function addReadButtons() {
    createControlBar();

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
            currentText = clone.innerText.trim();
            playText(currentText);
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
