window.onload = function() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#4488aa',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: true
            }
        },
        scene: {
            create: create,
            update: update
        }
    };

    let game = new Phaser.Game(config);
    let player;
    let cursors;
    let score = 0;
    let scoreText;
    let snowParticles;

    function create() {
        // Create snow particles
        snowParticles = this.add.particles(0, 0, {
            frame: { frames: [0], cycle: true },
            lifespan: 4000,
            speedY: { min: 50, max: 100 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.1, end: 0.4 },
            quantity: 2,
            blendMode: 'ADD',
            emitting: true,
            frequency: 50,
            reserve: 1000,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, -50, 800, 1)
            }
        });

        // Create white rectangle particles for snow
        snowParticles.createEmitter({
            x: 0,
            y: 0,
            quantity: 2,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, -10, game.config.width, 1)
            },
            frame: {
                frames: [snowParticles.createRect(0, 0, 4, 4, 0xffffff)]
            },
            alpha: { start: 0.8, end: 0.3 },
            lifespan: 4000,
            speedY: { min: 50, max: 100 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.4, end: 0.1 },
            frequency: 20
        });

        // Create a red rectangle for the player
        player = this.add.rectangle(400, 300, 50, 50, 0xff0000);
        this.physics.add.existing(player);
        player.body.setBounce(0.2);
        player.body.setCollideWorldBounds(true);

        // Add some collectible items (green squares)
        let items = this.physics.add.group({
            key: 'item',
            repeat: 5,
            setXY: { x: 100, y: 0, stepX: 100 }
        });

        items.children.iterate(function (child) {
            child.setName('item');
            child.setDisplaySize(30, 30);
            child.setFillStyle(0x00ff00);
            child.body.setBounceY(0.5);
        });

        // Add score text
        scoreText = this.add.text(16, 16, 'Score: 0', { 
            fontSize: '32px', 
            fill: '#fff',
            fontFamily: 'Arial'
        });

        // Add collision detection
        this.physics.add.collider(player, items, collectItem, null, this);
        
        // Set up cursor keys
        cursors = this.input.keyboard.createCursorKeys();

        // Add ground
        let ground = this.add.rectangle(400, 580, 800, 40, 0x00ff00);
        this.physics.add.existing(ground, true); // true makes it static
        this.physics.add.collider(player, ground);
        this.physics.add.collider(items, ground);
    }

    function update() {
        // Handle player movement
        if (cursors.left.isDown) {
            player.body.setVelocityX(-160);
        } else if (cursors.right.isDown) {
            player.body.setVelocityX(160);
        } else {
            player.body.setVelocityX(0);
        }

        if (cursors.up.isDown && player.body.touching.down) {
            player.body.setVelocityY(-330);
        }
    }

    function collectItem(player, item) {
        item.destroy();
        score += 10;
        scoreText.setText('Score: ' + score);
    }
}
