import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB-kJ0dNGFeEVmXbXD6zmrgZD1KUwFuHwo",
  authDomain: "database-maroc.firebaseapp.com",
  projectId: "database-maroc",
  storageBucket: "database-maroc.firebasestorage.app",
  messagingSenderId: "59418874824",
  appId: "1:59418874824:web:8075a756e030d6d138e6fd",
  measurementId: "G-SJ9T15LQPL"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
    const languageBtn = document.getElementById('languageBtn');
    const channelsContainer = document.getElementById('channelsContainer');
    const langFlag = document.getElementById('langFlag');
    
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
    let currentLanguage = 'en';
    
    const translations = {
        en: {
            live_now: "LIVE NOW",
            live: "LIVE",
            loading_stream: "Loading stream...",
            live_football_match: "Live Football Match",
            hd_quality: "HD Quality",
            sports_channels: "SPORTS CHANNELS",
            loading_channels: "Loading channels...",
            need_help: "NEED HELP WITH STREAMING?",
            contact_support: "Contact Support",
            upcoming_matches: "UPCOMING BIG MATCHES",
            loading_matches: "Loading big matches...",
            days: "Days",
            hours: "Hours",
            mins: "Mins",
            secs: "Secs",
            time_until_match: "Time until match:"
        },
        ar: {
            live_now: "Ø¨Ø« Ù…Ø¨Ø§Ø´Ø±",
            live: "Ù…Ø¨Ø§Ø´Ø±",
            loading_stream: "Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨Ø«...",
            live_football_match: "Ù…Ø¨Ø§Ø±Ø§Ø© ÙƒØ±Ø© Ù‚Ø¯Ù… Ù…Ø¨Ø§Ø´Ø±Ø©",
            hd_quality: "Ø¬ÙˆØ¯Ø© Ø¹Ø§Ù„ÙŠØ©",
            sports_channels: "Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ©",
            loading_channels: "Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù‚Ù†ÙˆØ§Øª...",
            need_help: "Ù‡Ù„ ØªØ­ØªØ§Ø¬ Ù…Ø³Ø§Ø¹Ø¯Ø© ÙÙŠ Ø§Ù„Ø¨Ø«ØŸ",
            contact_support: "Ø§ØªØµÙ„ Ø¨Ø§Ù„Ø¯Ø¹Ù…",
            upcoming_matches: "Ø§Ù„Ù…Ø¨Ø§Ø±ÙŠØ§Øª Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©",
            loading_matches: "Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø¨Ø§Ø±ÙŠØ§Øª...",
            days: "Ø£ÙŠØ§Ù…",
            hours: "Ø³Ø§Ø¹Ø§Øª",
            mins: "Ø¯Ù‚Ø§Ø¦Ù‚",
            secs: "Ø«ÙˆØ§Ù†ÙŠ",
            time_until_match: "Ø§Ù„ÙˆÙ‚Øª Ø­ØªÙ‰ Ø§Ù„Ù…Ø¨Ø§Ø±Ø§Ø©:"
        }
    };
    
    const monthNames = {
        en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        ar: ["ÙŠÙ†Ø§ÙŠØ±", "ÙØ¨Ø±Ø§ÙŠØ±", "Ù…Ø§Ø±Ø³", "Ø£Ø¨Ø±ÙŠÙ„", "Ù…Ø§ÙŠÙˆ", "ÙŠÙˆÙ†ÙŠÙˆ", "ÙŠÙˆÙ„ÙŠÙˆ", "Ø£ØºØ³Ø·Ø³", "Ø³Ø¨ØªÙ…Ø¨Ø±", "Ø£ÙƒØªÙˆØ¨Ø±", "Ù†ÙˆÙÙ…Ø¨Ø±", "Ø¯ÙŠØ³Ù…Ø¨Ø±"]
    };
    
    const sportsChannels = [
        {
            name: { en: "Dubai Sports 1", ar: "Ø¯Ø¨ÙŠ Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© 1" },
            logo: "https://www.dmi.gov.ae/content/dam/corporate/icons/DubaiSports-Logo-DMI.png",
            url: "https://dmidspta.cdn.mgmlcdn.com/dubaisports/smil:dubaisports.stream.smil/chunklist.m3u8",
            country: { en: "UAE", ar: "Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª" }
        },
        {
            name: { en: "Dubai Sports 2", ar: "Ø¯Ø¨ÙŠ Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© 2" },
            logo: "https://admango.cdn.mangomolo.com/analytics/uploads/71/616cb1ed64.png",
            url: "https://dmitwlvvll.cdn.mgmlcdn.com/dubaisportshd/smil:dubaisportshd.smil/chunklist.m3u8",
            country: { en: "UAE", ar: "Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª" }
        },
        {
            name: { en: "Dubai Sports 3", ar: "Ø¯Ø¨ÙŠ Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© 3" },
            logo: "https://admango.cdn.mangomolo.com/analytics/uploads/71/616cb297c7.png",
            url: "https://dmitwlvvll.cdn.mgmlcdn.com/dubaisportshd5/smil:dubaisportshd5.smil/chunklist.m3u8",
            country: { en: "UAE", ar: "Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª" }
        },
        {
            name: { en: "Sharjah Sports", ar: "Ø§Ù„Ø´Ø§Ø±Ù‚Ø© Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ©" },
            logo: "https://sbauae.faulio.com/storage/mediagallery/f5/3e/small_d83f05132cd8c44b47acc7062711d27c20a5ddc4.png",
            url: "https://svs.itworkscdn.net/smc4sportslive/smc4.smil/playlist.m3u8",
            country: { en: "UAE", ar: "Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª" }
        },
        {
            name: { en: "Bahrain Sports 1", ar: "Ø§Ù„Ø¨Ø­Ø±ÙŠÙ† Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© 1" },
            logo: "https://s3.eu-west-1.amazonaws.com//bahrainlive/Channel/6368542425885481476ef9db5b-f4c3-4844-be16-8129266e3a8e.png",
            url: "https://5c7b683162943.streamlock.net/live/ngrp:sportsone_all/playlist.m3u8",
            country: { en: "Bahrain", ar: "Ø§Ù„Ø¨Ø­Ø±ÙŠÙ†" }
        },
        {
            name: { en: "Bahrain Sports 2", ar: "Ø§Ù„Ø¨Ø­Ø±ÙŠÙ† Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© 2" },
            logo: "https://s3.eu-west-1.amazonaws.com//bahrainlive/Channel/63685424000079685751979f5d-e86c-4a27-a41e-935f13852840.png",
            url: "https://5c7b683162943.streamlock.net/live/ngrp:bahrainsportstwo_all/playlist.m3u8",
            country: { en: "Bahrain", ar: "Ø§Ù„Ø¨Ø­Ø±ÙŠÙ†" }
        }
    ];
    
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
    
    function setLanguage(lang) {
        currentLanguage = lang;
        document.documentElement.lang = lang;
        
        if (lang === 'ar') {
            document.body.classList.add('rtl');
            updateFlag('morocco');
            languageBtn.querySelector('.lang-text').textContent = 'AR';
            document.title = "WeSports - Ø¨Ø« Ù…Ø¨Ø§Ø´Ø± Ù…Ø¨Ø§Ø±ÙŠØ§Øª ÙƒØ±Ø© Ø§Ù„Ù‚Ø¯Ù… | Ù…Ø´Ø§Ù‡Ø¯Ø© Ù…Ø¨Ø§Ø±ÙŠØ§Øª Ø§Ù„ÙŠÙˆÙ… Ù…Ø¬Ø§Ù†Ø§Ù‹";
        } else {
            document.body.classList.remove('rtl');
            updateFlag('usa');
            languageBtn.querySelector('.lang-text').textContent = 'EN';
            document.title = "WeSports - Live Football Streaming | Watch Today's Matches Free";
        }
        
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });
        
        updateChannelsDisplay();
        updateMatchesDisplay();
    }
    
    function updateFlag(country) {
        if (country === 'morocco') {
            langFlag.innerHTML = '<div class="flag morocco"></div>';
        } else {
            langFlag.innerHTML = '<div class="flag usa"></div>';
        }
    }
    
    function updateChannelsDisplay() {
        const channelElements = channelsContainer.querySelectorAll('.channel-item');
        channelElements.forEach((element, index) => {
            const channel = sportsChannels[index];
            if (channel) {
                const nameElement = element.querySelector('.channel-name');
                const countryElement = element.querySelector('.channel-country');
                
                if (nameElement) {
                    nameElement.textContent = channel.name[currentLanguage];
                }
                
                if (countryElement) {
                    countryElement.textContent = channel.country[currentLanguage];
                }
            }
        });
    }
    
    function updateMatchesDisplay() {
        const matchElements = matchesContainer.querySelectorAll('.match-item');
        matchElements.forEach(element => {
            const countdownTitle = element.querySelector('.countdown-title');
            if (countdownTitle) {
                countdownTitle.textContent = translations[currentLanguage].time_until_match;
            }
            
            const countdownLabels = element.querySelectorAll('.countdown-label');
            if (countdownLabels.length >= 4) {
                countdownLabels[0].textContent = translations[currentLanguage].days;
                countdownLabels[1].textContent = translations[currentLanguage].hours;
                countdownLabels[2].textContent = translations[currentLanguage].mins;
                countdownLabels[3].textContent = translations[currentLanguage].secs;
            }
        });
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
    
    function loadSportsChannels() {
        channelsContainer.innerHTML = '';
        
        sportsChannels.forEach(channel => {
            const channelElement = document.createElement('div');
            channelElement.classList.add('channel-item');
            
            channelElement.innerHTML = `
                <div class="channel-logo">
                    <img src="${channel.logo}" alt="${channel.name.en}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTAiIGZpbGw9IiMxMzFhMmEiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTYgMTBMMTAgMTZNMTAgMTZMMTYgMjJNMTAgMTZIMjIiIHN0cm9rZT0iI2ZmM2U3YyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPg=='">
                </div>
                <div class="channel-name">${channel.name[currentLanguage]}</div>
                <div class="channel-country">${channel.country[currentLanguage]}</div>
            `;
            
            channelElement.addEventListener('click', () => {
                if (channel.url && channel.url !== '#') {
                    if (hls) {
                        hls.destroy();
                    }
                    
                    loadingSpinner.style.display = 'flex';
                    
                    if (Hls.isSupported()) {
                        hls = new Hls({
                            debug: false,
                            enableWorker: true,
                            lowLatencyMode: true,
                            backBufferLength: 90
                        });
                        hls.loadSource(channel.url);
                        hls.attachMedia(videoElement);
                        hls.on(Hls.Events.MANIFEST_PARSED, function() {
                            loadingSpinner.style.display = 'none';
                            videoElement.play();
                        });
                    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                        videoElement.src = channel.url;
                        videoElement.addEventListener('loadedmetadata', function() {
                            loadingSpinner.style.display = 'none';
                            videoElement.play();
                        });
                    }
                    
                    document.querySelector('.stream-title').textContent = channel.name[currentLanguage];
                }
            });
            
            channelsContainer.appendChild(channelElement);
        });
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
                    <div class="countdown-label">${translations[currentLanguage].days}</div>
                </div>
                <div class="countdown-unit">
                    <div class="countdown-value">${hours}</div>
                    <div class="countdown-label">${translations[currentLanguage].hours}</div>
                </div>
                <div class="countdown-unit">
                    <div class="countdown-value">${minutes}</div>
                    <div class="countdown-label">${translations[currentLanguage].mins}</div>
                </div>
                <div class="countdown-unit">
                    <div class="countdown-value">${seconds}</div>
                    <div class="countdown-label">${translations[currentLanguage].secs}</div>
                </div>
            `;
        }, 1000);
    }
    
    function formatMatchDate(date, lang) {
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day} ${monthNames[lang][monthIndex]} ${year}, ${hours}:${minutes}`;
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
    
        matchesContainer.innerHTML = `<div class="loading-matches">${translations[currentLanguage].loading_matches}</div>`;
    
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
                    
                    const formattedDate = formatMatchDate(matchDateTime, currentLanguage);
                    
                    matchItem.innerHTML = `
                        <div class="match-item-inner">
                            <div class="match-front">
                                <div class="match-teams">${event.strHomeTeam} vs ${event.strAwayTeam}</div>
                                <div class="match-date">${formattedDate}</div>
                            </div>
                            <div class="match-back">
                                <div class="countdown-title">${translations[currentLanguage].time_until_match}</div>
                                <div class="countdown-timer" id="countdown-${matchId}">
                                    <div class="countdown-unit">
                                        <div class="countdown-value">--</div>
                                        <div class="countdown-label">${translations[currentLanguage].days}</div>
                                    </div>
                                    <div class="countdown-unit">
                                        <div class="countdown-value">--</div>
                                        <div class="countdown-label">${translations[currentLanguage].hours}</div>
                                    </div>
                                    <div class="countdown-unit">
                                        <div class="countdown-value">--</div>
                                        <div class="countdown-label">${translations[currentLanguage].mins}</div>
                                    </div>
                                    <div class="countdown-unit">
                                        <div class="countdown-value">--</div>
                                        <div class="countdown-label">${translations[currentLanguage].secs}</div>
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
                matchesContainer.innerHTML = `<div class="loading-matches">${currentLanguage === 'ar' ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¨Ø§Ø±ÙŠØ§Øª ÙƒØ¨ÙŠØ±Ø© ÙÙŠ Ø§Ù„Ù€ 20 ÙŠÙˆÙ…Ù‹Ø§ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©.' : 'No big matches in the next 20 days.'}</div>`;
            }
        })
        .catch(error => {
            matchesContainer.innerHTML = `<div class="loading-matches">${currentLanguage === 'ar' ? 'Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø¨Ø§Ø±ÙŠØ§Øª.' : 'Error loading matches.'}</div>`;
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
        
        languageBtn.addEventListener('click', function() {
            const newLang = currentLanguage === 'en' ? 'ar' : 'en';
            setLanguage(newLang);
            localStorage.setItem('preferredLanguage', newLang);
            
            if (matchesContainer.children.length > 0) {
                fetchMatches();
            }
        });
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam === 'ar') {
        setLanguage('ar');
    } else if (langParam === 'en') {
        setLanguage('en');
    } else {
        const savedLang = localStorage.getItem('preferredLanguage') || 'en';
        setLanguage(savedLang);
    }
    
    initVideoPlayer();
    initEvents();
    setupReportButton();
    loadSportsChannels();
    fetchMatches();
});