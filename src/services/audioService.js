import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

class AudioService {
  constructor() {
    this.player = null;
    this.statusSubscription = null;
    this.currentSong = null;
    this.queue = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.duration = 0;
    this.position = 0;
    this.isBuffering = false;
    this.repeatMode = 'off'; // 'off' | 'all' | 'one'
    this.isShuffle = false;
    this.playbackRate = 1.0; // 0.85 | 1.0 | 1.25 | 1.5
    this.sleepTimerMinutes = 0;
    this.sleepTimerRemainingSec = 0;
    this.sleepInterval = null;
    this.statusListeners = new Set();
    this.songChangeListeners = new Set();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Gagal menginisialisasi mode audio:', error);
    }
  }

  subscribeStatus(listener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  subscribeSongChange(listener) {
    this.songChangeListeners.add(listener);
    return () => this.songChangeListeners.delete(listener);
  }

  notifyStatus() {
    const statusData = {
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      duration: this.duration,
      position: this.position,
      isBuffering: this.isBuffering,
      repeatMode: this.repeatMode,
      isShuffle: this.isShuffle,
      playbackRate: this.playbackRate,
      sleepTimerMinutes: this.sleepTimerMinutes,
      sleepTimerRemainingSec: this.sleepTimerRemainingSec,
      currentIndex: this.currentIndex,
      queueLength: this.queue.length,
    };
    this.statusListeners.forEach((fn) => fn(statusData));
  }

  notifySongChange() {
    this.songChangeListeners.forEach((fn) => fn(this.currentSong));
  }

  updateLockScreenAndMediaSession(song) {
    if (!song) return;

    // Native iOS Lock Screen & Control Center Now Playing Info
    try {
      if (this.player && typeof this.player.setActiveForLockScreen === 'function') {
        this.player.setActiveForLockScreen(true, {
          title: song.title || 'SoundVault',
          artist: song.artist || 'Unknown Artist',
          albumTitle: song.album || 'SoundVault',
          artworkUrl: song.coverUri || undefined,
        });
      }
    } catch (e) {
      // Abaikan di platform web jika tidak didukung
    }

    // Web MediaSession API
    try {
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        // eslint-disable-next-line no-undef
        if (typeof MediaMetadata !== 'undefined') {
          // eslint-disable-next-line no-undef
          navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title || 'SoundVault',
            artist: song.artist || 'Unknown Artist',
            album: song.album || 'SoundVault',
            artwork: song.coverUri ? [{ src: song.coverUri }] : [],
          });
        }
        navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previousSong());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextSong());
      }
    } catch (e) {
      // Abaikan
    }
  }

  setQueue(songs, startIndex = 0) {
    this.queue = [...songs];
    this.currentIndex = startIndex;
  }

  preloadSong(song, queue = []) {
    if (!song) return;
    this.currentSong = song;
    this.queue = [...queue];
    this.currentIndex = this.queue.findIndex((s) => s.id === song.id);
    this.duration = song.duration || 0;
    this.position = 0;
    this.isPlaying = false;
    this.notifyStatus();
  }

  async playAll(songs, shuffle = false) {
    if (!songs || songs.length === 0) return;
    this.isShuffle = shuffle;
    const startIdx = shuffle ? Math.floor(Math.random() * songs.length) : 0;
    await this.playSong(songs[startIdx], songs, startIdx);
  }

  cleanupCurrentPlayer() {
    if (this.statusSubscription) {
      try {
        this.statusSubscription.remove();
      } catch (e) {
        // Abaikan
      }
      this.statusSubscription = null;
    }
    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch (e) {
        // Abaikan
      }
      this.player = null;
    }
  }

  async playSong(song, queue = null, index = -1) {
    await this.init();

    if (queue) {
      this.queue = [...queue];
      this.currentIndex = index >= 0 ? index : this.queue.findIndex((s) => s.id === song.id);
    }

    try {
      this.cleanupCurrentPlayer();

      const player = createAudioPlayer(
        { uri: song.uri },
        {
          updateInterval: 250,
          keepAudioSessionActive: true,
        }
      );

      this.player = player;
      this.currentSong = song;

      this.statusSubscription = player.addListener(
        'playbackStatusUpdate',
        this.onPlaybackStatusUpdate.bind(this)
      );

      try {
        player.shouldCorrectPitch = true;
        if (this.playbackRate !== 1.0) {
          player.setPlaybackRate(this.playbackRate);
        }
      } catch (e) {
        // Abaikan
      }

      this.updateLockScreenAndMediaSession(song);
      player.play();

      this.isPlaying = true;
      this.notifySongChange();
      this.notifyStatus();
    } catch (error) {
      console.error('Error saat memutar lagu:', error);
      this.isPlaying = false;
      this.notifyStatus();
    }
  }

  onPlaybackStatusUpdate(status) {
    if (!status) return;

    this.position = Math.max(0, (status.currentTime || 0) * 1000);
    if (status.duration && status.duration > 0) {
      this.duration = status.duration * 1000;
    }
    this.isPlaying = Boolean(status.playing);
    this.isBuffering = Boolean(status.isBuffering);

    if (status.didJustFinish) {
      this.handleSongFinished();
      return;
    }

    this.notifyStatus();
  }

  async handleSongFinished() {
    if (this.repeatMode === 'one') {
      if (this.player) {
        try {
          await this.player.seekTo(0);
          this.player.play();
        } catch (e) {
          if (this.currentSong) {
            await this.playSong(this.currentSong);
          }
        }
      }
    } else {
      await this.nextSong(false);
    }
  }

  async togglePlayPause() {
    if (!this.player) {
      if (this.currentSong) {
        await this.playSong(this.currentSong);
      } else if (this.queue.length > 0) {
        await this.playSong(this.queue[0], this.queue, 0);
      }
      return;
    }

    if (this.isPlaying) {
      this.player.pause();
      this.isPlaying = false;
    } else {
      this.player.play();
      this.isPlaying = true;
    }
    this.notifyStatus();
  }

  async pause() {
    if (this.player && this.isPlaying) {
      this.player.pause();
      this.isPlaying = false;
      this.notifyStatus();
    }
  }

  async seekTo(positionMillis) {
    if (!this.player) return;
    try {
      await this.player.seekTo(Math.max(0, positionMillis / 1000));
      this.position = positionMillis;
      this.notifyStatus();
    } catch (error) {
      console.error('Error saat seek:', error);
    }
  }

  async nextSong(manual = true) {
    if (this.queue.length === 0) return;

    let nextIndex = this.currentIndex + 1;

    if (this.isShuffle) {
      nextIndex = Math.floor(Math.random() * this.queue.length);
    } else if (nextIndex >= this.queue.length) {
      if (this.repeatMode === 'all' || manual) {
        nextIndex = 0;
      } else {
        this.isPlaying = false;
        this.position = 0;
        this.notifyStatus();
        return;
      }
    }

    this.currentIndex = nextIndex;
    const nextTrack = this.queue[this.currentIndex];
    if (nextTrack) {
      await this.playSong(nextTrack);
    }
  }

  async previousSong() {
    if (this.queue.length === 0) return;

    if (this.position > 3000 && this.player) {
      await this.seekTo(0);
      return;
    }

    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.queue.length - 1;
    }

    this.currentIndex = prevIndex;
    const prevTrack = this.queue[this.currentIndex];
    if (prevTrack) {
      await this.playSong(prevTrack);
    }
  }

  toggleRepeatMode() {
    if (this.repeatMode === 'off') {
      this.repeatMode = 'all';
    } else if (this.repeatMode === 'all') {
      this.repeatMode = 'one';
    } else {
      this.repeatMode = 'off';
    }
    this.notifyStatus();
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.notifyStatus();
  }

  async setPlaybackRate(rate) {
    this.playbackRate = rate;
    if (this.player) {
      try {
        this.player.shouldCorrectPitch = true;
        this.player.setPlaybackRate(rate);
      } catch (e) {
        console.error('Gagal mengubah kecepatan lagu:', e);
      }
    }
    this.notifyStatus();
  }

  cyclePlaybackRate() {
    const rates = [0.85, 1.0, 1.25, 1.5];
    const idx = rates.indexOf(this.playbackRate);
    const nextRate = rates[(idx + 1) % rates.length];
    this.setPlaybackRate(nextRate);
  }

  setSleepTimer(minutes) {
    if (this.sleepInterval) {
      clearInterval(this.sleepInterval);
      this.sleepInterval = null;
    }

    this.sleepTimerMinutes = minutes;
    if (!minutes || minutes <= 0) {
      this.sleepTimerRemainingSec = 0;
      this.notifyStatus();
      return;
    }

    this.sleepTimerRemainingSec = minutes * 60;
    this.notifyStatus();

    this.sleepInterval = setInterval(async () => {
      this.sleepTimerRemainingSec -= 1;
      if (this.sleepTimerRemainingSec <= 0) {
        clearInterval(this.sleepInterval);
        this.sleepInterval = null;
        this.sleepTimerMinutes = 0;
        this.sleepTimerRemainingSec = 0;
        await this.pause();
      } else {
        this.notifyStatus();
      }
    }, 1000);
  }
}

export const audioPlayer = new AudioService();
