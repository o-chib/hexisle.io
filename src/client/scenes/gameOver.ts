import mainMenu from './mainMenu';
import Utilities from './Utilities';
import { Constant } from './../../shared/constants';

export default class gameOver extends Phaser.Scene {
    public static Name = 'gameOver';
    private socket: SocketIOClient.Socket;
    private endState;
    private playerName;

    constructor() {
		super('gameOver');
	}

	init(data): void {
        this.socket = data.socket;
        this.endState = data.endState;
        this.playerName = data.name;
    }

	preload(): void {
		// Preload stuff here
	}

    create(): void {
        Utilities.LogSceneMethodEntry('gameOver', 'create');

        const renderWidth = this.game.renderer.width;
		const renderHeight = this.game.renderer.height;

        // Background image
		this.add.image(0,0, "lobby_bg").setOrigin(0).setDepth(0);

        // Logo and Title
		const logoImg = this.add.image(renderWidth/2, renderHeight*0.20, "campfire_lit").setDepth(1);
		this.add.image(renderWidth/2, logoImg.y+50, 'lobby_logo').setDepth(2).setScale(0.5);

        // Message
        this.add.text(renderWidth/2-200, renderHeight*0.5, 'Game Over, ' + this.playerName, {
            fontSize: '36px',
        });

        // Play Again
        let playAgainbutton = this.add.image(renderWidth/2, renderHeight*0.6, 'playAgain').setDepth(1).setScale(0.75);

        // Interactions
        playAgainbutton.setInteractive();
		playAgainbutton.on(
			'pointerdown',
			() => {
				this.loadMainMenu();
			},
			this
		);

        this.time.addEvent({
			// Run after ten seconds.
			delay: 5000,
			callback: this.loadMainMenu,
			callbackScope: this,
			loop: false
		});
    }

    private loadMainMenu() {
        this.scene.start(mainMenu.Name, {
			socket: this.socket,
		});
    }
}