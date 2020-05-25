cc.Class({
    extends: cc.Component,

    properties: {
        winAudio: {
            default: null,
            type: cc.AudioClip
        },
        
        loseAudio: {
            default: null,
            type: cc.AudioClip
        },

        computePlaceAudio: {
            default: null,
            type: cc.AudioClip
        },

        playerPlaceAudio: {
            default: null,
            type: cc.AudioClip
        },

        // bgmAudio: {
        //     default: null,
        //     type: cc.AudioClip
        // },
    },
    onLoad(){
        bkb.scAudioMgr = this;
        this.musicon = true;
        this.soundon = true;
    },

    playBgmMusic () {
        // cc.audioEngine.playMusic(this.bgmAudio, true);
    },

    pauseBgmMusic () {
        // cc.audioEngine.pauseMusic();
    },

    _playSFX (clip) {
        cc.audioEngine.playEffect(clip, false);
    },

    playWin () {
        this._playSFX(this.winAudio);
    },

    playLose () {
        this._playSFX(this.loseAudio);
    },

    playComputePlaceChess () {
        this._playSFX(this.computePlaceAudio);
    },

    playPlayerPlaceChess () {
        this._playSFX(this.playerPlaceAudio);
    },
});
