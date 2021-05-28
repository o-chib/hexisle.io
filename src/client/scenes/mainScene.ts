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
import { ClientCampfire } from '../objects/clientCampfire';
import { ClientPlayer } from '../objects/clientPlayer';

type KeySet = { [key: string]: Phaser.Input.Keyboard.Key };

export default class MainScene extends Phaser.Scene {
	public static Name = 'MainScene';
	private myPlayer: ClientPlayer;
	private otherPlayers: ObjectPool;
	private bullets: ObjectPool;
	private walls: ObjectPool;
	private turrets: ObjectPool;
	private campfires: ObjectPool;
	private bases: ObjectPool;
	private resources: ObjectPool;
	private moveKeys: KeySet;
	private actionKeys: KeySet;
	private socket: SocketIOClient.Socket;
	private hexTiles: HexTiles;
	private alive: boolean;
	private debugMode: boolean;

	constructor() {
		super(MainScene.Name);
	}

	init(data): void {
		this.socket = data.socket;

		this.initializeKeys();
		this.myPlayer = new ClientPlayer(this);
		this.myPlayer.die();

		this.hexTiles = new HexTiles();
		this.otherPlayers = new ObjectPool(this, ClientPlayer, 4);
		this.bullets = new ObjectPool(this, ClientBullet, 10);
		this.walls = new ObjectPool(this, ClientWall, 10);
		this.turrets = new ObjectPool(this, ClientTurret, 10);
		this.campfires = new ObjectPool(this, ClientCampfire, 5);
		this.bases = new ObjectPool(this, ClientBase, 2);
		this.resources = new ObjectPool(this, ClientResource, 10);
		this.alive = false;
		this.debugMode = false;
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
		this.shootIfMouseDown();
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

	private deregisterSocketListeners(): void {
		this.socket.off(Constant.MESSAGE.INITIALIZE);

		this.socket.off(Constant.MESSAGE.GAME_UPDATE);

		this.socket.off(Constant.MESSAGE.GAME_END);
		this.scene.get('HUDScene').events.off('leaveGame');
	}

	private registerInputListeners(): void {
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
		this.input.off('pointerdown');
		for (const key in this.moveKeys) {
			this.moveKeys[key].removeAllListeners();
		}
		for (const key in this.actionKeys) {
			this.actionKeys[key].removeAllListeners();
		}
	}

	private updateDirection() {
		if (!this.alive) return;

		const direction = this.getMouseDirection() - Math.PI * 0.5;

		this.myPlayer.setRotation(direction);
		this.socket.emit(Constant.MESSAGE.ROTATE, direction);
	}

	private shootIfMouseDown(): void {
		if (!this.alive || !this.input.activePointer.isDown) return;
		const direction = this.getMouseDirection(this.input.activePointer);
		this.socket.emit(Constant.MESSAGE.SHOOT, direction);
	}

	private getMouseDirection(pointer?: Phaser.Input.Pointer): any {
		if (!pointer) pointer = this.input.mousePointer;
		const gamePos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
		const playerPos = this.myPlayer.getPosition();

		return Math.atan2(gamePos.y - playerPos.y, gamePos.x - playerPos.x);
	}

	private initializeGame(update: any): void {
		const { player } = update;
		if (player == null) return;

		this.setCamera();
		this.initializePlayer(player);
	}

	private initializePlayer(player: any): void {
		this.myPlayer.init(player);
		this.alive = true;
	}

	private setCamera(): void {
		this.cameras.main.startFollow(this.myPlayer.playerSprite, true);
		this.cameras.main.setZoom(0.75);
		this.cameras.main.setBackgroundColor('#00376F');
	}

	private calculateDirection() {
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
			resources,
		} = update;
		if (currentPlayer == null) return;

		this.updatePlayer(currentPlayer);

		this.updateGamePool(otherPlayers, this.otherPlayers);

		this.updateGamePool(bullets, this.bullets);

		this.updateGamePool(walls, this.walls);

		this.updateGamePool(turrets, this.turrets);

		this.updateGamePool(campfires, this.campfires);

		this.updateGamePool(bases, this.bases);

		this.updateGamePool(resources, this.resources);

		this.events.emit('updateHUD', currentPlayer, time);

		this.updateTeamHealthBars(bases);
	}

	private updateTeamHealthBars(bases: any[]) {
		bases.forEach((obj) => {
			// team healthbars
			this.events.emit(
				'updateTeamHealthbar',
				obj.teamNumber,
				obj.hp / Constant.HP.BASE
			);
			// base navigator
			let basePosition = {
				x:obj.xPos,
				y:obj.yPos
			};
			this.events.emit(
				'updateBaseNavigator',
				obj.teamNumber,
				basePosition,
				this.myPlayer.getPosition()
			);
		});
	}

	private updatePlayer(currentPlayer: any) {
		this.alive = currentPlayer.hp > 0;
		this.myPlayer.update(currentPlayer);
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
		this.deregisterSocketListeners();
		this.cameras.resetAll();
		this.events.emit('stopHUD');
		this.events.emit('stopUI');
	}
}
