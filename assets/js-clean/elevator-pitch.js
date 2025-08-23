/**
 * Elevator Pitch Video Controller
 * 
 * Handles video player interactions, security, and analytics
 * for the elevator pitch section.
 * 
 * @author Brahim El Houss
 */

class ElevatorPitchController {
    constructor() {
        this.video = document.getElementById('elevator-pitch-video');
        this.overlay = document.getElementById('video-overlay');
        this.playButton = document.getElementById('play-button');
        this.videoWrapper = document.querySelector('.video-wrapper');
        
        this.isPlaying = false;
        this.hasStarted = false;
        this.viewStartTime = null;
        
        this.init();
    }

    /**
     * Initialize video controller
     */
    init() {
        if (!this.video || !this.overlay || !this.playButton) {
            console.warn('[ElevatorPitchController] Video elements not found');
            return;
        }

        this.setupEventListeners();
        this.setupVideoSecurity();
        this.preloadVideo();
        
        console.debug('[ElevatorPitchController] Initialized');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Play button click
        this.playButton.addEventListener('click', () => this.playVideo());
        
        // Video overlay click
        this.overlay.addEventListener('click', () => this.playVideo());
        
        // Video events
        this.video.addEventListener('loadstart', () => this.onLoadStart());
        this.video.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.video.addEventListener('play', () => this.onPlay());
        this.video.addEventListener('pause', () => this.onPause());
        this.video.addEventListener('ended', () => this.onEnded());
        this.video.addEventListener('error', (e) => this.onError(e));
        this.video.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Prevent common video download attempts
        this.video.addEventListener('dragstart', (e) => e.preventDefault());
        this.video.addEventListener('selectstart', (e) => e.preventDefault());
        
        // Track viewing progress
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Setup video security measures
     */
    setupVideoSecurity() {
        // Disable right-click menu
        this.video.setAttribute('oncontextmenu', 'return false;');
        
        // Disable drag and drop
        this.video.setAttribute('draggable', 'false');
        
        // Add additional security attributes
        this.video.setAttribute('controlslist', 'nodownload noremoteplayback');
        this.video.setAttribute('disablepictureinpicture', 'true');
        
        // Monitor for suspicious activity
        this.monitorSuspiciousActivity();
    }

    /**
     * Preload video metadata
     */
    preloadVideo() {
        this.video.preload = 'metadata';
        this.videoWrapper.classList.add('loading');
    }

    /**
     * Play the video
     */
    async playVideo() {
        try {
            if (!this.hasStarted) {
                this.trackVideoStart();
                this.hasStarted = true;
            }
            
            await this.video.play();
            this.hideOverlay();
            this.isPlaying = true;
            
        } catch (error) {
            console.error('[ElevatorPitchController] Play error:', error);
            this.showError('Unable to play video. Please try again.');
        }
    }

    /**
     * Pause the video
     */
    pauseVideo() {
        this.video.pause();
        this.isPlaying = false;
    }

    /**
     * Hide video overlay
     */
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }

    /**
     * Show video overlay
     */
    showOverlay() {
        this.overlay.classList.remove('hidden');
    }

    /**
     * Handle video load start
     */
    onLoadStart() {
        this.videoWrapper.classList.add('loading');
        console.debug('[ElevatorPitchController] Video loading started');
    }

    /**
     * Handle metadata loaded
     */
    onMetadataLoaded() {
        this.videoWrapper.classList.remove('loading');
        
        // Update duration display if needed
        const duration = this.formatDuration(this.video.duration);
        const durationElement = document.querySelector('.video-duration');
        if (durationElement && this.video.duration) {
            durationElement.textContent = duration;
        }
        
        console.debug('[ElevatorPitchController] Video metadata loaded');
    }

    /**
     * Handle video play
     */
    onPlay() {
        this.hideOverlay();
        this.isPlaying = true;
        this.viewStartTime = Date.now();
        console.debug('[ElevatorPitchController] Video playing');
    }

    /**
     * Handle video pause
     */
    onPause() {
        this.isPlaying = false;
        
        // Don't show overlay if video ended
        if (!this.video.ended) {
            this.showOverlay();
        }
        
        console.debug('[ElevatorPitchController] Video paused');
    }

    /**
     * Handle video ended
     */
    onEnded() {
        this.isPlaying = false;
        this.showOverlay();
        this.trackVideoComplete();
        console.debug('[ElevatorPitchController] Video ended');
    }

    /**
     * Handle video error
     */
    onError(event) {
        console.error('[ElevatorPitchController] Video error:', event);
        this.showError('Video playback error. Please refresh and try again.');
    }

    /**
     * Handle time updates for progress tracking
     */
    onTimeUpdate() {
        if (!this.video.duration || !this.hasStarted) return;
        
        const progress = (this.video.currentTime / this.video.duration) * 100;
        
        // Track viewing milestones
        if (progress >= 25 && !this.tracked25) {
            this.trackVideoProgress(25);
            this.tracked25 = true;
        } else if (progress >= 50 && !this.tracked50) {
            this.trackVideoProgress(50);
            this.tracked50 = true;
        } else if (progress >= 75 && !this.tracked75) {
            this.trackVideoProgress(75);
            this.tracked75 = true;
        }
    }

    /**
     * Handle keyboard controls
     */
    handleKeyboard(event) {
        // Only handle if video is in viewport and focused
        if (!this.isVideoInViewport() || document.activeElement !== this.video) {
            return;
        }

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (this.isPlaying) {
                    this.pauseVideo();
                } else {
                    this.playVideo();
                }
                break;
            case 'Escape':
                if (this.isPlaying) {
                    this.pauseVideo();
                }
                break;
        }
    }

    /**
     * Check if video is in viewport
     */
    isVideoInViewport() {
        const rect = this.video.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
    }

    /**
     * Monitor for suspicious activity
     */
    monitorSuspiciousActivity() {
        // Monitor for developer tools
        let devtools = { open: false };
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    console.warn('[Security] Developer tools detected');
                    devtools.open = true;
                }
            } else {
                devtools.open = false;
            }
        }, 1000);

        // Monitor for screen recording (basic detection)
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
            navigator.mediaDevices.getDisplayMedia = function(...args) {
                console.warn('[Security] Screen capture attempt detected');
                return originalGetDisplayMedia.apply(this, args);
            };
        }
    }

    /**
     * Track video start
     */
    trackVideoStart() {
        this.sendAnalytics('video_start', {
            video: 'elevator-pitch',
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        });
    }

    /**
     * Track video progress
     */
    trackVideoProgress(percentage) {
        this.sendAnalytics('video_progress', {
            video: 'elevator-pitch',
            progress: percentage,
            timestamp: Date.now()
        });
    }

    /**
     * Track video completion
     */
    trackVideoComplete() {
        const watchTime = this.viewStartTime ? Date.now() - this.viewStartTime : 0;
        
        this.sendAnalytics('video_complete', {
            video: 'elevator-pitch',
            watchTime: watchTime,
            timestamp: Date.now()
        });
    }

    /**
     * Send analytics data
     */
    sendAnalytics(event, data) {
        // Send to your analytics endpoint
        if (typeof gtag !== 'undefined') {
            gtag('event', event, data);
        }
        
        // Log for debugging
        console.debug(`[Analytics] ${event}:`, data);
    }

    /**
     * Format duration in MM:SS format
     */
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'video-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        
        this.videoWrapper.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ElevatorPitchController();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElevatorPitchController;
}