import { eventType } from '../index';

/**
 * It creates the HTML for the direction nav and appends it to the slider
 */
export default class DirectionNav extends HTMLElement {
	/**
	 * Creates the direction nav
	 *
	 * @param {string} namespace - The namespace of the slider.
	 * @param {slider} slider    - The slider object.
	 */
	constructor() {
		super();
	}

	/**
	 *  Creating the HTML for the direction nav and appending it to the slider.
	 */
	setup = () => {
		const directionNavScaffold = `<ul class="${ this.namespace }direction-nav"><li class="${ this.namespace }nav-prev"><a class="${ this.namespace }prev" href="#">${ this.options.prevText }</a></li><li class="${ this.namespace }nav-next"><a class="${ this.namespace }next" href="#">${ this.options.nextText }</a></li></ul>`;

		// CUSTOM DIRECTION NAV:
		if ( this.slider.customDirectionNav ) {
			this.directionNav = this.slider.customDirectionNav;
			// CONTROLSCONTAINER:
		} else if ( this.slider.controlsContainer ) {
			this.slider.controlsContainer.append( directionNavScaffold );
			this.directionNav = this.slider.controlsContainer.querySelector(
				'.' + this.namespace + 'direction-nav li a'
			);
		} else {
			this.append( directionNavScaffold );
			this.directionNav = this.slider.querySelector(
				'.' + this.namespace + 'direction-nav li a'
			);
		}

		this.directionNav.update();

		eventType.split( ' ' ).forEach( ( ev ) => {
			this.directionNav.addEventListener( ev, function ( event ) {
				event.preventDefault();
				let target;

				if (
					this.watchedEvent === '' ||
					this.watchedEvent === event.type
				) {
					target = this.classList.contains( this.namespace + 'next' )
						? this.getTarget( 'next' )
						: this.getTarget( 'prev' );
					this.flexAnimate( target, this.options.pauseOnAction );
				}

				// setup flags to prevent event duplication
				if ( this.watchedEvent === '' ) {
					this.watchedEvent = event.type;
				}

				this.setToClearWatchedEvent();
			} );
		} );
	};

	/**
	 * Updating the direction nav.
	 */
	update = () => {
		const disabledClass = this.namespace + 'disabled';
		if ( this.slider.pagingCount === 1 ) {
			this.directionNav.classList.add( disabledClass );
		} else if ( ! this.options.animationLoop ) {
			if ( this.slider.animatingTo === 0 ) {
				this.directionNav.classList.remove( disabledClass );
				this.directionNav
					.querySelector( '.' + this.namespace + 'prev' )
					.classList.add( disabledClass );
			} else if ( this.slider.animatingTo === this.slider.last ) {
				this.directionNav.classList.remove( disabledClass );
				this.directionNav
					.querySelector( '.' + this.namespace + 'next' )
					.classList.add( disabledClass );
			} else {
				this.directionNav.classList.remove( disabledClass );
			}
		} else {
			this.directionNav.classList.remove( disabledClass );
		}
	};
}
