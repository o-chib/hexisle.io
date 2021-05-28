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
	
		this.preloadPlayers();
		this.preloadBases();
		this.preloadWalls();
		this.preloadTurrets();
		this.preloadBullets();
		this.preloadResources();
		this.preloadChunks();
		this.preloadCampfires();
		this.preloadLobby();
		this.preloadGameOver();
		this.preloadUI();
		this.preloadBars();
		this.preloadIcons();
		this.preloadSounds();
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

	/**
	 * Preloads player assets
	 */
	private preloadPlayers(): void {
		this.load.spritesheet(
			'player_red',
			'../assets/players/player_red.png',
			{
				frameWidth: 94,
				frameHeight: 120,
			}
		);
		this.load.spritesheet(
			'player_blue',
			'../assets/players/player_blue.png',
			{
				frameWidth: 94,
				frameHeight: 120,
			}
		);
	}

	/**
	 * Preloads base assets
	 */
	private preloadBases(): void {
		// Team Bases
		this.load.spritesheet('base_red', '../assets/bases/base_red.png', {
			frameWidth: 385,
			frameHeight: 400,
		});
		this.load.spritesheet('base_blue', '../assets/bases/base_blue.png', {
			frameWidth: 385,
			frameHeight: 400,
		});
	}

	/**
	 * Preloads wall assets
	 */
	private preloadWalls(): void {
		this.load.spritesheet(
			'wall_neutral',
			'../assets/walls/wall_neutral.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet('wall_red', '../assets/walls/wall_red.png', {
			frameWidth: 154,
			frameHeight: 134,
		});
		this.load.spritesheet('wall_blue', '../assets/walls/wall_blue.png', {
			frameWidth: 154,
			frameHeight: 134,
		});
	}

	/**
	 * Preloads turret assets
	 */
	private preloadTurrets(): void {
		this.load.spritesheet(
			'turret_base_neutral',
			'../assets/turrets/turret_base_neutral.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet(
			'turret_base_red',
			'../assets/turrets/turret_base_red.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet(
			'turret_base_blue',
			'../assets/turrets/turret_base_blue.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet(
			'turret_shooter',
			'../assets/turrets/turret_shooter.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
	}

	/**
	 * Preloads bullet assets
	 */
	private preloadBullets(): void {
		this.load.image('bullet_red', '../assets/bullets/bullet_red.png');
		this.load.image('bullet_blue', '../assets/bullets/bullet_blue.png');
	}

	/**
	 * Preloads resource assets
	 */
	private preloadResources(): void {
		this.load.image('resSmall', '../assets/resources/resourceSmall.png');
		this.load.image('resMedium', '../assets/resources/resourceMedium.png');
		this.load.image('resLarge', '../assets/resources/resourceLarge.png');
	}

	/**
	 * Preloads chunk assets
	 */
	private preloadChunks(): void {
		this.load.image('grass_chunk', '../assets/chunks/chunk.png');
		this.load.image('grass_chunk_red', '../assets/chunks/chunk_red.png');
		this.load.image('grass_chunk_blue', '../assets/chunks/chunk_blue.png');
	}

	/**
	 * Preloads campfire assets
	 */
	private preloadCampfires(): void {
		this.load.spritesheet('campfire', '../assets/campfires/campfire.png', {
			frameWidth: 246,
			frameHeight: 255,
		});
		this.load.spritesheet(
			'campfire_ring_loader',
			'../assets/campfires/campfire_loader.png',
			{
				frameWidth: 155,
				frameHeight: 135,
			}
		);
		this.load.image('campfire_lit', '../assets/campfires/campfire_lit.png');
	}

	/**
	 * Preloads lobby assets
	 */
	private preloadLobby(): void {
		this.load.image('logo', '../assets/lobby/logo.png');
		this.load.image('lobby_bg', '../assets/lobby/lobby_bg.png');
		this.load.image('help_menu', '../assets/lobby/help.png');
		this.load.html('form_mainmenu', '../supportfiles/form_mainmenu.html');
		this.load.html('form_gameover', '../supportfiles/form_gameover.html');
	}

	/**
	 * Preloads game over assets
	 */
	private preloadGameOver(): void {
		this.load.image(
			'return_button_unpressed',
			'../assets/gameover/return_button_unpressed.png'
		);
		this.load.image(
			'return_button_pressed',
			'../assets/gameover/return_button_pressed.png'
		);
	}

	/**
	 * Preloads UI assets
	 */
	private preloadUI(): void {
		this.load.image(
			'quit_button_unpressed',
			'../assets/ui/quit_button_unpressed.png'
		);
		this.load.image(
			'quit_button_pressed',
			'../assets/ui/quit_button_pressed.png'
		);

		this.load.image(
			'help_button_unpressed',
			'../assets/ui/help_button_unpressed.png'
		);
		this.load.image(
			'help_button_pressed',
			'../assets/ui/help_button_pressed.png'
		);

		this.load.image('sound_on_button', '../assets/ui/sound_on_button.png');
		this.load.image(
			'sound_off_button',
			'../assets/ui/sound_off_button.png'
		);

		this.load.image('help_popup', '../assets/ui/help_popup.png');
	}

	/**
	 * Preloads bars
	 */
	private preloadBars(): void {
		this.load.image('healthbar_red', '../assets/bars/healthbar_red.png');
		this.load.image('healthbar_blue', '../assets/bars/healthbar_blue.png');
		this.load.image(
			'healthbar_green',
			'../assets/bars/healthbar_green.png'
		);
		this.load.image(
			'bar_backing_thin',
			'../assets/bars/bar_backing_thin.png'
		);
		this.load.image(
			'bar_backing_medium',
			'../assets/bars/bar_backing_medium.png'
		);
		this.load.image(
			'bar_backing_thick',
			'../assets/bars/bar_backing_thick.png'
		);
	}

	/**
	 * Preloads Icons
	 */
	private preloadIcons(): void {
		this.load.image('heart_icon', '../assets/icons/heart_icon.png');
		this.load.image('coin_icon', '../assets/icons/coin_icon.png');
		this.load.image('timer_icon', '../assets/icons/timer_icon.png');
		this.load.image('flag_icon_red', '../assets/icons/flag_icon_red.png');
		this.load.image('flag_icon_blue', '../assets/icons/flag_icon_blue.png');
	}

	/**
	 * Preloads sounds
	 */
	private preloadSounds(): void {
		this.load.audio('menuMusic', '../sounds/menuMusic.wav');
		this.load.audio('backgroundMusic', '../sounds/backgroundMusic.wav');
		this.load.audio(
			'sfx_player_hit',
			'../assets/sounds/deathSound.wav'
		);
		this.load.audio(
			'sfx_player_respawn',
			'../assets/sounds/220173__gameaudio__spacey-1up-power-up.wav'
		);
	}
}
