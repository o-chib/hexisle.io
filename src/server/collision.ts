import Player from './objects/player';
import Bullet from './objects/bullet';
import Campfire from './objects/campfire';
import { Quadtree, CollisionObject } from './quadtree';
import { Constant } from '../shared/constants';
import { MapResources } from './mapResources';
import { Resource } from './objects/resource';
import BoundaryWall from './objects/boundaryWall';
import Structure from './objects/structure';
import IndestructibleObj from './objects/indestructibleObj';

export default class CollisionDetection {
	quadtree: Quadtree;

	constructor() {
		this.quadtree = new Quadtree();
	}

	/**
	 * Checks around a campfire for players and updates the campfire's capture state accordingly
	 * @param campfire the campfire to check
	 */
	public campfirePlayerCollision(campfire: Campfire): void {
		// Get everything touching the campfires collider
		const results: CollisionObject[] = [];
		this.searchCollisions(campfire, Constant.RADIUS.WALL, results);

		const playerCount: number[] = [];
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			playerCount[i] = 0;
		}
		results.forEach((result) => {
			if (
				result.payload instanceof Player &&
				this.doCirclesCollide(
					campfire,
					Constant.RADIUS.CAMP,
					result.payload,
					Constant.RADIUS.PLAYER
				)
			) {
				// Get number of players in each team
				playerCount[result.payload.teamNumber] += 1;
			}
		});

		campfire.updateCaptureState(playerCount);
	}

	/**
	 * Checks for a bullet collision, lowers hp and removes the bullet from bullets if necessary
	 * @param bullet the bullet to check for collisions against
	 * @param bullets the list of all game bullets
	 */
	public bulletCollision(bullet: Bullet, bullets: Set<Bullet>): void {
		const results: CollisionObject[] = [];
		this.searchCollisions(bullet, Constant.RADIUS.BULLET, results);
		for (const result of results) {
			// if statement for making sure bullets hit either a player or structure, not both,
			// returns on first successful collision so bullets don't hit multiple things at once
			if (
				this.bulletPlayerCollision(result.payload, bullet, bullets) ||
				this.bulletStructureCollision(result.payload, bullet, bullets)
			) {
				return;
			}
		}
	}

	/**
	 * Checks if a player collides with a structure and if not, increments resources with collided resources
	 * @param xPos the new xPos of the player
	 * @param yPos the new yPos of the player
	 * @param mapResources the mapResources object to delete resources from
	 * @param player the player to give resources to
	 * @returns boolean that's false if a player will collide with a structure
	 */
	public updatePlayerPosition(
		xPos: number,
		yPos: number,
		mapResources: MapResources,
		player: Player
	): boolean {
		const resourcesCollided: Resource[] = [];
		const results: CollisionObject[] = [];
		this.searchCollisions(
			{ xPos: xPos, yPos: yPos },
			Constant.RADIUS.PLAYER,
			results
		);

		for (const result of results) {
			// check if the player hits a structure
			if (
				this.isStructure(result.payload) &&
				this.doCirclesCollide(
					{ xPos: xPos, yPos: yPos },
					Constant.RADIUS.PLAYER,
					result.payload,
					result.payload.RADIUS
				)
			) {
				return false;

				// also keep track if the player will collide with any resources
			} else if (
				result.payload instanceof Resource &&
				result.payload.dropAmount > 0 &&
				this.doCirclesCollide(
					{ xPos: xPos, yPos: yPos },
					Constant.RADIUS.PLAYER,
					result.payload,
					Constant.RADIUS.RESOURCE
				)
			) {
				resourcesCollided.push(result.payload);
			}
		}

		// remove and give resources to the player for each resource collided with
		resourcesCollided.forEach((resource) => {
			player.updateResource(resource.dropAmount);
			mapResources.deleteResource(resource);
			this.deleteCollider(resource);
		});

		// update the player position and collider
		player.xPos = xPos;
		player.yPos = yPos;
		this.updateCollider(player);

		return true;
	}

	/**
	 * Checks if a certain object collides with a player
	 * @param xPos the xPos of the object
	 * @param yPos the yPos of the object
	 * @param objectRadius the radius of the object
	 * @returns boolean
	 */
	public doesObjCollideWithPlayers(
		xPos: number,
		yPos: number,
		objectRadius: number
	): boolean {
		const results: CollisionObject[] = [];
		this.searchCollisions(
			{ xPos: xPos, yPos: yPos },
			objectRadius,
			results
		);
		for (const result of results) {
			if (
				result.payload instanceof Player &&
				this.doCirclesCollide(
					{ xPos: xPos, yPos: yPos },
					objectRadius,
					result.payload,
					Constant.RADIUS.PLAYER
				)
			)
				return true;
		}
		return false;
	}

	/**
	 * Finds the radian direction of the closest enemy player to the object
	 * @param object the object to look around
	 * @param objectRange the radius around the object to search
	 * @returns number
	 */
	public findDirectionOfClosestEnemy(
		object: any,
		objectRange: number
	): number {
		// Get everything in range
		const results: CollisionObject[] = [];
		this.searchCollisions(object, objectRange, results);

		// Go through the results and find the closest enemy
		let closestEnemy: Player | null = null;
		let closestEnemyDistance: number = objectRange + 1;
		for (const result of results) {
			if (
				result.payload instanceof Player &&
				result.payload.teamNumber != object.teamNumber &&
				this.doCirclesCollide(
					{ xPos: object.xPos, yPos: object.yPos },
					objectRange,
					result.payload,
					Constant.RADIUS.PLAYER
				)
			) {
				const xDiff: number = result.payload.xPos - object.xPos;
				const yDiff: number = result.payload.yPos - object.yPos;
				const distance: number = Math.sqrt(
					xDiff * xDiff + yDiff * yDiff
				);

				if (distance < closestEnemyDistance) {
					closestEnemy = result.payload;
					closestEnemyDistance = distance;
				}
			}
		}

		// Find the direction from the turret to the enemy if there is an enemy
		let closestEnemyDirection = Constant.DIRECTION.INVALID;
		if (closestEnemy != null) {
			closestEnemyDirection = Math.atan2(
				closestEnemy.yPos - object.yPos,
				closestEnemy.xPos - object.xPos
			);
		}
		return closestEnemyDirection;
	}

	/**
	 * Checks whether two objects' circle radii collide
	 * @param object1 first object
	 * @param radius1 radius of the first object
	 * @param object2 second object
	 * @param radius2 radius of the second object
	 * @returns boolean
	 */
	public doCirclesCollide(
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

	/**
	 * Inserts an object in the quadtree
	 * @param object the object to insert
	 * @param radius the radius of the object
	 */
	public insertCollider(object: IndestructibleObj): void {
		this.quadtree.insertIntoQuadtree(object, object.RADIUS);
	}

	/**
	 * Deletes an object in the quadtree
	 * @param object the object to delete
	 * @param radius the radius of the object
	 */
	public deleteCollider(object: IndestructibleObj): void {
		this.quadtree.deleteFromQuadtree(object, object.RADIUS);
	}

	/**
	 * Updates an object in the quadtree with its new position
	 * @param object the object to update
	 * @param radius the radius of the object
	 */
	public updateCollider(object: IndestructibleObj): void {
		this.quadtree.updateInQuadtree(object, object.RADIUS);
	}

	/**
	 * Checks if a bullet collides with an enemy player, lowers hp and removes the bullet from bullets if necessary
	 * @param payload the potential player that the bullet it colliding with
	 * @param bullet the bullet that is colliding
	 * @param bullets the list of all game bullets
	 * @returns boolean representing if the bullet collided/was removed
	 */
	private bulletPlayerCollision(
		payload: any,
		bullet: Bullet,
		bullets: Set<Bullet>
	): boolean {
		if (
			payload instanceof Player &&
			payload.teamNumber != bullet.teamNumber &&
			payload.hp > 0 &&
			this.doCirclesCollide(
				payload,
				Constant.RADIUS.PLAYER,
				bullet,
				Constant.RADIUS.BULLET
			)
		) {
			payload.hp -= Bullet.DAMAGE;
			bullets.delete(bullet);
			this.deleteCollider(bullet);
			return true;
		}
		return false;
	}

	/**
	 * Checks if a bullet collides with an enemy player, lowers hp and removes the bullet from bullets if necessary
	 * @param payload the potential structure that the bullet it colliding with
	 * @param bullet the bullet that is colliding
	 * @param bullets the list of all game bullets
	 * @returns boolean representing if the bullet collided/was removed
	 */
	private bulletStructureCollision(
		payload: any,
		bullet: Bullet,
		bullets: Set<Bullet>
	): boolean {
		if (
			this.isStructure(payload) &&
			!(payload instanceof BoundaryWall) &&
			bullet.teamNumber != payload.teamNumber &&
			payload.hp > 0 &&
			this.doCirclesCollide(
				payload,
				payload.RADIUS,
				bullet,
				bullet.RADIUS
			)
		) {
			payload.hp -= Bullet.DAMAGE;
			bullets.delete(bullet);
			this.deleteCollider(bullet);
			return true;
		}
		return false;
	}

	/**
	 * Takes the object and its radius and puts anything that may collide with it into results
	 * @param object the object to search around
	 * @param radius the radius of the object
	 * @param results the list to put potential collision objects into
	 */
	private searchCollisions(
		object: any,
		radius: number,
		results: CollisionObject[]
	) {
		this.quadtree.searchQuadtree(
			object.xPos - radius,
			object.xPos + radius,
			object.yPos - radius,
			object.yPos + radius,
			results
		);
	}

	/**
	 * Returns whether or not an object is a structure
	 * @param object the object to check
	 * @returns boolean
	 */
	private isStructure(object: any) {
		return Object.getPrototypeOf(object) instanceof Structure;
	}
}
