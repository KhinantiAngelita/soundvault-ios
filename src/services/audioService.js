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
      currentIndex: this.currentIndex,
      queueLength: this.queue.length,
    };
    this.statusListeners.forEach((fn) => fn(statusData));
  }

  notifySongChange() {
    this.songChangeListeners.forEach((fn) => fn(this.currentSong));
  }

  setQueue(songs, startIndex = 0) {
    this.queue = [...songs];
    this.currentIndex = startIndex;
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
        { shouldPlay: true, progressUpdateIntervalMillis: 300 },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentSong = song;
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

    // Saat lagu selesai diputar
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
        // Antrean habis dan repeat mode off
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

    // Jika lagu sudah berjalan lebih dari 3 detik, rewind ke awal
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
}

export const audioPlayer = new AudioService();
