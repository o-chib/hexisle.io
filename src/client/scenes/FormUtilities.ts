export default class FormUtilities {
	/**
	 * Sets display of images attached to button on mouseover.
	 * @param button <button> HTMLElement in form. Must have two children,
	 * first is <img class='button-unpressed'>,
	 * second is <img class='button-pressed'>
	 */
	public static setButtonTextureOnMouseIn(button: HTMLElement) {
		// Hover the button
		const unpressed = button.getElementsByClassName('button-unpressed')[0];
		unpressed.setAttribute('style', 'display:none');

		const pressed = button.getElementsByClassName('button-pressed')[0];
		pressed.setAttribute('style', 'display:block');
	}

	/**
	 * Sets display of images attached to button on mouseout.
	 * @param button <button> HTMLElement in form. Must have two children,
	 * first is <img class='button-unpressed'>,
	 * second is <img class='button-pressed'>
	 */
	public static setButtonTextureOnMouseOut(button: HTMLElement) {
		// Un-hover the button
		const unpressed = button.getElementsByClassName('button-unpressed')[0];
		unpressed.setAttribute('style', 'display:block');

		const pressed = button.getElementsByClassName('button-pressed')[0];
		pressed.setAttribute('style', 'display:none');
	}
}
