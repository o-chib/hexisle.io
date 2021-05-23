import { Constant } from '../../shared/constants';
import { ClientGameObject } from './clientGameObject';
import { ClientGameObjectContainer } from './clientGameObjectContainer';
import { ClientTerritory } from './clientTerritory';

export class ClientCampfire extends ClientGameObjectContainer {
	constructor(scene: Phaser.Scene) {
		super();
		this.children.push(new ClientCampfireSprite(scene));
		this.children.push(new ClientCampfireRing(scene));
		this.children.push(new ClientTerritory(scene));
	}
}

class ClientCampfireSprite extends ClientGameObject {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public create(_campfireLiteral: any) {
		this.setTexture('campfire');
		this.setDepth(Constant.SPRITE_DEPTH.CAMP);
	}

	public update(campfireLiteral: any) {
		this.handleCampfireAnimation(
			Constant.TEAM.NONE != campfireLiteral.teamNumber
		);
	}

	private handleCampfireAnimation(isLit: boolean) {
		if (!this.anims.get('campfire_lit')) {
			this.anims.create({
				key: 'campfire_lit',
				frames: this.anims.generateFrameNames('campfire', {
					start: 1,
					end: 4,
				}),
				frameRate: 5,
				repeat: -1,
			});
		}
		if (!this.anims.get('campfire_unlit')) {
			this.anims.create({
				key: 'campfire_unlit',
				frames: this.anims.generateFrameNames('campfire', {
					start: 0,
					end: 0,
				}),
				frameRate: 1,
				repeat: -1,
			});
		}

		if (isLit) {
			if (
				this.anims.getName() == 'campfire_unlit' ||
				this.anims.getName() == ''
			) {
				this.anims.stop();
				this.anims.play('campfire_lit', true);
			}
		} else {
			if (
				this.anims.getName() == 'campfire_lit' ||
				this.anims.getName() == ''
			) {
				this.anims.stop();
				this.anims.play('campfire_unlit', true);
			}
		}
	}
}

class ClientCampfireRing extends ClientGameObject {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public create(_campfireLiteral: any) {
		this.setTexture('campfire_ring_loader');
	}

	public update(newCampfireLiteral: any) {
		this.handleCampfireCaptureAnimation(newCampfireLiteral.captureProgress);
	}

	private handleCampfireCaptureAnimation(captureProgress: number) {
		if (!this.anims.get('campfire_ring_loader_capturing')) {
			this.anims.create({
				key: 'campfire_ring_loader_capturing',
				frames: this.anims.generateFrameNames('campfire_ring_loader'),
			});
			this.anims.startAnimation('campfire_ring_loader_capturing');
			this.anims.pause();
		}
		this.anims.setProgress(captureProgress / 100);
	}
}
