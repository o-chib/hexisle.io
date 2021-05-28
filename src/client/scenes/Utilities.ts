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
	 * Action when pressing the sound button, toggles mute for all game sounds
	 */
	public static toggleMuteButton(button: Phaser.GameObjects.Image, sound: Phaser.Sound.BaseSoundManager): void {
		Utilities.toggleMute(sound);
		Utilities.setToggleMuteButtonIcon(button, sound);
	}

	/**
	 * Changes the icon of the mute button corresponding to the current mute status
	 */
	public static setToggleMuteButtonIcon(button: Phaser.GameObjects.Image, sound: Phaser.Sound.BaseSoundManager): void {
		if (sound.mute) {
			button.setTexture('sound_off_button');
		} else {
			button.setTexture('sound_on_button');
		}
	}

	/**
	 * Toggles muting all sounds in the game
	 * @param scene the scene to get the sound manager from
	 */
	public static toggleMute(sound: Phaser.Sound.BaseSoundManager): void {
		sound.mute = !sound.mute;
	}
}
