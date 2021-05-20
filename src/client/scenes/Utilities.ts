export default class Utilities {
	/**
	 * Logs a particular message to the console.
	 * @param message Message to log.
	 */
	public static Log(message: string): void {
		console.log(new Date().toISOString() + ' : ' + message);
	}

	/**
	 * Logs the start of a method in a scene.
	 * @param sceneName Name of the scene.
	 * @param method Method called within the scene.
	 */
	public static LogSceneMethodEntry(sceneName: string, method: string): void {
		this.Log('Entered ' + sceneName + ' ' + method + '()');
	}

	/**
	 * Toggles muting all sounds in the game
	 * @param scene the scene to get the sound manager from
	 */
	public static toggleMute(sound: Phaser.Sound.BaseSoundManager): void {
		console.log("pre toggle", sound.mute);
		sound.mute = !sound.mute;
		console.log("post toggle", sound.mute);
	}
}
