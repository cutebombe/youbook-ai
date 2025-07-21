// Configuration - YOU WILL UPDATE THIS WITH YOUR COLAB URL
const BACKEND_URL = 'YOUR_COLAB_NGROK_URL_HERE'; // We'll update this later

document.addEventListener('DOMContentLoaded', function() {
    const videoInputsContainer = document.getElementById('video-inputs');
    const form = document.getElementById('youbook-form');
    const statusSection = document.getElementById('status-section');
    const progressBar = document.getElementById('progress-bar');
    const statusMessage = document.getElementById('status-message');
    const resultsSection = document.getElementById('results-section');
    const resultsList = document.getElementById('results-list');

    // Create 5 video input sections
    for (let i = 1; i <= 5; i++) {
        const videoDiv = document.createElement('div');
        videoDiv.className = 'video-section';
        videoDiv.innerHTML = `
            <h6><i class="fas fa-video me-2"></i>Video ${i}</h6>
            <div class="mb-3">
                <label for="video-url-${i}" class="form-label">YouTube URL</label>
                <input type="url" class="form-control" id="video-url-${i}" 
                       placeholder="https://www.youtube.com/watch?v=...">
            </div>
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <label class="form-label">Start Time</label>
                    <div class="time-input">
                        <input type="number" class="form-control" id="start-h-${i}" 
                               placeholder="H" min="0" value="0">
                        <span class="time-separator">:</span>
                        <input type="number" class="form-control" id="start-m-${i}" 
                               placeholder="M" min="0" max="59" value="0">
                        <span class="time-separator">:</span>
                        <input type="number" class="form-control" id="start-s-${i}" 
                               placeholder="S" min="0" max="59" value="0">
                    </div>
                </div>
                <div class="col-md-6">
                    <label class="form-label">End Time</label>
                    <div class="time-input">
                        <input type="number" class="form-control" id="end-h-${i}" 
                               placeholder="H" min="0" value="0">
                        <span class="time-separator">:</span>
                        <input type="number" class="form-control" id="end-m-${i}" 
                               placeholder="M" min="0" max="59" value="1">
                        <span class="time-separator">:</span>
                        <input type="number" class="form-control" id="end-s-${i}" 
                               placeholder="S" min="0" max="59" value="0">
                    </div>
                </div>
            </div>
            <div class="mb-0">
                <label for="video-title-${i}" class="form-label">Initial Title</label>
                <input type="text" class="form-control" id="video-title-${i}" 
                       placeholder="Enter a temporary title here">
            </div>
        `;
        videoInputsContainer.appendChild(videoDiv);
    }

    // Handle form submission
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Show status section
        statusSection.style.display = 'block';
        statusSection.scrollIntoView({ behavior: 'smooth' });
        updateProgress(0, 'Collecting data...');

        // Collect form data
        const formData = {
            videos: [],
            gemini_prompt: document.getElementById('gemini-prompt').value,
            facebook: {
                page_id: document.getElementById('fb-page-id').value,
                access_token: document.getElementById('fb-access-token').value,
                start_datetime: document.getElementById('start-datetime').value,
                interval_minutes: parseInt(document.getElementById('interval-minutes').value)
            }
        };

        // Collect video data
        for (let i = 1; i <= 5; i++) {
            const url = document.getElementById(`video-url-${i}`).value;
            if (url.trim()) {
                formData.videos.push({
                    url: url.trim(),
                    title: document.getElementById(`video-title-${i}`).value,
                    start_time: `${document.getElementById(`start-h-${i}`).value}:${document.getElementById(`start-m-${i}`).value}:${document.getElementById(`start-s-${i}`).value}`,
                    end_time: `${document.getElementById(`end-h-${i}`).value}:${document.getElementById(`end-m-${i}`).value}:${document.getElementById(`end-s-${i}`).value}`
                });
            }
        }

        if (formData.videos.length === 0) {
            showError('Please add at least one video URL.');
            return;
        }

        updateProgress(10, 'Data collected. Sending to backend...');

        try {
            // Send to backend
            const response = await fetch(`${BACKEND_URL}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                updateProgress(100, 'All videos processed and scheduled successfully!');
                showResults(result.results);
            } else {
                showError(result.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Error:', error);
            showError(`Failed to connect to backend: ${error.message}`);
        }
    });

    function updateProgress(percentage, message) {
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
        progressBar.innerText = percentage + '%';
        statusMessage.innerText = message;
        
        if (percentage === 100) {
            progressBar.classList.remove('progress-bar-animated');
            progressBar.classList.add('bg-success');
        }
    }

    function showError(message) {
        statusMessage.innerHTML = `<i class="fas fa-exclamation-triangle text-danger me-2"></i>${message}`;
        progressBar.classList.remove('progress-bar-animated');
        progressBar.classList.add('bg-danger');
    }

    function showResults(results) {
        resultsSection.style.display = 'block';
        resultsList.innerHTML = '';
        
        results.forEach((result, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <div>
                    <strong>Video ${index + 1}:</strong> ${result.title}
                    <br><small class="text-muted">Scheduled for: ${result.scheduled_time}</small>
                </div>
                <span class="badge bg-success rounded-pill">
                    <i class="fas fa-check"></i>
                </span>
            `;
            resultsList.appendChild(listItem);
        });
    }
});