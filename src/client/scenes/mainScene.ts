import gameOver from './gameOver';
import mainMenu from './mainMenu';
import HUDScene from './HUDScene';
import HelpOverlayScene from './helpOverlayScene';
import { HexTiles, OffsetPoint, Point } from './../../shared/hexTiles';
import { Constant } from './../../shared/constants';
import Utilities from './Utilities';
import ObjectPool from '../objectPool';
import { ClientWall } from '../objects/clientWall';
import { ClientTurret } from '../objects/clientTurret';
import { ClientBullet } from '../objects/clientBullet';
import { ClientResource } from '../objects/clientResource';
import { ClientBase } from '../objects/clientBase';
import { ClientTerritory } from '../objects/clientTerritory';
import { ClientCampfire } from '../objects/clientCampfire';

type KeySet = { [key: string]: Phaser.Input.Keyboard.Key };

export default class MainScene extends Phaser.Scene {
	public static Name = 'MainScene';
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private bulletSprites: ObjectPool;
	private wallSprites: ObjectPool;
	private turretSprites: ObjectPool;
	private campfireSprites: ObjectPool;
	private campfireRingSprites: Map<string, Phaser.GameObjects.Sprite>;
	private baseSprites: ObjectPool;
	private territorySprites: ObjectPool;
	private resourceSprites: ObjectPool;
	private deadObjects: Set<unknown>;
	private moveKeys: KeySet;
	private actionKeys: KeySet;
	private socket: SocketIOClient.Socket;
	private alive = false;
	private hexTiles: HexTiles;
	private debugMode = false;

	constructor() {
		super('MainScene');
	}

	init(data): void {
		this.socket = data.socket;

		this.initializeKeys();
		this.generatePlayerSprite();

		this.hexTiles = new HexTiles();
		this.otherPlayerSprites = new Map();
		this.bulletSprites = new ObjectPool(this, ClientBullet, 10);
		this.wallSprites = new ObjectPool(this, ClientWall, 10);
		this.turretSprites = new ObjectPool(this, ClientTurret, 10);
		this.campfireSprites = new ObjectPool(this, ClientCampfire, 5);
		this.campfireRingSprites = new Map();
		this.baseSprites = new ObjectPool(this, ClientBase, 2);
		this.territorySprites = new ObjectPool(this, ClientTerritory, 10);
		this.resourceSprites = new ObjectPool(this, ClientResource, 10);
		this.deadObjects = new Set();
	}

	create(): void {
		Utilities.LogSceneMethodEntry('MainScene', 'create');

		this.scene.launch(HUDScene.Name);
		this.scene.launch(HelpOverlayScene.Name);

		this.game.canvas.oncontextmenu = function (e) {
			e.preventDefault();
		};
		this.registerListeners();

		this.socket.emit(Constant.MESSAGE.START_GAME);
		this.events.emit('startHUD');
		this.events.emit('showUI');
	}

	update(): void {
		this.updateDirection();
		if (this.debugMode) this.updateDebugInfo();
	}

	private updateDebugInfo(): void {
		const gamePos = this.cameras.main.getWorldPoint(
			this.input.mousePointer.x,
			this.input.mousePointer.y
		);
		const coord: OffsetPoint = this.hexTiles.cartesianToOffset(
			new Point(gamePos.x, gamePos.y)
		);
		this.events.emit(
			'updateDebugInfo',
			gamePos.x,
			gamePos.y,
			coord.q,
			coord.r
		);
	}

	private generatePlayerSprite(): void {
		this.myPlayerSprite = this.add.sprite(0, 0, '');
		this.myPlayerSprite.setDepth(1000);
		this.myPlayerSprite.setVisible(false);
		this.myPlayerSprite.setScale(1);
	}

	private initializeKeys(): void {
		this.moveKeys = <KeySet>this.input.keyboard.addKeys(
			{
				up: Phaser.Input.Keyboard.KeyCodes.W,
				down: Phaser.Input.Keyboard.KeyCodes.S,
				left: Phaser.Input.Keyboard.KeyCodes.A,
				right: Phaser.Input.Keyboard.KeyCodes.D,
			},
			false
		);

		this.actionKeys = <KeySet>this.input.keyboard.addKeys(
			{
				buildWall: Phaser.Input.Keyboard.KeyCodes.E,
				buildTurret: Phaser.Input.Keyboard.KeyCodes.Q,
				demolishStructure: Phaser.Input.Keyboard.KeyCodes.R,
				debugInfo: Phaser.Input.Keyboard.KeyCodes.N,
				toggleHelp: Phaser.Input.Keyboard.KeyCodes.FORWARD_SLASH,
			},
			false
		);
	}

	private registerListeners(): void {
		this.registerSocketListeners();
		this.registerInputListeners();
	}

	private registerSocketListeners(): void {
		this.socket.once(
			Constant.MESSAGE.INITIALIZE,
			this.initializeGame.bind(this)
		);

		this.socket.on(
			Constant.MESSAGE.GAME_UPDATE,
			this.updateState.bind(this)
		);

		this.socket.once(Constant.MESSAGE.GAME_END, this.gameOver.bind(this));
		this.scene
			.get('HUDScene')
			.events.once('leaveGame', this.leaveGame.bind(this));
	}

	private registerInputListeners(): void {
		this.input.on('pointerdown', (pointer) => {
			if (!this.alive) return;
			const direction = this.getMouseDirection(pointer);

			this.socket.emit(Constant.MESSAGE.SHOOT, direction);
		});

		for (const key in this.moveKeys) {
			this.moveKeys[key].addListener(
				'down',
				this.updateMovementDirection.bind(this)
			);
			this.moveKeys[key].addListener(
				'up',
				this.updateMovementDirection.bind(this)
			);
		}

		for (const key in this.actionKeys) {
			this.actionKeys[key].addListener(
				'down',
				this.actionButtonPress.bind(this)
			);
		}
	}

	private deregisterInputListeners(): void {
		for (const key in this.moveKeys) {
			this.moveKeys[key].removeAllListeners();
		}
		for (const key in this.actionKeys) {
			this.actionKeys[key].removeAllListeners();
		}
	}

	private updateDirection() {
		if (!this.alive) {
			this.myPlayerSprite.setRotation(0);
			this.socket.emit(Constant.MESSAGE.ROTATE, 0);
			return;
		}

		const direction =
			this.getMouseDirection(this.input.mousePointer) - Math.PI * 0.5;

		this.myPlayerSprite.setRotation(direction);
		this.socket.emit(Constant.MESSAGE.ROTATE, direction);
	}

	private getMouseDirection(pointer: any): any {
		const gamePos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

		return Math.atan2(
			gamePos.y - this.myPlayerSprite.y,
			gamePos.x - this.myPlayerSprite.x
		);
	}

	private initializeGame(update: any): void {
		const { player } = update;
		if (player == null) return;

		this.setCamera();
		this.initializePlayer(player);
	}

	private initializePlayer(player: any): void {
		// Change this when more than 2 teams
		if (player.teamNumber == Constant.TEAM.RED)
			this.myPlayerSprite.setTexture('player_red');
		else if (player.teamNumber == Constant.TEAM.BLUE)
			this.myPlayerSprite.setTexture('player_blue');

		this.alive = true;
	}

	private setCamera(): void {
		this.cameras.main.startFollow(this.myPlayerSprite, true);
		this.cameras.main.setZoom(0.75);
		this.cameras.main.setBackgroundColor('#00376F');
	}

	// Animation control
	private handleWalkAnimation(
		player: Phaser.GameObjects.Sprite,
		playerTextureName: string,
		xVel: number,
		yVel: number
	) {
		// Create local animation on each sprite if it doesn't exist
		// player texture name refers to 'player_red', 'player_blue', etc which is the loaded spritesheet key
		if (!player.anims.get(playerTextureName + '_walk')) {
			player.anims.create({
				key: playerTextureName + '_walk',
				frames: this.anims.generateFrameNames(playerTextureName, {
					start: 0,
					end: 3,
				}),
				frameRate: 8,
				repeat: -1,
			});
			player.anims.play(playerTextureName + '_walk');
			player.anims.pause();
		}

		if (player.anims.currentAnim.key != playerTextureName + '_walk') {
			// Update anims internal isPlaying/isPaused variables, and loaded anim.
			player.anims.stop();
			player.anims.play(playerTextureName + '_walk');
			player.anims.pause();
		}

		// Use overall player velocity to continue animation
		if (xVel != 0 || yVel != 0) {
			if (player.anims.isPaused) {
				player.anims.resume();
			}
		} else {
			if (player.anims.isPlaying) {
				player.anims.pause();
			}
		}

		return player;
	}

	private handleDeathAnimation(
		player: Phaser.GameObjects.Sprite,
		playerTextureName: string
	) {
		player.setRotation(0);
		// Create local animation on each sprite if it doesn't exist
		// player texture name refers to 'player_red', 'player_blue', etc which is the loaded spritesheet key
		if (!player.anims.get(playerTextureName + '_death')) {
			player.anims.create({
				key: playerTextureName + '_death',
				frames: this.anims.generateFrameNames(playerTextureName, {
					start: 4,
					end: 12,
				}),
				frameRate: 8,
				hideOnComplete: true,
			});
		}
		if (player.anims.currentAnim.key == playerTextureName + '_walk') {
			player.anims.stop();
			player.anims.play(playerTextureName + '_death', true);
		}
		return player;
	}

	calculateDirection() {
		let direction = NaN;
		if (this.moveKeys.left.isDown && !this.moveKeys.right.isDown) {
			if (this.moveKeys.up.isDown && !this.moveKeys.down.isDown)
				direction = Constant.DIRECTION.NW;
			else if (this.moveKeys.down.isDown && !this.moveKeys.up.isDown)
				direction = Constant.DIRECTION.SW;
			else direction = Constant.DIRECTION.W;
		} else if (this.moveKeys.right.isDown && !this.moveKeys.left.isDown) {
			if (this.moveKeys.up.isDown && !this.moveKeys.down.isDown)
				direction = Constant.DIRECTION.NE;
			else if (this.moveKeys.down.isDown && !this.moveKeys.up.isDown)
				direction = Constant.DIRECTION.SE;
			else direction = Constant.DIRECTION.E;
		} else {
			if (this.moveKeys.up.isDown && !this.moveKeys.down.isDown)
				direction = Constant.DIRECTION.N;
			else if (this.moveKeys.down.isDown && !this.moveKeys.up.isDown)
				direction = Constant.DIRECTION.S;
		}
		return direction;
	}

	private updateMovementDirection(): void {
		if (!this.alive) return;
		const direction = this.calculateDirection();

		this.socket.emit(Constant.MESSAGE.MOVEMENT, direction);
	}

	private actionButtonPress(): void {
		const gamePos = this.cameras.main.getWorldPoint(
			this.input.mousePointer.x,
			this.input.mousePointer.y
		);

		const coord: OffsetPoint = this.hexTiles.cartesianToOffset(
			new Point(gamePos.x, gamePos.y)
		);

		if (this.actionKeys.buildWall.isDown) {
			this.socket.emit(
				Constant.MESSAGE.BUILD_STRUCTURE,
				coord,
				Constant.BUILDING.WALL
			);
		} else if (this.actionKeys.buildTurret.isDown) {
			this.socket.emit(
				Constant.MESSAGE.BUILD_STRUCTURE,
				coord,
				Constant.BUILDING.TURRET
			);
		} else if (this.actionKeys.demolishStructure.isDown) {
			this.socket.emit(Constant.MESSAGE.DEMOLISH_STRUCTURE, coord);
		} else if (this.actionKeys.debugInfo.isDown) {
			if (this.debugMode) this.events.emit('clearDebugInfo');
			this.debugMode = !this.debugMode;
		} else if (this.actionKeys.toggleHelp.isDown) {
			this.events.emit('toggleHelpUI');
		}
	}

	updateState(update: any): void {
		//TODO may state type
		const {
			time,
			currentPlayer,
			otherPlayers,
			bullets,
			walls,
			turrets,
			campfires,
			bases,
			territories,
			resources,
		} = update;
		if (currentPlayer == null) return;

		this.updatePlayer(currentPlayer);

		this.updateOpponents(otherPlayers);

		this.updateGamePool(bullets, this.bulletSprites);

		this.updateGamePool(walls, this.wallSprites);

		this.updateGamePool(turrets, this.turretSprites);

		this.updateGamePool(campfires, this.campfireSprites);

		this.updateGamePool(bases, this.baseSprites);

		this.updateGamePool(territories, this.territorySprites);

		this.updateGamePool(resources, this.resourceSprites);

		this.events.emit('updateHUD', currentPlayer, time);
	}

	private updatePlayer(currentPlayer: any) {
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);

		//  Local Animation control
		if (currentPlayer.hp > 0) {
			this.alive = true;
			this.myPlayerSprite.setVisible(true);

			this.myPlayerSprite = this.handleWalkAnimation(
				this.myPlayerSprite,
				this.myPlayerSprite.texture.key,
				currentPlayer.xVel,
				currentPlayer.yVel
			);
		} else if (currentPlayer.hp <= 0) {
			this.alive = false;
			this.handleDeathAnimation(
				this.myPlayerSprite,
				this.myPlayerSprite.texture.key
			);
		}
	}

	private updateOpponents(otherPlayers: any) {
		this.updateMapOfObjects(
			otherPlayers,
			this.otherPlayerSprites,
			'',
			(newPlayer, playerLiteral) => {
				newPlayer.setRotation(playerLiteral.direction);

				// Set Walk/Standing textures based on team
				let playerTexture = '';
				if (playerLiteral.teamNumber == Constant.TEAM.RED)
					playerTexture = 'player_red';
				else if (playerLiteral.teamNumber == Constant.TEAM.BLUE)
					playerTexture = 'player_blue';

				if (newPlayer.texture.key != playerTexture)
					//TODO faster lookup somehow? check null?
					newPlayer.setTexture(playerTexture).setDepth(1000);

				// Opponent Animation Control
				if (playerLiteral.hp > 0) {
					newPlayer.setVisible(true);
					newPlayer = this.handleWalkAnimation(
						newPlayer,
						playerTexture,
						playerLiteral.xVel,
						playerLiteral.yVel
					);
				}
				if (playerLiteral.hp <= 0) {
					this.handleDeathAnimation(newPlayer, playerTexture);
				}

				return newPlayer;
			}
		);
	}

	private updateMapOfObjects(
		currentObjects: any,
		oldObjects: Map<string, any>,
		sprite: string,
		callback: (arg0: any, arg1: any) => any
	) {
		this.deadObjects.clear();

		currentObjects.forEach((obj) => {
			let newObj;

			if (oldObjects.has(obj.id)) {
				newObj = oldObjects.get(obj.id);
				newObj.setPosition(obj.xPos, obj.yPos);
			} else {
				newObj = this.add.sprite(obj.xPos, obj.yPos, sprite);
				oldObjects.set(obj.id, newObj);
			}

			this.deadObjects.add(obj.id);
			callback(newObj, obj);
		});

		for (const anOldKey of oldObjects.keys()) {
			if (this.deadObjects.has(anOldKey)) continue;

			oldObjects.get(anOldKey)?.destroy();
			oldObjects.delete(anOldKey);
		}
	}

	private updateGamePool(arrayOfNewObjStates: any[], objectPool: ObjectPool) {
		arrayOfNewObjStates.forEach((obj) => {
			objectPool.get(obj.id, obj).update(obj);
		});

		objectPool.clean();
	}

	private gameOver(endState: any): void {
		this.endGame();

		this.scene.start(gameOver.Name, {
			socket: this.socket,
			endState: endState,
		});
	}

	private leaveGame(): void {
		this.socket.emit(Constant.MESSAGE.LEAVE_GAME);
		this.endGame();

		this.scene.start(mainMenu.Name, {
			socket: this.socket,
		});
	}

	private endGame(): void {
		this.deregisterInputListeners();
		this.cameras.resetAll();
		this.events.emit('stopHUD');
		this.events.emit('stopUI');
		this.socket.off(Constant.MESSAGE.GAME_UPDATE);
	}
}
