let recordBtn = document.getElementById('recordBtn');
let stopBtn = document.getElementById('stopBtn');
let audioPlayback = document.getElementById('audioPlayback');
let audioFileInput = document.getElementById('audioFile');
let uploadBtn = document.getElementById('uploadBtn');
let uploadForm = document.getElementById('uploadForm');

let mediaRecorder;
let audioChunks = [];

recordBtn.onclick = async function() {
    audioChunks = [];
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    mediaRecorder.ondataavailable = e => {
        audioChunks.push(e.data);
    };
    mediaRecorder.onstop = e => {
        let blob = new Blob(audioChunks, { type: 'audio/wav' });
        let url = URL.createObjectURL(blob);
        audioPlayback.src = url;
        audioPlayback.style.display = 'block';
        // Set file input for upload
        let file = new File([blob], 'recording.wav', { type: 'audio/wav' });
        let dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        audioFileInput.files = dataTransfer.files;
        uploadBtn.disabled = false;
    };
};

stopBtn.onclick = function() {
    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
};

uploadForm.onsubmit = function() {
    uploadBtn.disabled = true;
}; 