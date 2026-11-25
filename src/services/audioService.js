import { Audio } from 'expo-av';

class AudioService {
  constructor() {
    this.sound = null;
    this.currentSong = null;
    this.queue = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.duration = 0;
    this.position = 0;
    this.isBuffering = false;
    this.repeatMode = 'off'; // 'off' | 'all' | 'one'
    this.isShuffle = false;
    this.playbackRate = 1.0; // 0.75 | 0.85 | 1.0 | 1.25 | 1.5
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
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

  updateMediaSessionMetadata(song) {
    try {
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && song) {
        // eslint-disable-next-line no-undef
        if (typeof MediaMetadata !== 'undefined') {
          // eslint-disable-next-line no-undef
          navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title || 'SoundVault',
            artist: song.artist || 'Unknown Artist',
            album: song.album || 'SoundVault Offline',
            artwork: song.coverUri ? [{ src: song.coverUri }] : [],
          });
        }
        navigator.mediaSession.setActionHandler('play', () => this.togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => this.togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previousSong());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextSong());
      }
    } catch (e) {
      // Abaikan jika platform tidak mengekspos navigator.mediaSession
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

  async playSong(song, queue = null, index = -1) {
    await this.init();

    if (queue) {
      this.queue = [...queue];
      this.currentIndex = index >= 0 ? index : this.queue.findIndex((s) => s.id === song.id);
    }

    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        {
          shouldPlay: true,
          rate: this.playbackRate,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 300,
        },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentSong = song;
      this.isPlaying = true;
      this.updateMediaSessionMetadata(song);
      this.notifySongChange();
      this.notifyStatus();
    } catch (error) {
      console.error('Error saat memutar lagu:', error);
      this.isPlaying = false;
      this.notifyStatus();
    }
  }

  onPlaybackStatusUpdate(status) {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Playback Error: ${status.error}`);
      }
      return;
    }

    this.position = status.positionMillis || 0;
    this.duration = status.durationMillis || 0;
    this.isPlaying = status.isPlaying;
    this.isBuffering = status.isBuffering;

    if (status.didJustFinish) {
      this.handleSongFinished();
      return;
    }

    this.notifyStatus();
  }

  async handleSongFinished() {
    if (this.repeatMode === 'one') {
      if (this.sound) {
        await this.sound.replayAsync();
      }
    } else {
      await this.nextSong(false);
    }
  }

  async togglePlayPause() {
    if (!this.sound) {
      if (this.currentSong) {
        await this.playSong(this.currentSong);
      } else if (this.queue.length > 0) {
        await this.playSong(this.queue[0], this.queue, 0);
      }
      return;
    }

    if (this.isPlaying) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    } else {
      await this.sound.playAsync();
      this.isPlaying = true;
    }
    this.notifyStatus();
  }

  async pause() {
    if (this.sound && this.isPlaying) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
      this.notifyStatus();
    }
  }

  async seekTo(positionMillis) {
    if (!this.sound) return;
    try {
      await this.sound.setPositionAsync(positionMillis);
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

    if (this.position > 3000 && this.sound) {
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
    if (this.sound) {
      try {
        await this.sound.setRateAsync(rate, true);
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
