import mainMenu from './mainMenu';
import Utilities from './Utilities';
import io from 'socket.io-client';

export default class Preloader extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = 'Preloader';
	private socket: SocketIOClient.Socket;

	constructor() {
		super('Preloader');
	}

	public preload(): void {
		this.addProgressBar();

		this.socket = io();

		// Players
		this.load.spritesheet('player_red', '../assets/player_red.png', {
			frameWidth: 94,
			frameHeight: 120,
		});
		this.load.spritesheet('player_blue', '../assets/player_blue.png', {
			frameWidth: 94,
			frameHeight: 120,
		});

		// Team Bases
		this.load.spritesheet('base_red', '../assets/base_red.png', {
			frameWidth: 385,
			frameHeight: 400,
		});
		this.load.spritesheet('base_blue', '../assets/base_blue.png', {
			frameWidth: 385,
			frameHeight: 400,
		});

		// Walls
		this.load.spritesheet('wall_neutral', '../assets/wall_neutral.png', {
			frameWidth: 154,
			frameHeight: 134,
		});
		this.load.spritesheet('wall_red', '../assets/wall_red.png', {
			frameWidth: 154,
			frameHeight: 134,
		});
		this.load.spritesheet('wall_blue', '../assets/wall_blue.png', {
			frameWidth: 154,
			frameHeight: 134,
		});

		// Turrets
		this.load.spritesheet(
			'turret_base_neutral',
			'../assets/turret_base_neutral.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet(
			'turret_base_red',
			'../assets/turret_base_red.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet(
			'turret_base_blue',
			'../assets/turret_base_blue.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet(
			'turret_shooter',
			'../assets/turret_shooter.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet('campfire', '../assets/campfire.png', {
			frameWidth: 246,
			frameHeight: 255,
		});
		this.load.spritesheet(
			'campfire_ring_loader',
			'../assets/campfire_loader.png',
			{
				frameWidth: 155,
				frameHeight: 135,
			}
		);
		// Lobby
		this.load.image('logo', '../assets/logo.png');
		this.load.image('lobby_bg', '../assets/lobby_bg.png');
		this.load.image('help_menu', '../assets/help.png');
		this.load.html('form', '../supportfiles/form.html');
		this.load.html('form_gameover', '../supportfiles/form_gameover.html');

		// Main Game
		this.load.image(
			'quit_button_unpressed',
			'../assets/quit_button_unpressed.png'
		);
		this.load.image(
			'quit_button_pressed',
			'../assets/quit_button_pressed.png'
		);

		// Health Bars
		this.load.image('healthbar_red', '../assets/healthbar_red.png');
		this.load.image('healthbar_blue', '../assets/healthbar_blue.png');
		this.load.image('healthbar_green', '../assets/healthbar_green.png');
		this.load.image('bar_backing_thin', '../assets/bar_backing_thin.png');
		this.load.image(
			'bar_backing_medium',
			'../assets/bar_backing_medium.png'
		);
		this.load.image('bar_backing_thick', '../assets/bar_backing_thick.png');

		// Icons
		this.load.image('heart_icon', '../assets/heart_icon.png');
		this.load.image('coin_icon', '../assets/coin_icon.png');
		this.load.image('timer_icon', '../assets/timer_icon.png');
		this.load.image('flag_icon_red', '../assets/flag_icon_red.png');
		this.load.image('flag_icon_blue', '../assets/flag_icon_blue.png');

		// GameOver
		this.load.image(
			'return_button_unpressed',
			'../assets/return_button_unpressed.png'
		);
		this.load.image(
			'return_button_pressed',
			'../assets/return_button_pressed.png'
		);

		// Static Images
		this.load.image('bullet_red', '../assets/bullet.png');
		this.load.image('bullet_blue', '../assets/bulletblue.png');
		this.load.image('campfire_lit', '../assets/campfire_lit.png');
		this.load.image('resSmall', '../assets/resourceSmall.png');
		this.load.image('resMedium', '../assets/resourceMedium.png');
		this.load.image('resLarge', '../assets/resourceLarge.png');
		this.load.image('grass_chunk', '../assets/chunk.png');
		this.load.image('grass_chunk_red', '../assets/chunk_red.png');
		this.load.image('grass_chunk_blue', '../assets/chunk_blue.png');

		// UI
		this.load.image(
			'help_button_unpressed',
			'../assets/help_button_unpressed.png'
		);
		this.load.image(
			'help_button_pressed',
			'../assets/help_button_pressed.png'
		);
		this.load.image('help_popup', '../assets/help_popup.png');

		// SFX
		this.load.audio('sfx_player_hit', '../assets/sounds/mixkit-boxer-getting-hit-2055.wav');
		this.load.audio('sfx_player_respawn', '../assets/sounds/mixkit-video-game-health-recharge-2837.wav');
	}

	public create(): void {
		Utilities.LogSceneMethodEntry('Preloader', 'create');

		this.scene.start(mainMenu.Name, {
			socket: this.socket,
		});
	}

	public update(): void {
		// preload handles updates to the progress bar, so nothing should be needed here.
	}

	/**
	 * Adds a progress bar to the display, showing the percentage of assets loaded and their name.
	 */
	private addProgressBar(): void {
		const width = this.cameras.main.width;
		const height = this.cameras.main.height;
		/** Customizable. This text color will be used around the progress bar. */
		const outerTextColor = '#ffffff';

		const progressBar = this.add.graphics();
		const progressBox = this.add.graphics();
		progressBox.fillStyle(0x222222, 0.8);
		progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

		const loadingText = this.make.text({
			x: width / 2,
			y: height / 2 - 50,
			text: 'Loading...',
			style: {
				font: '20px monospace',
				color: outerTextColor,
			},
		});
		loadingText.setOrigin(0.5, 0.5);

		const percentText = this.make.text({
			x: width / 2,
			y: height / 2 - 5,
			text: '0%',
			style: {
				font: '18px monospace',
				color: '#ffffff',
			},
		});
		percentText.setOrigin(0.5, 0.5);

		const assetText = this.make.text({
			x: width / 2,
			y: height / 2 + 50,
			text: '',
			style: {
				font: '18px monospace',
				color: outerTextColor,
			},
		});

		assetText.setOrigin(0.5, 0.5);

		this.load.on('progress', (value: number) => {
			percentText.setText(parseInt(value * 100 + '', 10) + '%');
			progressBar.clear();
			progressBar.fillStyle(0xffffff, 1);
			progressBar.fillRect(
				width / 4 + 10,
				height / 2 - 30 + 10,
				(width / 2 - 10 - 10) * value,
				30
			);
		});

		this.load.on('fileprogress', (file: Phaser.Loader.File) => {
			assetText.setText('Loading asset: ' + file.key);
		});

		this.load.on('complete', () => {
			progressBar.destroy();
			progressBox.destroy();
			loadingText.destroy();
			percentText.destroy();
			assetText.destroy();
		});
	}
}
