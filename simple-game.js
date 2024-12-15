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
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let santa;
let presents;
let cursors;
let score = 0;
let gameOver = false;

function create() {
    // Create santa using a red rectangle
    santa = this.add.rectangle(400, 300, 32, 48, 0xff0000);
    this.physics.add.existing(santa);
    santa.body.setCollideWorldBounds(true);
    
    // Create presents using green squares
    presents = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(100, 500);
        const present = this.add.rectangle(x, y, 20, 20, 0x00ff00);
        this.physics.add.existing(present);
        presents.add(present);
    }
    
    // Set up controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Set up collisions
    this.physics.add.overlap(santa, presents, collectPresent, null, this);
}

function update() {
    if (gameOver) return;
    
    // Handle santa movement
    if (cursors.left.isDown) {
        santa.body.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        santa.body.setVelocityX(160);
    } else {
        santa.body.setVelocityX(0);
    }
    
    if (cursors.up.isDown && santa.body.touching.down) {
        santa.body.setVelocityY(-330);
    }
}

function collectPresent(santa, present) {
    present.destroy();
    score += 10;
    document.getElementById('score-value').textContent = score;
    
    if (presents.countActive() === 0) {
        document.getElementById('game-over-text').textContent = 'You Win!';
        document.getElementById('game-over').classList.remove('hidden');
        gameOver = true;
    }
}
