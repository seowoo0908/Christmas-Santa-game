const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameCanvas',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let santa;
let robber;
let presents;
let obstacles;
let powerUps;
let cursors;
let score = 0;
let gameOver = false;
let bgMusic;
let soundEffects = {};
let particles;

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

let currentState = GameState.MENU;
let currentLevel = 1;
let levelData = {
    1: { presentCount: 5, obstacleCount: 3, robberSpeed: 100 },
    2: { presentCount: 8, obstacleCount: 5, robberSpeed: 120 },
    3: { presentCount: 12, obstacleCount: 7, robberSpeed: 150 }
};

function preload() {
    // Load all game assets
    this.load.image('background', 'assets/background.png');
    this.load.spritesheet('santa', 'assets/santa.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('robber', 'assets/robber.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('present', 'assets/present.png');
    this.load.image('obstacle', 'assets/obstacle.png');
    this.load.image('snowflake', 'assets/snowflake.png');
    this.load.image('powerup_speed', 'assets/powerup_speed.png');
    this.load.image('powerup_shield', 'assets/powerup_shield.png');
    this.load.image('powerup_magnet', 'assets/powerup_magnet.png');
    this.load.image('candy_cane', 'assets/candy_cane.png');
    this.load.image('ice_patch', 'assets/ice_patch.png');
    this.load.image('fog', 'assets/fog.png');
    
    // Load audio
    this.load.audio('bgMusic', 'assets/jingle_bells.mp3');
    this.load.audio('collect', 'assets/collect.mp3');
    this.load.audio('jump', 'assets/jump.mp3');
    this.load.audio('powerup', 'assets/powerup.mp3');
    this.load.audio('victory', 'assets/victory.mp3');
    this.load.audio('gameover', 'assets/gameover.mp3');
}

function create() {
    // Add parallax background
    this.bg1 = this.add.tileSprite(400, 300, 800, 600, 'background');
    this.bg2 = this.add.tileSprite(400, 300, 800, 600, 'background_trees');
    
    // Create particle systems
    createParticleSystems(this);
    
    // Create game objects
    createGameObjects(this);
    
    // Set up audio
    setupAudio(this);
    
    // Set up collisions
    setupCollisions(this);
    
    // Set up controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Create animations
    createAnimations(this);
    
    // Create mobile controls
    createMobileControls(this);
    
    // Create weather effects
    createWeatherEffects(this);
    
    // Start menu scene
    this.scene.start('MenuScene');
}

function createParticleSystems(scene) {
    // Snow particles
    particles = scene.add.particles('snowflake');
    particles.createEmitter({
        x: { min: 0, max: 800 },
        y: -10,
        speedY: { min: 50, max: 100 },
        scale: { start: 0.2, end: 0.1 },
        alpha: { start: 1, end: 0.5 },
        lifespan: 6000,
        frequency: 100
    });
    
    // Present sparkle particles
    scene.add.particles('sparkle').createEmitter({
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        follow: presents
    });
}

function createGameObjects(scene) {
    santa = scene.physics.add.sprite(100, 450, 'santa');
    santa.setBounce(0.2);
    santa.setCollideWorldBounds(true);
    santa.powerups = {
        speed: false,
        shield: false,
        magnet: false
    };

    robber = scene.physics.add.sprite(700, 450, 'robber');
    robber.setBounce(0.2);
    robber.setCollideWorldBounds(true);
    
    // Create presents group
    presents = scene.physics.add.group({
        key: 'present',
        repeat: 5,
        setXY: { x: 12, y: 0, stepX: 140 }
    });
    
    // Create power-ups group
    powerUps = scene.physics.add.group();
    
    // Create obstacles group
    obstacles = scene.physics.add.group();
    
    spawnPowerUp(scene);
    spawnObstacles(scene);
}

function setupAudio(scene) {
    bgMusic = scene.sound.add('bgMusic', { loop: true, volume: 0.5 });
    soundEffects = {
        collect: scene.sound.add('collect'),
        jump: scene.sound.add('jump'),
        powerup: scene.sound.add('powerup'),
        victory: scene.sound.add('victory'),
        gameover: scene.sound.add('gameover')
    };
    bgMusic.play();
}

function update() {
    if (gameOver) {
        return;
    }

    updateParallaxBackground();
    handleSantaMovement();
    updateRobberAI();
    checkPowerUps();
    magnetEffect();
}

function handleSantaMovement() {
    const speed = santa.powerups.speed ? 240 : 160;
    
    if (cursors.left.isDown) {
        santa.setVelocityX(-speed);
        santa.anims.play('left', true);
    } else if (cursors.right.isDown) {
        santa.setVelocityX(speed);
        santa.anims.play('right', true);
    } else {
        santa.setVelocityX(0);
        santa.anims.play('turn');
    }

    if (cursors.up.isDown && santa.body.touching.down) {
        santa.setVelocityY(-330);
        soundEffects.jump.play();
    }
}

function updateParallaxBackground() {
    this.bg1.tilePositionX += 0.5;
    this.bg2.tilePositionX += 1;
}

function spawnPowerUp(scene) {
    const powerupTypes = ['speed', 'shield', 'magnet'];
    const type = powerupTypes[Phaser.Math.Between(0, 2)];
    const x = Phaser.Math.Between(100, 700);
    const powerup = powerUps.create(x, 0, `powerup_${type}`);
    powerup.type = type;
    powerup.setBounceY(0.4);
}

function checkPowerUps() {
    Object.keys(santa.powerups).forEach(power => {
        if (santa.powerups[power]) {
            santa.powerups[power]--;
            if (santa.powerups[power] <= 0) {
                santa.powerups[power] = false;
            }
        }
    });
}

function magnetEffect() {
    if (santa.powerups.magnet) {
        presents.children.iterate(present => {
            const distance = Phaser.Math.Distance.Between(santa.x, santa.y, present.x, present.y);
            if (distance < 150) {
                const angle = Phaser.Math.Angle.Between(present.x, present.y, santa.x, santa.y);
                present.setVelocity(
                    Math.cos(angle) * 150,
                    Math.sin(angle) * 150
                );
            }
        });
    }
}

function createAnimations(scene) {
    scene.anims.create({
        key: 'left',
        frames: scene.anims.generateFrameNumbers('santa', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'turn',
        frames: [{ key: 'santa', frame: 4 }],
        frameRate: 20
    });

    scene.anims.create({
        key: 'right',
        frames: scene.anims.generateFrameNumbers('santa', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
}

function setupCollisions(scene) {
    scene.physics.add.collider(santa, presents, collectPresent, null, scene);
    scene.physics.add.collider(santa, robber, catchRobber, null, scene);
    scene.physics.add.collider(santa, powerUps, collectPowerUp, null, scene);
    scene.physics.add.collider(santa, obstacles, hitObstacle, null, scene);
}

function collectPresent(santa, present) {
    present.disableBody(true, true);
    score += 10;
    document.getElementById('score-value').textContent = score;
    soundEffects.collect.play();
}

function catchRobber(santa, robber) {
    scene.physics.pause();
    gameOver = true;
    
    const finalScore = score;
    const highScore = Math.max(parseInt(document.getElementById('high-score-value').textContent), finalScore);
    
    document.getElementById('final-score').textContent = finalScore;
    document.getElementById('high-score-value').textContent = highScore;
    document.getElementById('game-over').classList.remove('hidden');
    soundEffects.gameover.play();
}

function collectPowerUp(santa, powerup) {
    powerup.disableBody(true, true);
    santa.powerups[powerup.type] = 100;
    soundEffects.powerup.play();
}

function hitObstacle(santa, obstacle) {
    obstacle.disableBody(true, true);
    santa.setVelocity(0, 0);
    soundEffects.jump.play();
}

function updateRobberAI() {
    if (robber.x > santa.x) {
        robber.setVelocityX(-100);
    } else {
        robber.setVelocityX(100);
    }
}

function spawnObstacles(scene) {
    const obstacleTypes = ['candy_cane', 'ice_patch'];
    const type = obstacleTypes[Phaser.Math.Between(0, 1)];
    const x = Phaser.Math.Between(100, 700);
    const obstacle = obstacles.create(x, 0, type);
    obstacle.setBounceY(0.4);
}

function createMobileControls(scene) {
    if (!game.device.desktop) {
        const leftBtn = scene.add.rectangle(50, 550, 60, 60, 0x000000, 0.5)
            .setInteractive()
            .on('pointerdown', () => moveLeft = true)
            .on('pointerup', () => moveLeft = false)
            .setScrollFactor(0);

        const rightBtn = scene.add.rectangle(130, 550, 60, 60, 0x000000, 0.5)
            .setInteractive()
            .on('pointerdown', () => moveRight = true)
            .on('pointerup', () => moveRight = false)
            .setScrollFactor(0);

        const jumpBtn = scene.add.rectangle(750, 550, 60, 60, 0x000000, 0.5)
            .setInteractive()
            .on('pointerdown', () => jump = true)
            .setScrollFactor(0);
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Add title
        this.add.text(centerX, centerY - 100, "Santa's Christmas Chase", {
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add play button
        const playButton = this.add.text(centerX, centerY, 'Play Game', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        })
        .setInteractive()
        .setOrigin(0.5);

        playButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Add level selection
        for (let i = 1; i <= 3; i++) {
            this.add.text(centerX, centerY + (i * 50), `Level ${i}`, {
                fontSize: '24px',
                fill: '#fff'
            })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                currentLevel = i;
                this.scene.start('GameScene');
            });
        }
    }
}

function togglePause() {
    if (currentState === GameState.PLAYING) {
        currentState = GameState.PAUSED;
        this.physics.pause();
        this.add.text(400, 300, 'PAUSED', {
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0);
    } else if (currentState === GameState.PAUSED) {
        currentState = GameState.PLAYING;
        this.physics.resume();
    }
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > 3) {
        // Game completed
        gameWin();
    } else {
        resetLevel();
    }
}

function resetLevel() {
    const level = levelData[currentLevel];
    presents.clear(true, true);
    obstacles.clear(true, true);
    spawnPresents(level.presentCount);
    spawnObstacles(level.obstacleCount);
    robber.setData('speed', level.robberSpeed);
}

function gameWin() {
    currentState = GameState.GAMEOVER;
    this.physics.pause();
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.add.text(centerX, centerY - 50, 'Congratulations!', {
        fontSize: '48px',
        fill: '#fff'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 50, 'You caught the robber\nand saved Christmas!', {
        fontSize: '32px',
        fill: '#fff',
        align: 'center'
    }).setOrigin(0.5);

    soundEffects.victory.play();
}

function createWeatherEffects() {
    // Snow
    const snowEmitter = particles.createEmitter({
        frame: 'snowflake',
        x: { min: 0, max: game.config.width },
        y: -10,
        lifespan: 6000,
        speedY: { min: 50, max: 100 },
        scale: { start: 0.2, end: 0.1 },
        quantity: 2,
        blendMode: 'ADD'
    });

    // Fog
    const fogEmitter = particles.createEmitter({
        frame: 'fog',
        x: { min: 0, max: game.config.width },
        y: game.config.height - 50,
        lifespan: 3000,
        alpha: { start: 0.3, end: 0 },
        scale: { start: 1, end: 2 },
        quantity: 1,
        frequency: 500
    });
}
