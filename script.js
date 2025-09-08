document.addEventListener('DOMContentLoaded', function() {
    const videoElement = document.getElementById('videoElement');
    const videoOverlay = document.getElementById('videoOverlay');
    const bigPlayBtn = document.getElementById('bigPlayBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progressBar = document.getElementById('progress');
    const progressContainer = document.getElementById('progressBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const liveBtn = document.getElementById('liveBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const reportBtn = document.getElementById('reportBtn');
    const videoContainer = document.getElementById('videoContainer');
    const matchesContainer = document.getElementById('matchesContainer');
    const videoControls = document.getElementById('videoControls');
    
    let isPlaying = false;
    let isLive = true;
    let hls = null;
    let userIP = "Unknown";
    let userCity = "Unknown";
    let userCountry = "Unknown Country";
    let userDevice = "Unknown Device";
    let errors = [];
    let controlsTimer = null;
    let hasPlayed = false;
    let countdownIntervals = {};
    
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let deviceInfo = "";
        
        if (/iPhone/i.test(ua)) {
            deviceInfo = "iPhone";
            const match = ua.match(/iPhone OS (\d+)_/);
            if (match) deviceInfo += " iOS " + match[1];
        } else if (/iPad/i.test(ua)) {
            deviceInfo = "iPad";
            const match = ua.match(/iPad; CPU OS (\d+)_/);
            if (match) deviceInfo += " iOS " + match[1];
        } else if (/Android/i.test(ua)) {
            deviceInfo = "Android";
            const match = ua.match(/Android (\d+)/);
            if (match) deviceInfo += " " + match[1];
            
            const modelMatch = ua.match(/; ([^;]+) Build\//);
            if (modelMatch && modelMatch[1]) {
                deviceInfo += "; " + modelMatch[1];
            }
        } else if (/Windows/i.test(ua)) {
            deviceInfo = "Windows PC";
            const match = ua.match(/Windows NT (\d+\.\d+)/);
            if (match) deviceInfo += " " + match[1];
        } else if (/Macintosh/i.test(ua)) {
            deviceInfo = "Mac";
            const match = ua.match(/Mac OS X (\d+[._]\d+)/);
            if (match) deviceInfo += " OS X " + match[1].replace('_', '.');
        } else if (/Linux/i.test(ua)) {
            deviceInfo = "Linux PC";
        } else {
            deviceInfo = "Unknown Device";
        }
        
        return deviceInfo;
    }
    
    fetch('https://ipwhois.app/json/')
    .then(response => response.json())
    .then(data => {
        userIP = data.ip || "Unknown IP";
        userCity = data.city || "Unknown City";
        userCountry = data.country || "Unknown Country";
        userDevice = getDeviceInfo();
    })
    .catch(err => {
        userIP = "Unknown IP";
        userCity = "Unknown City";
        userCountry = "Unknown Country";
        userDevice = getDeviceInfo();
    });
    
    window.onerror = function(message, source, lineno, colno, error) {
        errors.push(`${message} at ${source}:${lineno}:${colno}`);
    };
    
    window.addEventListener('unhandledrejection', function(event) {
        errors.push(`Unhandled Promise: ${event.reason}`);
    });
    
    function initVideoPlayer() {
        const streamUrl = 'https://balance.footballii.ir/hls2/b1.m3u8';
        
        if (Hls.isSupported()) {
            hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                loadingSpinner.style.display = 'none';
            });
            
            hls.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            initVideoPlayer();
                            break;
                    }
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = streamUrl;
            videoElement.addEventListener('loadedmetadata', function() {
                loadingSpinner.style.display = 'none';
            });
        } else {
            loadingSpinner.querySelector('.loading-text').textContent = 'Browser not supported';
        }
    }
    
    function togglePlayPause() {
        if (videoElement.paused) {
            videoElement.play()
                .then(() => {
                    isPlaying = true;
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    videoOverlay.classList.add('hidden');
                    hasPlayed = true;
                })
                .catch(err => {
                    videoOverlay.classList.remove('hidden');
                });
        } else {
            videoElement.pause();
            isPlaying = false;
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    function updateProgress() {
        if (isLive) {
            timeDisplay.textContent = 'LIVE';
            progressBar.style.width = '100%';
        } else if (!isNaN(videoElement.duration)) {
            const value = (videoElement.currentTime / videoElement.duration) * 100;
            progressBar.style.width = value + '%';
            
            const currentTime = formatTime(videoElement.currentTime);
            timeDisplay.textContent = `${currentTime}`;
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen().catch(err => {
                    videoElement.requestFullscreen().catch(err => {
                        console.error('Error attempting to enable fullscreen:', err);
                    });
                });
            } else if (videoContainer.webkitRequestFullscreen) {
                videoContainer.webkitRequestFullscreen();
            } else if (videoContainer.msRequestFullscreen) {
                videoContainer.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    function goLive() {
        if (hls) {
            hls.liveSyncPosition = undefined;
            videoElement.currentTime = videoElement.duration;
        } else {
            videoElement.currentTime = videoElement.duration;
        }
    }
    
    function setupReportButton() {
        reportBtn.addEventListener('click', () => {
            const phoneNumber = "+212602661365";
            let errorText = errors.length > 0 ? errors.join(" | ") : "No errors detected";
            
            const message = "```" +
                            "===== REPORT ISSUE =====\n" +
                            "IP     : " + userIP + "\n" +
                            "City   : " + userCity + "\n" +
                            "Device : " + userDevice + "\n" +
                            "Errors : " + errorText + "\n" +
                            "========================" +
                            "```";
            
            const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        });
    }
    
    function showControls() {
        videoControls.classList.add('visible');
        
        if (controlsTimer) {
            clearTimeout(controlsTimer);
        }
        
        controlsTimer = setTimeout(() => {
            videoControls.classList.remove('visible');
        }, 3000);
    }
    
    function startCountdown(matchId, matchDateTime) {
        if (countdownIntervals[matchId]) {
            clearInterval(countdownIntervals[matchId]);
        }
        
        countdownIntervals[matchId] = setInterval(() => {
            const now = new Date();
            const timeRemaining = matchDateTime - now;
            
            if (timeRemaining <= 0) {
                clearInterval(countdownIntervals[matchId]);
                document.getElementById(`countdown-${matchId}`).innerHTML = `
                    <div class="countdown-value">LIVE</div>
                `;
                return;
            }
            
            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
            
            document.getElementById(`countdown-${matchId}`).innerHTML = `
                <div class="countdown-unit">
                    <div class="countdown-value">${days}</div>
                    <div class="countdown-label">Days</div>
                </div>
                <div class="countdown-unit">
                    <div class="countdown-value">${hours}</div>
                    <div class="countdown-label">Hours</div>
                </div>
                <div class="countdown-unit">
                    <div class="countdown-value">${minutes}</div>
                    <div class="countdown-label">Mins</div>
                </div>
                <div class="countdown-unit">
                    <div class="countdown-value">${seconds}</div>
                    <div class="countdown-label">Secs</div>
                </div>
            `;
        }, 1000);
    }
    
    function fetchMatches() {
        const leagueIds = ["4328","4335","4331","4332","4334","4401","4679"];
        const bigTeams = [
            "Manchester United", "Liverpool", "Chelsea", "Arsenal", "Manchester City", "Tottenham Hotspur",
            "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Valencia",
            "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Schalke 04",
            "Juventus", "Inter Milan", "AC Milan", "Napoli", "Roma",
            "PSG", "Lyon", "Marseille",
            "Ajax", "Benfica", "Porto",
            "Argentina", "Brazil", "Germany", "France", "Spain", "Italy", "Portugal", "Netherlands",
            "Morocco"
        ];
    
        matchesContainer.innerHTML = '<div class="loading-matches">Loading big matches...</div>';
    
        Promise.all(leagueIds.map(leagueId => 
            fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=${leagueId}`)
                .then(response => response.json())
                .then(data => data.events || [])
                .catch(error => {
                    return [];
                })
        ))
        .then(allMatches => {
            const matches = allMatches.flat();
            
            const today = new Date();
            const in20Days = new Date();
            in20Days.setDate(today.getDate() + 20);
    
            const filteredMatches = matches.filter(event => {
                if (!event.dateEvent) return false;
                const matchDate = new Date(event.dateEvent);
                const homeBig = bigTeams.includes(event.strHomeTeam);
                const awayBig = bigTeams.includes(event.strAwayTeam);
                const isRMBarca = event.strHomeTeam === "Real Madrid" || event.strAwayTeam === "Real Madrid" ||
                                event.strHomeTeam === "Barcelona" || event.strAwayTeam === "Barcelona";
                return matchDate >= today && matchDate <= in20Days && ( (homeBig && awayBig) || isRMBarca );
            });
    
            filteredMatches.sort((a, b) => new Date(a.dateEvent) - new Date(b.dateEvent));
    
            if (filteredMatches.length > 0) {
                matchesContainer.innerHTML = '';
                
                filteredMatches.slice(0, 5).forEach((event, index) => {
                    const matchId = `match-${index}`;
                    let matchDateTime;
                    
                    try {
                        matchDateTime = new Date(`${event.dateEvent}T${event.strTime}Z`);
                    } catch (e) {
                        matchDateTime = new Date();
                        matchDateTime.setDate(matchDateTime.getDate() + 1);
                    }
                    
                    const matchItem = document.createElement('div');
                    matchItem.classList.add('match-item');
                    matchItem.id = matchId;
                    
                    const options = { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit'
                    };
                    
                    const localTime = matchDateTime.toLocaleString('en-US', options);
                    
                    matchItem.innerHTML = `
                        <div class="match-item-inner">
                            <div class="match-front">
                                <div class="match-teams">${event.strHomeTeam} vs ${event.strAwayTeam}</div>
                                <div class="match-date">${localTime} ${userCountry}</div>
                            </div>
                            <div class="match-back">
                                <div class="countdown-title">Time until match:</div>
                                <div class="countdown-timer" id="countdown-${matchId}">
                                    <div class="countdown-unit">
                                        <div class="countdown-value">--</div>
                                        <div class="countdown-label">Days</div>
                                    </div>
                                    <div class="countdown-unit">
                                        <div class="countdown-value">--</div>
                                        <div class="countdown-label">Hours</div>
                                    </div>
                                    <div class="countdown-unit">
                                        <div class="countdown-value">--</div>
                                        <div class="countdown-label">Mins</div>
                                    </div>
                                    <div class="countdown-unit">
                                        <div class="countdown-value">--</div>
                                        <div class="countdown-label">Secs</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    matchesContainer.appendChild(matchItem);
                    
                    matchItem.addEventListener('click', function() {
                        this.classList.toggle('flipped');
                        
                        if (this.classList.contains('flipped')) {
                            startCountdown(matchId, matchDateTime);
                        }
                    });
                    
                    if (index === 0) {
                        startCountdown(matchId, matchDateTime);
                    }
                });
            } else {
                matchesContainer.innerHTML = `<div class="loading-matches">No big matches in the next 20 days. ${userCountry}</div>`;
            }
        })
        .catch(error => {
            matchesContainer.innerHTML = `<div class="loading-matches">Error loading matches. ${userCountry}</div>`;
        });
    }
    
    function initEvents() {
        bigPlayBtn.addEventListener('click', togglePlayPause);
        playPauseBtn.addEventListener('click', togglePlayPause);
        videoElement.addEventListener('timeupdate', updateProgress);
        videoElement.addEventListener('waiting', () => {
            loadingSpinner.style.display = 'flex';
        });
        videoElement.addEventListener('playing', () => {
            loadingSpinner.style.display = 'none';
        });
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        liveBtn.addEventListener('click', goLive);
        
        progressContainer.addEventListener('click', (e) => {
            if (!isLive && !isNaN(videoElement.duration)) {
                const pos = (e.pageX - progressContainer.getBoundingClientRect().left) / progressContainer.offsetWidth;
                videoElement.currentTime = pos * videoElement.duration;
            }
        });
        
        videoContainer.addEventListener('click', function(e) {
            if (e.target !== bigPlayBtn && !bigPlayBtn.contains(e.target)) {
                if (!hasPlayed) {
                    togglePlayPause();
                } else {
                    showControls();
                }
            }
        });
        
        videoContainer.addEventListener('mousemove', function() {
            if (hasPlayed) {
                showControls();
            }
        });
    }
    
    initVideoPlayer();
    initEvents();
    setupReportButton();
    fetchMatches();
});