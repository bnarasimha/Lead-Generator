let mediaRecorder;
let audioChunks = [];

function setupRecorder() {
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const audioPlayback = document.getElementById('audioPlayback');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadForm = document.getElementById('uploadForm');

    if (uploadBtn) uploadBtn.style.display = 'none';
    if (uploadForm) {
        uploadForm.onsubmit = function(e) {
            e.preventDefault();
            return false;
        };
    }

    if (recordBtn) {
        recordBtn.onclick = async function() {
            audioChunks = [];
            let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = e => {
                audioChunks.push(e.data);
            };
            mediaRecorder.onstop = function() {
                let blob = new Blob(audioChunks, { type: 'audio/wav' });
                let url = URL.createObjectURL(blob);
                if (audioPlayback) {
                    audioPlayback.src = url;
                    audioPlayback.style.display = 'block';
                }
                console.log('Calling sendAudioForTranscription');
                sendAudioForTranscription(blob);
            };
            mediaRecorder.start();
            recordBtn.disabled = true;
            stopBtn.disabled = false;
        };
    }

    if (stopBtn) {
        stopBtn.onclick = function() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                recordBtn.disabled = false;
                stopBtn.disabled = true;
            }
        };
    }
}

function sendAudioForTranscription(blob) {
    showLoading();
    let formData = new FormData();
    formData.append('file', blob, 'recording.wav');
    fetch('/upload-audio', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(html => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, 'text/html');
        let newContainer = doc.querySelector('.container');
        document.querySelector('.container').replaceWith(newContainer);
        setupRecorder(); // Re-attach listeners
    })
    .catch(err => {
        hideLoading();
        alert('Transcription failed. Please try again.');
    });
}

function showLoading() {
    let container = document.querySelector('.container');
    let loading = document.createElement('div');
    loading.className = 'loading-indicator';
    loading.style.margin = '1.5rem 0';
    loading.innerHTML = '<b>Transcribing...</b>';
    container.appendChild(loading);
}

function hideLoading() {
    let loading = document.querySelector('.loading-indicator');
    if (loading) loading.remove();
}

// Initial setup
setupRecorder(); 