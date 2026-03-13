/**
 * 音乐播放器 - 完整版
 * 基于 Mizuki 音乐播放器完整实现
 * 功能：三态UI、播放列表、随机播放、循环模式、错误处理
 */
class MusicPlayer {
  // 私有状态（不可变）
  #state = {
    // 播放状态
    isPlaying: false,
    isExpanded: false,
    isHidden: false,
    showPlaylist: false,

    // 播放模式
    isShuffled: false,
    isRepeating: 0, // 0: 不循环, 1: 单曲循环, 2: 列表循环

    // 播放进度
    currentIndex: 0,
    currentTime: 0,
    duration: 0,

    // 音量
    volume: 0.7,
    isMuted: false,

    // 加载和错误
    isLoading: false,
    errorMessage: '',
    showError: false
  };

  // DOM 元素缓存
  #elements = {};

  // 音频对象
  #audio = null;

  // 播放列表
  #playlist = [];

  // 当前歌曲
  #currentSong = {
    title: '加载中...',
    artist: '-',
    cover: '',
    url: '',
    duration: 0
  };

  // 配置
  #config = {};

  // requestAnimationFrame ID
  #rafId = null;

  // 自动播放意图标记
  #willAutoPlay = false;

  // 自动播放失败标记
  #autoplayFailed = false;

  // 音量拖拽状态
  #isVolumeDragging = false;
  #isPointerDown = false;
  #volumeBarRect = null;

  // localStorage 键
  #STORAGE_KEY_VOLUME = 'music-player-volume';

  constructor(config) {
    this.#config = config;
    this.#init();
  }

  /**
   * 初始化播放器
   */
  async #init() {
    this.#cacheElements();
    this.#createAudio();
    this.#bindEvents();
    this.#loadVolumeSettings();
    this.#setupUserInteractionHandler();

    // 根据模式加载播放列表
    if (this.#config.mode === 'meting') {
      await this.#fetchPlaylistFromMeting();
    } else {
      this.#playlist = this.#config.playlist || [];
    }

    // 如果有歌曲，加载第一首
    if (this.#playlist.length > 0) {
      this.#loadSong(this.#playlist[0]);
    } else {
      this.#showError('播放列表为空');
    }
  }

  /**
   * 缓存 DOM 元素
   */
  #cacheElements() {
    const container = document.getElementById('music-player');
    if (!container) return;

    this.#elements = {
      container,

      // 错误提示
      errorToast: document.getElementById('music-error'),
      errorMessage: container.querySelector('.toast-msg'),
      errorClose: container.querySelector('.toast-close'),

      // 小圆球
      orbPlayer: container.querySelector('.orb-player'),
      orbIcon: container.querySelector('.orb-icon'),

      // 迷你播放器
      miniPlayer: container.querySelector('.mini-player'),
      miniCover: container.querySelector('.mini-player .cover-wrap'),
      miniTitle: container.querySelector('.mini-player .title'),
      miniArtist: container.querySelector('.mini-player .artist'),

      // 完整播放器
      expandedPlayer: container.querySelector('.full-player'),
      playerCover: container.querySelector('.full-player .cover-wrap img'),
      playerTitle: container.querySelector('.full-player .title'),
      playerArtist: container.querySelector('.full-player .artist'),
      currentTime: container.querySelector('.curr-time'),
      totalTime: container.querySelector('.tot-time'),

      // 控制按钮
      playBtns: container.querySelectorAll('[data-action="toggle-play"]'),
      prevBtn: container.querySelector('[data-action="prev"]'),
      nextBtn: container.querySelector('[data-action="next"]'),
      hideBtns: container.querySelectorAll('[data-action="hide"]'),
      expandBtns: container.querySelectorAll('[data-action="expand"]'),
      collapseBtn: container.querySelector('[data-action="collapse"]'),

      // 播放模式按钮
      shuffleBtn: container.querySelector('[data-action="toggle-shuffle"]'),
      repeatBtn: container.querySelector('[data-action="toggle-repeat"]'),

      // 播放列表
      playlistBtns: container.querySelectorAll('[data-action="toggle-playlist"]'),
      playlistPanel: container.querySelector('.playlist-panel'),
      playlistContent: container.querySelector('.playlist-body'),

      // 进度条
      progressBar: container.querySelector('[data-drag="progress"]'),
      progressFill: container.querySelector('.progress-fill'),

      // 音量控制
      muteBtn: container.querySelector('[data-action="toggle-mute"]'),
      volumeBar: container.querySelector('[data-drag="volume"]'),
      volumeFill: container.querySelector('.volume-fill')
    };
  }

  /**
   * 创建音频对象
   */
  #createAudio() {
    this.#audio = document.getElementById('music-audio');
    if (!this.#audio) return;

    // 绑定音频事件
    this.#audio.addEventListener('play', () => this.#setState({ isPlaying: true }));
    this.#audio.addEventListener('pause', () => this.#setState({ isPlaying: false }));
    this.#audio.addEventListener('timeupdate', () => {
      this.#setState({ currentTime: this.#audio.currentTime });
    });
    this.#audio.addEventListener('loadeddata', () => this.#handleLoadSuccess());
    this.#audio.addEventListener('ended', () => this.#handleAudioEnded());
    this.#audio.addEventListener('error', (e) => this.#handleLoadError(e));
    this.#audio.addEventListener('loadstart', () => {});
  }

  /**
   * 绑定事件
   */
  #bindEvents() {
    // 播放/暂停
    this.#elements.playBtns?.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    });

    // 上一首/下一首
    this.#elements.prevBtn?.addEventListener('click', () => this.previousSong());
    this.#elements.nextBtn?.addEventListener('click', () => this.nextSong());

    // 隐藏/展开/收起
    this.#elements.hideBtns?.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.#toggleHidden();
      });
    });

    this.#elements.orbPlayer?.addEventListener('click', () => this.#toggleHidden());

    this.#elements.expandBtns?.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.#toggleExpanded();
      });
    });

    this.#elements.miniInfo?.addEventListener('click', () => this.#toggleExpanded());
    this.#elements.collapseBtn?.addEventListener('click', () => this.#toggleExpanded());

    // 播放模式
    this.#elements.shuffleBtn?.addEventListener('click', () => this.#toggleShuffle());
    this.#elements.repeatBtn?.addEventListener('click', () => this.#toggleRepeat());

    // 播放列表
    this.#elements.playlistBtns?.forEach((btn) => {
      btn.addEventListener('click', () => this.#togglePlaylist());
    });

    // 进度条
    this.#elements.progressBar?.addEventListener('click', (e) => this.#setProgress(e));

    // 音量控制
    this.#elements.muteBtn?.addEventListener('click', () => this.toggleMute());
    this.#elements.volumeBar?.addEventListener('pointerdown', (e) => this.#startVolumeDrag(e));

    // 全局 pointer 事件（用于音量拖拽）
    window.addEventListener('pointermove', (e) => this.#handleVolumeMove(e));
    window.addEventListener('pointerup', (e) => this.#stopVolumeDrag(e));

    // 错误提示关闭
    this.#elements.errorClose?.addEventListener('click', () => this.#hideError());
  }

  /**
   * 设置用户交互处理器（解决自动播放限制）
   */
  #setupUserInteractionHandler() {
    const events = ['click', 'keydown', 'touchstart'];
    const handler = () => this.#handleUserInteraction();

    events.forEach((event) => {
      document.addEventListener(event, handler, { capture: true, once: false });
    });
  }

  /**
   * 处理用户交互（尝试恢复自动播放）
   */
  #handleUserInteraction() {
    if (this.#autoplayFailed && this.#audio) {
      this.#audio
        .play()
        .then(() => {
          this.#autoplayFailed = false;
        })
        .catch(() => {});
    }
  }

  /**
   * 从 Meting API 获取播放列表
   */
  async #fetchPlaylistFromMeting() {
    const { meting } = this.#config;
    if (!meting || !meting.id) {
      this.#showError('Meting 配置错误');
      return;
    }

    this.#setState({ isLoading: true });
    this.#showLoading('正在加载歌单...');

    try {
      const url = `${meting.api}?server=${meting.server}&type=${meting.type}&id=${meting.id}&r=${Date.now()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('歌单为空');
      }

      // 转换 Meting 数据格式
      this.#playlist = data.map((song, index) => {
        let duration = song.duration ?? 0;
        if (duration > 10000) duration = Math.floor(duration / 1000);
        if (!Number.isFinite(duration) || duration <= 0) duration = 0;

        return {
          id: song.id || index,
          title: song.name || song.title || '未知歌曲',
          artist: song.artist || song.author || '未知艺术家',
          cover: song.pic || song.cover || '',
          url: song.url || '',
          duration
        };
      });

      this.#setState({ isLoading: false });
      this.#renderPlaylist();
    } catch (err) {
      this.#setState({ isLoading: false });
      this.#showError(`加载歌单失败: ${err.message}`);
    }
  }

  /**
   * 不可变状态更新
   */
  #setState(updates) {
    this.#state = { ...this.#state, ...updates };
    this.#render();
  }

  /**
   * 渲染 UI
   */
  #render() {
    const {
      isPlaying,
      isExpanded,
      isHidden,
      showPlaylist,
      isShuffled: _isShuffled,
      isRepeating: _isRepeating,
      isMuted: _isMuted,
      isLoading
    } = this.#state;
    const container = this.#elements.container;

    if (!container) return;

    // 更新状态
    if (isHidden) {
      container.dataset.state = 'hidden';
    } else if (isExpanded) {
      container.dataset.state = 'expanded';
    } else {
      container.dataset.state = 'mini';
    }

    container.dataset.playing = isPlaying;
    container.dataset.loading = isLoading;
    container.dataset.playlist = showPlaylist;

    // 更新小圆球图标
    this.#updateOrbIcon();

    // 更新播放按钮图标
    this.#updatePlayButton();

    // 更新播放模式按钮
    this.#updateModeButtons();

    // 更新进度条
    this.#updateProgress();

    // 更新音量条
    this.#updateVolumeDisplay();

    // 更新静音按钮
    this.#updateMuteButton();

    // 更新播放列表面板
    if (showPlaylist) {
      this.#elements.playlistPanel.style.display = 'block';
    } else {
      this.#elements.playlistPanel.style.display = 'none';
    }
  }

  /**
   * 更新小圆球图标
   */
  #updateOrbIcon() {
    const { isLoading, isPlaying } = this.#state;
    const icon = this.#elements.orbIcon;
    if (!icon) return;

    // SVG 图标路径
    const paths = {
      loading:
        'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
      playing:
        'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
      idle: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'
    };

    const path = icon.querySelector('path');
    if (path) {
      if (isLoading) {
        path.setAttribute('d', paths.loading);
        icon.classList.add('loading');
      } else if (isPlaying) {
        path.setAttribute('d', paths.playing);
        icon.classList.remove('loading');
      } else {
        path.setAttribute('d', paths.idle);
        icon.classList.remove('loading');
      }
    }
  }

  /**
   * 更新播放按钮
   */
  #updatePlayButton() {
    const { isLoading, isPlaying } = this.#state;

    // SVG 图标路径
    const paths = {
      loading:
        'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
      play: 'M8 5v14l11-7z',
      pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'
    };

    this.#elements.playBtns?.forEach((btn) => {
      // 查找 SVG 图标
      const svg = btn.querySelector('svg');
      if (svg) {
        const path = svg.querySelector('path');
        if (path) {
          if (isLoading) {
            path.setAttribute('d', paths.loading);
          } else if (isPlaying) {
            path.setAttribute('d', paths.pause);
          } else {
            path.setAttribute('d', paths.play);
          }
        }
      } else {
        // Fallback
        if (isLoading) {
          btn.textContent = '⏳';
        } else if (isPlaying) {
          btn.textContent = '⏸';
        } else {
          btn.textContent = '▶';
        }
      }
    });
  }

  /**
   * 更新播放模式按钮
   */
  #updateModeButtons() {
    const { isShuffled, isRepeating } = this.#state;

    // SVG 图标路径
    const shufflePath =
      'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z';
    const repeatPath = 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z';
    const repeatOnePath = 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 4H7v-2h10v2zm-4 6h2v-4h3l-4 4-4-4h3v4z';

    // 随机播放按钮
    if (this.#elements.shuffleBtn) {
      const svg = this.#elements.shuffleBtn.querySelector('svg');
      this.#elements.shuffleBtn.classList.toggle('active', isShuffled);
      if (svg) {
        const path = svg.querySelector('path');
        if (path) path.setAttribute('d', shufflePath);
      }
    }

    // 循环模式按钮
    if (this.#elements.repeatBtn) {
      const svg = this.#elements.repeatBtn.querySelector('svg');
      this.#elements.repeatBtn.classList.toggle('active', isRepeating > 0);

      if (svg) {
        const path = svg.querySelector('path');
        if (path) {
          if (isRepeating === 1) {
            path.setAttribute('d', repeatOnePath); // 单曲循环
          } else if (isRepeating === 2) {
            path.setAttribute('d', repeatPath); // 列表循环
          } else {
            path.setAttribute('d', repeatPath); // 不循环
          }
        }
      }
    }
  }

  /**
   * 更新静音按钮
   */
  #updateMuteButton() {
    const { isMuted, volume } = this.#state;
    const btn = this.#elements.muteBtn;
    if (!btn) return;

    // SVG 图标路径
    const paths = {
      off: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
      low: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
      high: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z'
    };

    const svg = btn.querySelector('svg');
    if (svg) {
      const path = svg.querySelector('path');
      if (path) {
        if (isMuted || volume === 0) {
          path.setAttribute('d', paths.off);
        } else if (volume < 0.5) {
          path.setAttribute('d', paths.low);
        } else {
          path.setAttribute('d', paths.high);
        }
      }
    } else {
      // Fallback
      if (isMuted || volume === 0) {
        btn.textContent = '🔇';
      } else if (volume < 0.5) {
        btn.textContent = '🔉';
      } else {
        btn.textContent = '🔊';
      }
    }
  }

  /**
   * 显示加载状态
   */
  #showLoading(message) {
    if (this.#elements.miniTitle) {
      this.#elements.miniTitle.textContent = message;
    }
    if (this.#elements.miniArtist) {
      this.#elements.miniArtist.textContent = '请稍候...';
    }
  }

  /**
   * 显示错误
   */
  #showError(message) {
    this.#setState({ errorMessage: message, showError: true });

    if (this.#elements.errorToast && this.#elements.errorMessage) {
      this.#elements.errorMessage.textContent = message;
      this.#elements.errorToast.style.display = 'block';

      // 3秒后自动隐藏
      setTimeout(() => this.#hideError(), 3000);
    }
  }

  /**
   * 隐藏错误
   */
  #hideError() {
    this.#setState({ showError: false });
    if (this.#elements.errorToast) {
      this.#elements.errorToast.style.display = 'none';
    }
  }

  /**
   * 加载歌曲
   */
  #loadSong(song) {
    if (!song) return;

    this.#currentSong = { ...song };
    this.#setState({ isLoading: !!song.url });

    const coverUrl = song.cover || this.#getDefaultCover();

    // 更新迷你播放器封面
    if (this.#elements.miniCover) {
      const miniCoverImg = this.#elements.miniCover.querySelector('img');
      if (miniCoverImg) {
        miniCoverImg.src = coverUrl;
        miniCoverImg.alt = song.title;
      }
    }

    // 更新完整播放器封面
    if (this.#elements.playerCover) {
      this.#elements.playerCover.src = coverUrl;
      this.#elements.playerCover.alt = song.title;
    }

    if (this.#elements.playerCover) {
      this.#elements.playerCover.src = coverUrl;
      this.#elements.playerCover.alt = song.title;
    }

    // 更新信息
    if (this.#elements.miniTitle) {
      this.#elements.miniTitle.textContent = song.title;
    }
    if (this.#elements.miniArtist) {
      this.#elements.miniArtist.textContent = song.artist;
    }
    if (this.#elements.playerTitle) {
      this.#elements.playerTitle.textContent = song.title;
    }
    if (this.#elements.playerArtist) {
      this.#elements.playerArtist.textContent = song.artist;
    }

    // 加载音频
    if (this.#audio && song.url) {
      this.#audio.src = this.#getAssetPath(song.url);
      this.#audio.load();
    }
  }

  /**
   * 获取资源路径
   */
  #getAssetPath(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) return path;
    return `/${path}`;
  }

  /**
   * 获取默认封面
   */
  #getDefaultCover() {
    const base = this.#config.base || '';
    return `${base}/images/default-cover.png`;
  }

  /**
   * 处理加载成功
   */
  #handleLoadSuccess() {
    this.#setState({ isLoading: false });

    if (this.#audio?.duration && this.#audio.duration > 1) {
      const duration = Math.floor(this.#audio.duration);
      this.#setState({ duration });

      if (this.#playlist[this.#state.currentIndex]) {
        this.#playlist[this.#state.currentIndex].duration = duration;
      }
      this.#currentSong.duration = duration;
      this.#updateTotalTime();
    }

    // 尝试自动播放
    if (this.#willAutoPlay || this.#state.isPlaying) {
      const playPromise = this.#audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('自动播放被拦截，等待用户交互:', error);
          this.#autoplayFailed = true;
          this.#setState({ isPlaying: false });
        });
      }
    }
  }

  /**
   * 处理加载错误
   */
  #handleLoadError(_event) {
    if (!this.#currentSong.url) return;

    this.#setState({ isLoading: false });
    this.#showError('歌曲加载失败');

    const shouldContinue = this.#state.isPlaying || this.#willAutoPlay;

    if (this.#playlist.length > 1) {
      setTimeout(() => this.nextSong(shouldContinue), 1000);
    } else {
      this.#showError('播放列表为空');
    }
  }

  /**
   * 处理播放结束
   */
  #handleAudioEnded() {
    const { isRepeating, isShuffled } = this.#state;

    if (isRepeating === 1) {
      // 单曲循环
      this.#audio.currentTime = 0;
      this.#audio.play().catch(() => {});
    } else if (isRepeating === 2 || isShuffled) {
      // 列表循环或随机播放
      this.nextSong(true);
    } else {
      // 不循环
      this.#setState({ isPlaying: false });
    }
  }

  /**
   * 播放/暂停
   */
  togglePlay() {
    if (!this.#audio || !this.#currentSong.url) return;

    if (this.#state.isPlaying) {
      this.#audio.pause();
    } else {
      this.#audio.play().catch((err) => {
        if (err.name === 'NotAllowedError') {
          console.warn('自动播放被阻止，需要用户交互');
        } else {
          console.error('播放失败:', err);
        }
      });
    }
  }

  /**
   * 上一首
   */
  previousSong() {
    if (this.#playlist.length <= 1) return;

    const newIndex =
      this.#state.currentIndex > 0 ? this.#state.currentIndex - 1 : this.#playlist.length - 1;

    this.playSong(newIndex);
  }

  /**
   * 下一首
   */
  nextSong(autoPlay = true) {
    if (this.#playlist.length <= 1) return;

    let newIndex;

    if (this.#state.isShuffled) {
      // 随机播放
      do {
        newIndex = Math.floor(Math.random() * this.#playlist.length);
      } while (newIndex === this.#state.currentIndex && this.#playlist.length > 1);
    } else {
      // 顺序播放
      newIndex =
        this.#state.currentIndex < this.#playlist.length - 1 ? this.#state.currentIndex + 1 : 0;
    }

    this.playSong(newIndex, autoPlay);
  }

  /**
   * 播放指定歌曲
   */
  playSong(index, autoPlay = true) {
    if (index < 0 || index >= this.#playlist.length) return;

    this.#willAutoPlay = autoPlay;
    this.#setState({ currentIndex: index });
    this.#loadSong(this.#playlist[index]);
    this.#renderPlaylist();
  }

  /**
   * 切换隐藏状态
   */
  #toggleHidden() {
    const newHidden = !this.#state.isHidden;
    this.#setState({
      isHidden: newHidden,
      isExpanded: false,
      showPlaylist: false
    });
  }

  /**
   * 切换展开状态
   */
  #toggleExpanded() {
    const newExpanded = !this.#state.isExpanded;
    this.#setState({
      isExpanded: newExpanded,
      showPlaylist: false,
      isHidden: false
    });
  }

  /**
   * 切换播放列表
   */
  #togglePlaylist() {
    this.#setState({ showPlaylist: !this.#state.showPlaylist });
  }

  /**
   * 切换随机播放
   */
  #toggleShuffle() {
    const newShuffled = !this.#state.isShuffled;
    this.#setState({
      isShuffled: newShuffled,
      isRepeating: newShuffled ? 0 : this.#state.isRepeating
    });
  }

  /**
   * 切换循环模式
   */
  #toggleRepeat() {
    const newRepeating = (this.#state.isRepeating + 1) % 3;
    this.#setState({
      isRepeating: newRepeating,
      isShuffled: newRepeating !== 0 ? false : this.#state.isShuffled
    });
  }

  /**
   * 静音切换
   */
  toggleMute() {
    if (!this.#audio) return;

    const newMuted = !this.#state.isMuted;
    this.#audio.muted = newMuted;
    this.#setState({ isMuted: newMuted });
  }

  /**
   * 更新进度条
   */
  #updateProgress() {
    const { currentTime, duration } = this.#state;

    if (!duration || !this.#elements.progressFill) return;

    const percent = (currentTime / duration) * 100;
    this.#elements.progressFill.style.width = `${percent}%`;

    if (this.#elements.currentTime) {
      this.#elements.currentTime.textContent = this.#formatTime(currentTime);
    }
  }

  /**
   * 更新总时间显示
   */
  #updateTotalTime() {
    if (this.#elements.totalTime) {
      this.#elements.totalTime.textContent = this.#formatTime(this.#state.duration);
    }
  }

  /**
   * 格式化时间
   */
  #formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 设置进度
   */
  #setProgress(e) {
    if (!this.#audio || !this.#elements.progressBar) return;

    const rect = this.#elements.progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * this.#state.duration;

    this.#audio.currentTime = newTime;
  }

  /**
   * 开始音量拖拽
   */
  #startVolumeDrag(e) {
    if (!this.#elements.volumeBar) return;

    e.preventDefault();
    this.#isPointerDown = true;
    this.#elements.volumeBar.setPointerCapture(e.pointerId);
    this.#volumeBarRect = this.#elements.volumeBar.getBoundingClientRect();
    this.#updateVolumeLogic(e.clientX);
  }

  /**
   * 处理音量拖拽移动
   */
  #handleVolumeMove(e) {
    if (!this.#isPointerDown) return;

    e.preventDefault();
    this.#isVolumeDragging = true;

    if (this.#rafId) return;

    this.#rafId = requestAnimationFrame(() => {
      this.#updateVolumeLogic(e.clientX);
      this.#rafId = null;
    });
  }

  /**
   * 停止音量拖拽
   */
  #stopVolumeDrag(e) {
    if (!this.#isPointerDown) return;

    this.#isPointerDown = false;
    this.#isVolumeDragging = false;
    this.#volumeBarRect = null;

    if (this.#elements.volumeBar) {
      this.#elements.volumeBar.releasePointerCapture(e.pointerId);
    }

    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }

    this.#saveVolumeSettings();
  }

  /**
   * 更新音量逻辑
   */
  #updateVolumeLogic(clientX) {
    if (!this.#audio || !this.#elements.volumeBar) return;

    const rect = this.#volumeBarRect || this.#elements.volumeBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    this.#audio.volume = percent;
    this.#setState({ volume: percent, isMuted: false });
    this.#audio.muted = false;
  }

  /**
   * 更新音量显示
   */
  #updateVolumeDisplay() {
    if (!this.#elements.volumeFill) return;

    const volume = this.#state.isMuted ? 0 : this.#state.volume;
    this.#elements.volumeFill.style.width = `${volume * 100}%`;
  }

  /**
   * 加载音量设置
   */
  #loadVolumeSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedVolume = localStorage.getItem(this.#STORAGE_KEY_VOLUME);
        if (savedVolume !== null && !isNaN(parseFloat(savedVolume))) {
          const volume = parseFloat(savedVolume);
          this.#setState({ volume });
          if (this.#audio) {
            this.#audio.volume = volume;
          }
        } else {
          const defaultVolume = this.#config.defaultVolume || 0.7;
          this.#setState({ volume: defaultVolume });
          if (this.#audio) {
            this.#audio.volume = defaultVolume;
          }
        }
      }
    } catch (e) {
      console.warn('加载音量设置失败:', e);
    }
  }

  /**
   * 保存音量设置
   */
  #saveVolumeSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.#STORAGE_KEY_VOLUME, this.#state.volume.toString());
      }
    } catch (e) {
      console.warn('保存音量设置失败:', e);
    }
  }

  /**
   * 渲染播放列表
   */
  #renderPlaylist() {
    if (!this.#elements.playlistContent) return;

    const html = this.#playlist
      .map((song, index) => {
        const isActive = index === this.#state.currentIndex;
        const isPlaying = isActive && this.#state.isPlaying;

        return `
        <div class="playlist-item ${isActive ? 'active' : ''}" data-index="${index}">
          <div class="playlist-index">
            ${isPlaying ? '🎵' : isActive ? '⏸' : index + 1}
          </div>
          <div class="item-cover">
            <img src="${this.#getAssetPath(song.cover || this.#getDefaultCover())}" alt="${song.title}">
          </div>
          <div class="item-info">
            <div class="item-title">${song.title}</div>
            <div class="item-artist">${song.artist}</div>
          </div>
        </div>
      `;
      })
      .join('');

    this.#elements.playlistContent.innerHTML = html;

    // 绑定点击事件
    this.#elements.playlistContent.querySelectorAll('.playlist-item').forEach((item) => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.playSong(index);
      });
    });
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  if (window.MUSIC_CONFIG?.enable) {
    try {
      window.musicPlayer = new MusicPlayer(window.MUSIC_CONFIG);
    } catch (err) {
      console.error('音乐播放器初始化失败:', err);
    }
  }
});
