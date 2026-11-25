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
    this.abLoopA = null;
    this.abLoopB = null;
    this.lastAbSeekAt = 0;
    this.statusListeners = new Set();
    this.progressListeners = new Set();
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

  subscribeProgress(listener) {
    this.progressListeners.add(listener);
    listener({
      position: this.position,
      duration: this.duration,
      sleepTimerRemainingSec: this.sleepTimerRemainingSec,
    });
    return () => this.progressListeners.delete(listener);
  }

  subscribeSongChange(listener) {
    this.songChangeListeners.add(listener);
    return () => this.songChangeListeners.delete(listener);
  }

  notifyProgress() {
    const progressData = {
      position: this.position,
      duration: this.duration,
      sleepTimerRemainingSec: this.sleepTimerRemainingSec,
    };
    this.progressListeners.forEach((fn) => fn(progressData));
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
      abLoopA: this.abLoopA,
      abLoopB: this.abLoopB,
      currentIndex: this.currentIndex,
      queueLength: this.queue.length,
    };
    this.statusListeners.forEach((fn) => fn(statusData));
    this.notifyProgress();
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
      this.abLoopA = null;
      this.abLoopB = null;

      const player = createAudioPlayer(
        { uri: song.uri },
        {
          updateInterval: 500,
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

    const prevIsPlaying = this.isPlaying;
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

    // A-B Repeat: jika mencapai titik B, langsung ulang kembali ke titik A
    if (
      this.abLoopA !== null &&
      this.abLoopB !== null &&
      this.position >= this.abLoopB &&
      this.player
    ) {
      const now = Date.now();
      if (now - this.lastAbSeekAt > 600) {
        this.lastAbSeekAt = now;
        this.player.seekTo(Math.max(0, this.abLoopA / 1000)).catch(() => {});
      }
    }

    // Hanya render ulang komponen utama jika status play/pause berubah
    if (prevIsPlaying !== this.isPlaying) {
      this.notifyStatus();
    } else {
      this.notifyProgress();
    }
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

  stopAndClear() {
    this.cleanupCurrentPlayer();
    this.currentSong = null;
    this.queue = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.position = 0;
    this.duration = 0;
    this.abLoopA = null;
    this.abLoopB = null;
    this.notifySongChange();
    this.notifyStatus();
  }

  async playNext(song) {
    if (!song) return;
    if (!this.currentSong || this.queue.length === 0) {
      await this.playSong(song, [song], 0);
      return;
    }
    if (this.currentSong.id === song.id) return;

    // Hapus duplikat lagu yang sama di posisi lain dalam antrean
    const existingIdx = this.queue.findIndex((s) => s.id === song.id);
    if (existingIdx !== -1) {
      this.queue.splice(existingIdx, 1);
      if (existingIdx < this.currentIndex) {
        this.currentIndex -= 1;
      }
    }

    const insertIdx = Math.min(this.currentIndex + 1, this.queue.length);
    this.queue.splice(insertIdx, 0, song);
    this.notifyStatus();
  }

  toggleABLoop() {
    if (!this.currentSong) return;
    if (this.abLoopA === null) {
      this.abLoopA = Math.max(0, this.position);
      this.abLoopB = null;
    } else if (this.abLoopB === null) {
      const minB = this.abLoopA + 1000;
      if (this.position >= minB) {
        this.abLoopB = this.position;
        if (this.player) {
          this.lastAbSeekAt = Date.now();
          this.player.seekTo(this.abLoopA / 1000).catch(() => {});
        }
      } else {
        // Jika titik B terlalu dekat (<1 detik dari A), reset
        this.abLoopA = null;
        this.abLoopB = null;
      }
    } else {
      this.abLoopA = null;
      this.abLoopB = null;
    }
    this.notifyStatus();
  }

  clearABLoop() {
    this.abLoopA = null;
    this.abLoopB = null;
    this.notifyStatus();
  }

  removeSongFromQueue(songId) {
    const idx = this.queue.findIndex((s) => s.id === songId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      if (this.currentIndex >= this.queue.length) {
        this.currentIndex = Math.max(0, this.queue.length - 1);
      }
    }
  }

  updateSongInMemory(songId, updates) {
    this.queue = this.queue.map((s) =>
      s.id === songId ? { ...s, ...updates } : s
    );
    if (this.currentSong && this.currentSong.id === songId) {
      this.currentSong = { ...this.currentSong, ...updates };
      this.updateLockScreenAndMediaSession(this.currentSong);
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
      if (this.queue.length > 1) {
        let randIdx = this.currentIndex;
        while (randIdx === this.currentIndex) {
          randIdx = Math.floor(Math.random() * this.queue.length);
        }
        nextIndex = randIdx;
      } else {
        nextIndex = 0;
      }
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
        this.notifyProgress();
      }
    }, 1000);
  }
}

export const audioPlayer = new AudioService();
