import { Scene } from 'phaser';
import { Constant } from '../../shared/constants';
import { IPoolObject } from '../iPoolObject';
import { ClientGameObject } from './clientGameObject';
import { ClientGameObjectContainer } from './clientGameObjectContainer';

export class ClientPlayer extends ClientGameObjectContainer {
	public playerSprite: ClientPlayerSprite;

	constructor(scene: Phaser.Scene) {
		super();
		this.playerSprite = new ClientPlayerSprite(scene);
		this.children.push(this.playerSprite);
		this.children.push(new ClientPlayerName(scene));
	}

	public setRotation(direction: number) {
		this.playerSprite.setRotation(direction);
	}

	public getPosition() {
		return {
			x: this.playerSprite.x,
			y: this.playerSprite.y,
		};
	}
}

class ClientPlayerSprite extends ClientGameObject {
	public create(playerLiteral: any) {
		let playerTexture = '';
		if (playerLiteral.teamNumber == Constant.TEAM.RED)
			playerTexture = 'player_red';
		else if (playerLiteral.teamNumber == Constant.TEAM.BLUE)
			playerTexture = 'player_blue';

		this.setTexture(playerTexture);
		this.setDepth(10);
	}

	public update(playerLiteral: any) {
		this.setRotation(playerLiteral.direction);
		this.setPosition(playerLiteral.xPos, playerLiteral.yPos);

		// Opponent Animation Control
		if (playerLiteral.hp > 0) {
			if (this.visible == false) this.setVisible(true);
			this.handleWalkAnimation(playerLiteral.xVel, playerLiteral.yVel);
		} else if (playerLiteral.hp <= 0) {
			this.handleDeathAnimation();
		}

		return this;
	}

	private handleWalkAnimation(xVel: number, yVel: number) {
		// Create local animation on each sprite if it doesn't exist
		// player texture name refers to 'player_red', 'player_blue', etc which is the loaded spritesheet key
		const playerTextureName = this.texture.key;

		if (!this.anims.get(playerTextureName + '_walk')) {
			this.anims.create({
				key: playerTextureName + '_walk',
				frames: this.anims.generateFrameNames(playerTextureName, {
					start: 0,
					end: 3,
				}),
				frameRate: 8,
				repeat: -1,
			});
			this.anims.play(playerTextureName + '_walk');
			this.anims.pause();
		}

		if (this.anims.currentAnim.key != playerTextureName + '_walk') {
			// Update anims internal isPlaying/isPaused variables, and loaded anim.
			this.anims.stop();
			this.anims.play(playerTextureName + '_walk');
			this.anims.pause();
		}

		// Use overall player velocity to continue animation
		if (xVel != 0 || yVel != 0) {
			if (this.anims.isPaused) {
				this.anims.resume();
			}
		} else {
			if (this.anims.isPlaying) {
				this.anims.pause();
			}
		}

		return this;
	}

	private handleDeathAnimation() {
		const playerTextureName = this.texture.key;

		this.setRotation(0);
		// Create local animation on each sprite if it doesn't exist
		// player texture name refers to 'player_red', 'player_blue', etc which is the loaded spritesheet key
		if (!this.anims.get(playerTextureName + '_death')) {
			this.anims.create({
				key: playerTextureName + '_death',
				frames: this.anims.generateFrameNames(playerTextureName, {
					start: 4,
					end: 12,
				}),
				frameRate: 8,
				hideOnComplete: true,
			});
		}
		if (this.anims.currentAnim.key == playerTextureName + '_walk') {
			this.anims.stop();
			this.anims.play(playerTextureName + '_death', true);
		}
		return this;
	}
}

class ClientPlayerName extends Phaser.GameObjects.Text implements IPoolObject {
	public dirtyBit: boolean;

	constructor(scene: Phaser.Scene) {
		super(scene, 0, 0, '', {
			font: '48px Arial',
			stroke: '#000000',
			strokeThickness: 5,
		});
		scene.add.existing(this);
		this.setDepth(100000);
	}

	public update(objectState: any): void {
		this.setPosition(objectState.xPos, objectState.yPos);
	}

	public init(objLiteral: any): void {
		this.setAlive(true);
		this.setText(objLiteral.name);
		console.log(objLiteral.name);
	}

	public die(): void {
		this.setAlive(false);
	}

	protected setAlive(status: boolean) {
		this.setActive(status);
		this.setVisible(status);
	}
}
