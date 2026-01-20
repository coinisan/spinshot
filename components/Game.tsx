"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { sdk } from "@farcaster/miniapp-sdk";

// --- SES MOTORU ---
class SoundSynthesizer {
  ctx: AudioContext | null = null;
  init() { 
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; 
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain); 
    gain.connect(this.ctx.destination);
    osc.start(); 
    osc.stop(this.ctx.currentTime + duration);
  }

  playShoot() { this.playTone(600, 'triangle', 0.1, 0.1); }
  playHit() { this.playTone(200, 'square', 0.1, 0.1); }
  playWin() { 
    this.playTone(400, 'sine', 0.1); 
    setTimeout(() => this.playTone(600, 'sine', 0.1), 100); 
  }
  playLose() { 
    this.playTone(300, 'sawtooth', 0.3); 
    setTimeout(() => this.playTone(100, 'sawtooth', 0.4), 200); 
  }
}

const soundManager = new SoundSynthesizer();

const Game = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  
  // React State'leri
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // High Score Yükle
    const saved = localStorage.getItem("spinshot_highscore");
    if (saved) setHighScore(parseInt(saved));
    
    // SDK Init
    const initSDK = async () => {
       try { if (sdk?.actions?.ready) sdk.actions.ready(); } catch (e) { console.error(e); }
    };
    initSDK();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Şimdilik mock data, ileride API'ye bağlanabilir
      const res = await fetch('/api/leaderboard');
      if(res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) { console.error(error); }
  };

  const submitScore = async () => {
    if (!playerName) return;
    setSubmitting(true);
    try {
      await fetch('/api/leaderboard', {
        method: 'POST', body: JSON.stringify({ name: playerName, score: score })
      });
      fetchLeaderboard(); // Listeyi güncelle
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    // Eğer oyun zaten varsa sahneyi yeniden başlat
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('GameScene') as any;
      if (scene) scene.restartGame();
    }
  };

  // Oyun Başlatma Hook'u
  useEffect(() => {
    // Sadece PLAYING modundaysak ve oyun henüz yüklenmediyse yükle
    if (gameState === 'PLAYING' && typeof window !== "undefined" && !gameRef.current) {
      
      soundManager.init();

      class GameScene extends Phaser.Scene {
        level = 1;
        pinsLeftToStick = 0;
        isGameOver = false;
        canShoot = false;
        
        activePin: any = null;
        targetContainer: any = null;
        targetCircle: any = null;
        rotationDirection = 1;
        attachedPins: number[] = [];
        currentRotationSpeed = 0;
        levelText: any = null;
        pinsLeftText: any = null;
        particleEmitter: any = null;

        constructor() { super({ key: 'GameScene' }); }

        preload() {
          this.load.image('baseTarget', '/base.jpg');
          
          // Grafik Texture Oluşturma
          let g = this.make.graphics({ x: 0, y: 0, add: false });
          
          // İğne
          g.fillStyle(0xffffff); g.fillRect(6, 16, 4, 140); g.fillCircle(8, 8, 8);
          g.generateTexture('pinTexture', 16, 156);
          
          // Partikül
          g.clear(); g.fillStyle(0xffffff); g.fillRect(0,0,4,4); g.generateTexture('particleTexture', 4,4);
        }

        create() {
          const { width, height } = this.scale;
          this.cameras.main.setBackgroundColor(0x00000000);

          // UI
          const font = { fontFamily: '"Orbitron"', fontSize: '42px', color: '#fff', fontStyle: 'bold' };
          this.levelText = this.add.text(20, 50, `LEVEL 1`, font).setShadow(0,0,10, '#0052ff');
          this.pinsLeftText = this.add.text(20, 100, `PINS: 0`, { ...font, fontSize: '24px' }).setAlpha(0.8);

          // Hedef Container
          const targetY = height * 0.30;
          this.targetContainer = this.add.container(width/2, targetY);
          
          // Hedef Daire (Base Logosu)
          this.targetCircle = this.add.sprite(0,0,'baseTarget');
          const targetSize = Math.min(width * 0.45, 180); 
          this.targetCircle.setDisplaySize(targetSize, targetSize);
          
          // Maskeleme (Yuvarlak yapma)
          const maskShape = this.make.graphics().fillCircle(width/2, targetY, targetSize/2).createGeometryMask();
          this.targetCircle.setMask(maskShape);
          this.targetCircle.postFX.addGlow(0x0052ff, 4, 0, false, 0.1, 10);
          
          this.targetContainer.add(this.targetCircle);

          // Aktif İğne
          const spawnY = height * 0.85; 
          this.activePin = this.physics.add.sprite(width/2, spawnY, 'pinTexture').setTint(0xff00ff);
          this.activePin.postFX.addGlow(0xff00ff, 4, 0, false, 0.1, 10);

          // Partiküller
          this.particleEmitter = this.add.particles(0,0,'particleTexture', {
             lifespan: 600, speed: {min:100, max:300}, scale: {start:1, end:0}, blendMode: 'ADD', emitting: false
          });

          this.input.on('pointerdown', () => this.shootPin());
          
          this.startLevel(1);
        }

        startLevel(lvl: number) {
          this.level = lvl;
          this.pinsLeftToStick = lvl + 3;
          this.isGameOver = false;
          this.canShoot = true;
          
          // Önceki animasyonları durdur (BUG FIX)
          this.tweens.killTweensOf(this.targetContainer);
          this.targetContainer.setScale(0); // Başlangıçta gizle
          this.targetContainer.setRotation(0);
          
          this.attachedPins = [];
          // Eski iğneleri temizle
          this.targetContainer.each((c:any) => { if(c !== this.targetCircle) c.destroy(); });
          
          // Hız ayarı
          const speed = 1.5 + ((lvl-1)*0.3);
          this.rotationDirection = Math.random() > 0.5 ? 1 : -1;
          this.currentRotationSpeed = speed * this.rotationDirection;
          
          this.resetPin();
          this.levelText.setText(`LEVEL ${this.level}`);
          this.pinsLeftText.setText(`PINS: ${this.pinsLeftToStick}`);
          
          setScore(this.level);

          // Level Başlama Animasyonu (Büyüme)
          this.tweens.add({
            targets: this.targetContainer,
            scale: 1,
            duration: 500,
            ease: 'Back.out'
          });
        }

        resetPin() {
          const spawnY = this.scale.height * 0.85;
          this.activePin.setPosition(this.scale.width/2, spawnY);
          this.activePin.setVelocity(0,0);
          this.activePin.setVisible(true);
          this.canShoot = true;
          
          this.tweens.add({ 
            targets: this.activePin, 
            y: {from: spawnY + 50, to: spawnY}, 
            duration: 200 
          });
        }

        shootPin() {
          if (!this.canShoot || this.isGameOver) return;
          this.canShoot = false;
          const shootSpeed = this.scale.height * 2.5; 
          this.activePin.setVelocityY(-shootSpeed);
          soundManager.playShoot();
        }

        update(t:number, d:number) {
          if (this.isGameOver) return;
          
          // Hedefi Döndür
          this.targetContainer.rotation += this.currentRotationSpeed * (d/1000);
          
          // Çarpışma Kontrolü
          const targetRadius = this.targetCircle.displayWidth / 2;
          // İğne hedefe yaklaştı mı?
          if(this.activePin.body.velocity.y < 0 && this.activePin.y < this.targetContainer.y + targetRadius + 70) {
             this.handleImpact();
          }
        }

        handleImpact() {
           let hitAngle = Phaser.Math.Angle.Normalize((Math.PI/2) - this.targetContainer.rotation);
           
           // Diğer iğnelere çarptı mı?
           let collision = this.attachedPins.some(a => {
              let diff = Math.abs(a - hitAngle);
              if (diff > Math.PI) diff = (Math.PI*2) - diff;
              return diff < 0.18; // Tolerans
           });

           if (collision) this.doGameOver();
           else this.onStick(hitAngle);
        }

        onStick(angle: number) {
           soundManager.playHit();
           this.attachedPins.push(angle);
           
           const targetRadius = this.targetCircle.displayWidth / 2;
           const pinOffset = targetRadius + 70; // Saplanma derinliği

           // Yeni saplanmış iğne oluştur
           const pin = this.add.sprite(Math.cos(angle)*pinOffset, Math.sin(angle)*pinOffset, 'pinTexture');
           pin.setRotation(angle + Math.PI/2).setTint(0xffffff);
           this.targetContainer.add(pin);
           
           this.cameras.main.shake(50, 0.005);
           
           // Aktif iğneyi gizle
           this.activePin.setVisible(false);
           this.activePin.y = 2000;
           
           this.pinsLeftToStick--;
           this.pinsLeftText.setText(`PINS: ${this.pinsLeftToStick}`);
           
           // LEVEL BİTTİ Mİ?
           if (this.pinsLeftToStick <= 0) {
              this.winLevel();
           } else {
              this.time.delayedCall(80, () => this.resetPin());
           }
        }

        winLevel() {
           this.canShoot = false;
           soundManager.playWin();
           
           // Partikül Efekti
           this.particleEmitter.explode(50, this.scale.width/2, this.scale.height*0.30);

           // Level Geçiş Animasyonu (Küçül ve Yok Ol)
           this.tweens.add({ 
              targets: this.targetContainer, 
              scale: 0, 
              duration: 400, 
              ease: 'Back.in', 
              onComplete: () => { 
                 // Animasyon bitince bir sonraki levele geç
                 this.startLevel(this.level + 1); 
              }
           });
        }

        doGameOver() {
           this.isGameOver = true;
           soundManager.playLose();
           this.cameras.main.flash(200, 255, 0, 0);
           
           setScore(this.level);
           if (this.level > highScore) {
              setHighScore(this.level);
              localStorage.setItem("spinshot_highscore", this.level.toString());
           }
           
           fetchLeaderboard();
           setGameState('GAMEOVER');
        }
        
        restartGame() { this.startLevel(1); }
      }

      // Phaser Config
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO, 
        parent: 'game-container', 
        transparent: true,
        scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
        physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
        scene: GameScene
      };
      
      gameRef.current = new Phaser.Game(config);
    }

    // Cleanup
    return () => { 
      if(gameRef.current) { 
        gameRef.current.destroy(true); 
        gameRef.current = null; 
      } 
    };
  }, [gameState]); 

  // --- HTML ARAYÜZLERİ ---

  // 1. START SCREEN
  if (gameState === 'START') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-50 font-[Orbitron] text-white p-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-2 text-[#0052ff] drop-shadow-[0_0_20px_#0052ff] text-center">SPINSHOT</h1>
        <p className="text-gray-400 mb-8 tracking-widest text-sm text-center">BASE EDITION</p>
        <div className="text-xl mb-12 text-[#ff00ff]">BEST: {highScore}</div>
        
        <button onClick={startGame} className="w-64 py-5 bg-gradient-to-r from-[#0052ff] to-[#ff00ff] rounded-2xl text-3xl font-bold hover:scale-105 active:scale-95 transition shadow-lg shadow-blue-500/50 touch-manipulation">
          PLAY
        </button>
      </div>
    );
  }

  // 2. GAME OVER SCREEN
  if (gameState === 'GAMEOVER') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 z-50 font-[Orbitron] text-white p-4 safe-area-padding">
        <h2 className="text-4xl md:text-5xl font-bold text-[#ff0055] mb-2 drop-shadow-[0_0_15px_#ff0055]">GAME OVER</h2>
        <p className="text-xl mb-6">LEVEL: <span className="text-yellow-400">{score}</span></p>

        <div className="w-full max-w-sm bg-[#1a1a2e] border border-[#0052ff] rounded-xl p-4 mb-4 shadow-[0_0_20px_rgba(0,82,255,0.2)]">
          <h3 className="text-lg text-[#0052ff] mb-2 text-center border-b border-gray-700 pb-2">TOP PLAYERS</h3>
          <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
            {leaderboard.map((player, i) => (
               <div key={i} className="flex justify-between items-center bg-black/30 p-2 rounded text-sm">
                 <span className="text-gray-300 truncate w-32">{i+1}. {player.name}</span>
                 <span className="text-[#ff00ff] font-bold">{player.score}</span>
               </div>
            ))}
            {leaderboard.length === 0 && <p className="text-center text-xs text-gray-500">No scores yet.</p>}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Your Name" 
              maxLength={12}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="flex-1 bg-black/50 border border-gray-600 rounded px-3 py-3 text-lg text-white focus:border-[#0052ff] outline-none"
            />
            <button 
              onClick={submitScore}
              disabled={submitting || !playerName}
              className="bg-[#0052ff] px-4 rounded font-bold disabled:opacity-50 active:bg-blue-600"
            >
              {submitting ? '...' : 'OK'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button onClick={startGame} className="w-full py-4 bg-white text-black rounded-xl font-bold text-xl active:scale-95 transition">
            TRY AGAIN
          </button>
          <button 
             onClick={() => {
                const url = `https://warpcast.com/~/compose?text=I%20reached%20Level%20${score}%20in%20Spinshot!%20%F0%9F%8E%AF%20Can%20you%20beat%20me?&embeds[]=https://spinshot.vercel.app`;
                window.open(url, '_blank');
             }}
             className="w-full py-4 bg-[#855DCD] rounded-xl font-bold text-xl active:scale-95 transition"
          >
            SHARE SCORE
          </button>
        </div>
      </div>
    );
  }

  return <div id="game-container" />;
};

export default Game;