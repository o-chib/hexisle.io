import { Constant } from '../../shared/constants';
import MainScene from '../scenes/mainScene';
import { ClientGameObject } from './clientGameObject';
import { ClientGameObjectContainer } from './clientGameObjectContainer';

export class ClientPlayer extends ClientGameObjectContainer {
	public playerSprite: ClientPlayerSprite;

	constructor(scene: Phaser.Scene) {
		super();
		this.playerSprite = new ClientPlayerSprite(scene);
		this.children.push(this.playerSprite);
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
	private playerHP: number = Constant.HP.PLAYER;

	public create(playerLiteral: any) {
		this.setDepth(Constant.SPRITE_DEPTH.PLAYER);

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
		this.updateHealthEffects(playerLiteral.hp);

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

	private getVolume(): number {
		const mainSceneObj = this.scene.scene.get(MainScene.Name) as MainScene;
		const mainPlayerPosition = mainSceneObj.myPlayer.getPosition();
		const distance = Phaser.Math.Distance.Between(
			this.x,
			this.y,
			mainPlayerPosition.x,
			mainPlayerPosition.y
		);
		let ratio = distance / Constant.RADIUS.VIEW;
		ratio = Phaser.Math.Clamp(ratio, 0, 1);
		return 1 - ratio;
	}
	private updateHealthEffects(hp: any) {
		// Handle Player Health-Based Effects
		if (this.getCurrentHP() != hp) {
			if (hp != Constant.HP.PLAYER) {
				// Play on-hit/damage sound
				this.scene.sound.play('sfx_player_hit', {
					volume: this.getVolume(),
				});
				// Turn player red
				this.setTint(0xff0000);
			} else {
				// Play respawn sound
				this.scene.sound.play('sfx_player_respawn', {
					volume: this.getVolume(),
				});
			}
		} else {
			// Remove tint effects
			this.clearTint();
		}

		this.setCurrentHP(hp);
	}

	public setCurrentHP(hp: number): void {
		this.playerHP = hp;
	}

	public getCurrentHP(): number {
		return this.playerHP;
	}
}
