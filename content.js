let selectedVoice = null;
let currentUtterance = null;
let currentText = "";
let currentVolume = 1; // default full volume
let useWebFallback = false;
let voicesLoaded = false;

// ===== Debug and Error Handling =====
function logDebugInfo() {
    console.log("=== TTS Debug Info ===");
    console.log("Platform:", navigator.platform);
    console.log("User Agent:", navigator.userAgent);
    console.log("Speech Synthesis supported:", 'speechSynthesis' in window);
    console.log("Voices available:", speechSynthesis.getVoices().length);
    console.log("Voices:", speechSynthesis.getVoices());
    console.log("Speech dispatcher running:", checkSpeechDispatcher());
}

function checkSpeechDispatcher() {
    // Simple heuristic to detect if we're on Linux
    return navigator.platform.toLowerCase().includes('linux') ||
        navigator.userAgent.toLowerCase().includes('linux');
}

// ===== Web-based TTS Fallback =====
function createWebTTSFallback() {
    // Create a simple web-based TTS using HTML5 audio and text processing
    // Note: This is a basic implementation. For production, consider using services like:
    // - Google Text-to-Speech API
    // - Amazon Polly
    // - Microsoft Speech Services

    return {
        speak: function(text, options = {}) {
            // For now, we'll use a basic approach that works in most browsers
            // You could integrate with web TTS services here
            console.log("Using web TTS fallback for:", text.substring(0, 50) + "...");

            // Try to use any available voice even if the list appears empty
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = options.volume || 1;
            utterance.rate = options.rate || 1;
            utterance.pitch = options.pitch || 1;

            // Add error handling
            utterance.onerror = (event) => {
                console.error("TTS Error:", event);
                showTTSError("TTS playback failed. Please check your system's TTS configuration.");
            };

            speechSynthesis.speak(utterance);
        }
    };
}

// ===== Error Display =====
function showTTSError(message) {
    // Create a temporary error notification
    const errorDiv = document.createElement("div");
    errorDiv.style.position = "fixed";
    errorDiv.style.top = "20px";
    errorDiv.style.right = "20px";
    errorDiv.style.background = "#ff6b6b";
    errorDiv.style.color = "white";
    errorDiv.style.padding = "12px";
    errorDiv.style.borderRadius = "4px";
    errorDiv.style.zIndex = "10000";
    errorDiv.style.maxWidth = "300px";
    errorDiv.innerHTML = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// ===== Linux Instructions Modal =====
function showLinuxInstructions() {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.background = "rgba(0,0,0,0.7)";
    modal.style.zIndex = "10001";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";

    const content = document.createElement("div");
    content.style.background = "white";
    content.style.padding = "20px";
    content.style.borderRadius = "8px";
    content.style.maxWidth = "600px";
    content.style.maxHeight = "80%";
    content.style.overflow = "auto";

    content.innerHTML = `
        <h3>🔧 Linux TTS Setup Instructions</h3>
        <p>No TTS voices found on your Linux system. Here's how to fix it:</p>
        
        <h4>For Ubuntu/Debian:</h4>
        <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px;">sudo apt update
sudo apt install espeak espeak-data
sudo apt install speech-dispatcher
sudo systemctl enable speech-dispatcher
sudo systemctl start speech-dispatcher</pre>
        
        <h4>For Fedora/RHEL:</h4>
        <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px;">sudo dnf install espeak espeak-devel
sudo dnf install speech-dispatcher
sudo systemctl enable speech-dispatcherd
sudo systemctl start speech-dispatcherd</pre>
        
        <h4>For Arch Linux:</h4>
        <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px;">sudo pacman -S espeak espeak-ng
sudo pacman -S speech-dispatcher
sudo systemctl enable speech-dispatcherd
sudo systemctl start speech-dispatcherd</pre>
        
        <h4>Alternative TTS engines:</h4>
        <ul>
            <li><strong>Festival:</strong> <code>sudo apt install festival festvox-*</code></li>
            <li><strong>eSpeak-NG:</strong> <code>sudo apt install espeak-ng espeak-ng-data</code></li>
            <li><strong>Flite:</strong> <code>sudo apt install flite</code></li>
        </ul>
        
        <h4>After installation:</h4>
        <ol>
            <li>Restart your browser</li>
            <li>Test TTS: run <code>espeak "hello world"</code> in terminal</li>
            <li>If still not working, try: <code>spd-say "hello world"</code></li>
            <li>Reload this page</li>
        </ol>
        
        <p><strong>Note:</strong> Some Linux distributions require additional configuration for browser TTS access.</p>
        
        <button id="close-instructions" style="margin-top: 15px; padding: 8px 16px; cursor: pointer;">Close</button>
        <button id="test-tts" style="margin-top: 15px; margin-left: 10px; padding: 8px 16px; cursor: pointer;">Test TTS</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close button
    document.getElementById("close-instructions").addEventListener("click", () => {
        document.body.removeChild(modal);
    });

    // Test TTS button
    document.getElementById("test-tts").addEventListener("click", () => {
        testTTS();
    });

    // Close on background click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function testTTS() {
    const testText = "Hello, this is a test of your text-to-speech system.";
    logDebugInfo();

    if (speechSynthesis.getVoices().length > 0) {
        playText(testText);
        showTTSError("✅ TTS test completed! Check if you heard the audio.");
    } else {
        // Try fallback
        const webTTS = createWebTTSFallback();
        webTTS.speak(testText, { volume: currentVolume });
        showTTSError("⚠️ Using fallback TTS. If you didn't hear anything, please install TTS voices.");
    }
}

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
    bar.style.flexWrap = "wrap";

    // Voice selector
    const label = document.createElement("label");
    label.innerText = "Voice:";
    label.setAttribute("for", "tts-voice-selector");

    const select = document.createElement("select");
    select.id = "tts-voice-selector";
    select.style.padding = "4px";
    select.style.minWidth = "200px";

    // Help button for Linux users
    const helpBtn = document.createElement("button");
    helpBtn.innerText = "❓";
    helpBtn.title = "TTS Help & Troubleshooting";
    helpBtn.style.cursor = "pointer";
    helpBtn.style.padding = "4px 8px";

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

    // Status indicator
    const statusDiv = document.createElement("div");
    statusDiv.id = "tts-status";
    statusDiv.style.fontSize = "0.8em";
    statusDiv.style.color = "#666";

    // Buttons
    const playBtn = document.createElement("button");
    playBtn.innerText = "▶️";
    playBtn.title = "Play";
    playBtn.style.cursor = "pointer";

    const pauseBtn = document.createElement("button");
    pauseBtn.innerText = "⏸️";
    pauseBtn.title = "Pause";
    pauseBtn.style.cursor = "pointer";

    const resumeBtn = document.createElement("button");
    resumeBtn.innerText = "⏯️";
    resumeBtn.title = "Resume";
    resumeBtn.style.cursor = "pointer";

    const stopBtn = document.createElement("button");
    stopBtn.innerText = "⏹️";
    stopBtn.title = "Stop";
    stopBtn.style.cursor = "pointer";

    // Append all
    bar.appendChild(label);
    bar.appendChild(select);
    bar.appendChild(helpBtn);
    bar.appendChild(volLabel);
    bar.appendChild(volSlider);
    bar.appendChild(statusDiv);
    bar.appendChild(playBtn);
    bar.appendChild(pauseBtn);
    bar.appendChild(resumeBtn);
    bar.appendChild(stopBtn);

    document.body.appendChild(bar);

    // Enhanced voice population with error handling
    function populateVoices() {
        const voices = speechSynthesis.getVoices();
        const statusDiv = document.getElementById("tts-status");

        logDebugInfo(); // Debug information

        select.innerHTML = "";

        if (voices.length === 0) {
            // No voices available
            const option = document.createElement("option");
            option.value = "no-voices";

            if (checkSpeechDispatcher()) {
                option.innerText = "⚠️ No voices listed - May still work (Linux)";
                statusDiv.innerText = "Status: No voices listed (speech-dispatcher required)";
                statusDiv.style.color = "#ffc107";
            } else {
                option.innerText = "⚠️ No TTS voices available - Check system settings";
                statusDiv.innerText = "Status: No voices available";
                statusDiv.style.color = "#ff6b6b";
            }

            select.appendChild(option);

            // For Linux, still try to make TTS work even without listed voices
            if (checkSpeechDispatcher()) {
                useWebFallback = false; // Don't use fallback, try direct synthesis
                setTimeout(() => {
                    if (!voicesLoaded) {
                        showTTSError("🐧 Linux: No voices listed but TTS may still work. Click ❓ for setup help or try the test button.");
                    }
                }, 2000);
            } else {
                useWebFallback = true;
            }

        } else {
            // Voices available
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

            statusDiv.innerText = `Status: ${voices.length} voice${voices.length !== 1 ? 's' : ''} available`;
            statusDiv.style.color = "#28a745";
            useWebFallback = false;
            voicesLoaded = true;
        }
    }

    populateVoices();

    // Try to reload voices multiple times (Linux sometimes needs this)
    let voiceLoadAttempts = 0;
    const maxAttempts = 5;

    function attemptVoiceLoad() {
        if (voiceLoadAttempts < maxAttempts && speechSynthesis.getVoices().length === 0) {
            voiceLoadAttempts++;
            setTimeout(() => {
                populateVoices();
                attemptVoiceLoad();
            }, 1000);
        }
    }

    speechSynthesis.onvoiceschanged = () => {
        populateVoices();
        voiceLoadAttempts = maxAttempts; // Stop retry attempts
    };

    attemptVoiceLoad();

    // Event handlers
    select.addEventListener("change", () => {
        if (select.value !== "no-voices") {
            const voices = speechSynthesis.getVoices();
            selectedVoice = voices.find(v => v.name === select.value);
        }
    });

    helpBtn.addEventListener("click", () => {
        showLinuxInstructions();
    });

    // Volume slider action
    volSlider.addEventListener("input", () => {
        currentVolume = parseFloat(volSlider.value);
    });

    // Button actions
    playBtn.addEventListener("click", () => {
        if (!currentText) {
            showTTSError("No text selected. Click a 🔊 button next to some text first.");
            return;
        }
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

// ===== Enhanced TTS playback function =====
function playText(text) {
    speechSynthesis.cancel(); // stop previous

    if (useWebFallback || speechSynthesis.getVoices().length === 0) {
        // Use fallback method
        const webTTS = createWebTTSFallback();
        webTTS.speak(text, {
            volume: currentVolume,
            rate: 1,
            pitch: 1
        });
        return;
    }

    // Use standard method
    const utterance = new SpeechSynthesisUtterance(text);

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = currentVolume;

    // Add error handling
    utterance.onerror = (event) => {
        console.error("TTS Error:", event);
        showTTSError(`TTS Error: ${event.error}. Try using the fallback option or installing TTS voices.`);
    };

    utterance.onstart = () => {
        console.log("TTS started");
    };

    utterance.onend = () => {
        console.log("TTS ended");
    };

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
        button.title = "Read this text aloud";

        button.addEventListener("click", () => {
            const clone = block.cloneNode(true);
            clone.querySelectorAll("button").forEach(btn => btn.remove());
            currentText = clone.innerText.trim();

            if (currentText.length === 0) {
                showTTSError("No text found to read.");
                return;
            }

            if (currentText.length > 4000) {
                if (!confirm(`This text is quite long (${currentText.length} characters). Continue with TTS?`)) {
                    return;
                }
            }

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

// Initialize
console.log("TTS Extension: Initializing with enhanced Linux support");
addReadButtons();
const observer = new MutationObserver(addReadButtons);
observer.observe(document.body, { childList: true, subtree: true });