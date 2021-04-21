import Player from './../shared/player';
import Bullet from './../shared/bullet';
import Wall from '../shared/wall';
import Campfire from '../shared/campfire';
import Base from '../shared/base';
import { Quadtree, Rect, CollisionObject } from './quadtree';
import { Constant } from '../shared/constants';
import { Point } from '../shared/hexTiles';
import { ResourceSystem, Resource } from './../shared/resources'

export default class CollisionDetection {
	quadtree: Quadtree;

	constructor() {
		this.quadtree = new Quadtree();
	}

	playerResourceCollision(player: Player, resourceSystem: ResourceSystem): void {
		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				player.xPos - Constant.PLAYER_RADIUS,
				player.xPos + Constant.PLAYER_RADIUS,
				player.yPos + Constant.PLAYER_RADIUS,
				player.yPos - Constant.PLAYER_RADIUS
			),
			results
		);

		results.forEach((result) => {
			if (
				result.payload instanceof Resource &&
				result.payload.dropAmount > 0 &&
				this.doCirclesCollide(
					player,
					Constant.PLAYER_RADIUS,
					result.payload,
					Constant.RESOURCE_RADIUS
				)
			) {
				player.updateResource(result.payload.dropAmount);
				resourceSystem.deleteResource(result.payload);
				
				this.quadtree.deleteFromQuadtree(
					new CollisionObject(
						result.payload.xPos - Constant.RESOURCE_RADIUS,
						result.payload.xPos + Constant.RESOURCE_RADIUS,
						result.payload.yPos + Constant.RESOURCE_RADIUS,
						result.payload.yPos - Constant.RESOURCE_RADIUS,
						result.payload
					)
				);
			}
		});
	}

	campfirePlayerCollision(campfire: Campfire): void {
		const results: CollisionObject[] = [];
		// Get everything touching the campfires collider
		this.quadtree.searchQuadtree(
			new Rect(
				campfire.xPos - Constant.WALL_COL_RADIUS,
				campfire.xPos + Constant.WALL_COL_RADIUS,
				campfire.yPos + Constant.WALL_COL_RADIUS,
				campfire.yPos - Constant.WALL_COL_RADIUS
			),
			results
		);

		const playerCount: number[] = [];
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			playerCount[i] = 0;
		}
		results.forEach((result) => {
			if (
				result.payload instanceof Player &&
				this.doCirclesCollide(
					campfire,
					Constant.WALL_RADIUS,
					result.payload,
					Constant.PLAYER_RADIUS
				)
			) {
				// Get number of players in each team
				playerCount[result.payload.teamNumber] += 1;
			}
		});

		campfire.updateCaptureState(playerCount);
	}

	playerBulletCollision(player: Player, bullets: Set<Bullet>): void {
		if (player.health <= 0) {
			return;
		}

		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				player.xPos - Constant.PLAYER_RADIUS,
				player.xPos + Constant.PLAYER_RADIUS,
				player.yPos + Constant.PLAYER_RADIUS,
				player.yPos - Constant.PLAYER_RADIUS
			),
			results
		);

		results.forEach((result) => {
			if (
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != player.teamNumber &&
				this.doCirclesCollide(
					player,
					Constant.PLAYER_RADIUS,
					result.payload,
					Constant.BULLET_RADIUS
				)
			) {
				player.health -= 10;
				bullets.delete(result.payload);
				this.quadtree.deleteFromQuadtree(
					new CollisionObject(
						result.payload.xPos - Constant.BULLET_RADIUS,
						result.payload.xPos + Constant.BULLET_RADIUS,
						result.payload.yPos + Constant.BULLET_RADIUS,
						result.payload.yPos - Constant.BULLET_RADIUS,
						result.payload
					)
				);
			}
		});
	}

	buildingBulletCollision(building: any, bullets: Set<Bullet>): void {
		const results: CollisionObject[] = [];
		let col_radius = 0;
		if (building instanceof Wall) {
			col_radius = Constant.WALL_COL_RADIUS;
		} else if (building instanceof Base) {
			col_radius = Constant.BASE_COL_RADIUS;
		}

		this.quadtree.searchQuadtree(
			new Rect(
				building.xPos - col_radius,
				building.xPos + col_radius,
				building.yPos + col_radius,
				building.yPos - col_radius
			),
			results
		);

		results.forEach((result) => {
			if (
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != building.teamNumber &&
				this.doCirclesCollide(
					building,
					col_radius,
					result.payload,
					Constant.BULLET_RADIUS
				)
			) {
				building.hp -= 10;
				bullets.delete(result.payload);
				this.quadtree.deleteFromQuadtree(
					new CollisionObject(
						result.payload.xPos - Constant.BULLET_RADIUS,
						result.payload.xPos + Constant.BULLET_RADIUS,
						result.payload.yPos + Constant.BULLET_RADIUS,
						result.payload.yPos - Constant.BULLET_RADIUS,
						result.payload
					)
				);
			}
		});
	}

	zombieBulletPlayerCollision(): void {
		// future implementation
	}

	doesObjCollideWithWall(
		xPos: number,
		yPos: number,
		objectRadius: number
	): boolean {
		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				xPos - objectRadius,
				xPos + objectRadius,
				yPos + objectRadius,
				yPos - objectRadius
			),
			results
		);

		for (const result of results) {
			if (
				// TODO replace Point with some better invisible collider when refactoring
				((result.payload instanceof Wall ||
					result.payload instanceof Point) &&
					this.doCirclesCollide(
						{ xPos: xPos, yPos: yPos },
						Constant.PLAYER_RADIUS,
						result.payload,
						Constant.WALL_COL_RADIUS
					)) ||
				(result.payload instanceof Base &&
					this.doCirclesCollide(
						{ xPos: xPos, yPos: yPos },
						Constant.PLAYER_RADIUS,
						result.payload,
						Constant.BASE_COL_RADIUS
					))
			)
				return true;
		}
		return false;
	}

	doesObjCollideWithPlayers(
		xPos: number,
		yPos: number,
		objectRadius: number
	): boolean {
		const results: CollisionObject[] = [];
		this.quadtree.searchQuadtree(
			new Rect(
				xPos - objectRadius,
				xPos + objectRadius,
				yPos + objectRadius,
				yPos - objectRadius
			),
			results
		);
		for (const result of results) {
			if (
				result.payload instanceof Player &&
				this.doCirclesCollide(
					{ xPos: xPos, yPos: yPos },
					objectRadius,
					result.payload,
					Constant.PLAYER_RADIUS
				)
			)
				return true;
		}
		return false;
	}

	doCirclesCollide(
		object1: any,
		radius1: number,
		object2: any,
		radius2: number
	): boolean {
		const centerDist: number = Math.sqrt(
			(object1.xPos - object2.xPos) ** 2 +
				(object1.yPos - object2.yPos) ** 2
		);
		if (centerDist > radius1 + radius2) {
			return false;
		} else {
			return true;
		}
	}

	insertCollider(object: any, radius: number): void {
		this.quadtree.insertIntoQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}

	deleteCollider(object: any, radius: number): void {
		this.quadtree.deleteFromQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}

	updateCollider(object: any, radius: number): void {
		this.quadtree.updateInQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}
}
