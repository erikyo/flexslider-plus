export class directionNav {
	setup() {
		const directionNavScaffold = $(
			'<ul class="' +
				this.namespace +
				'direction-nav"><li class="' +
				this.namespace +
				'nav-prev"><a class="' +
				this.namespace +
				'prev" href="#">' +
				this.options.prevText +
				'</a></li><li class="' +
				this.namespace +
				'nav-next"><a class="' +
				this.namespace +
				'next" href="#">' +
				this.options.nextText +
				'</a></li></ul>'
		);

		// CUSTOM DIRECTION NAV:
		if ( this.slider.customDirectionNav ) {
			this.slider.directionNav = this.slider.customDirectionNav;
			// CONTROLSCONTAINER:
		} else if ( this.slider.controlsContainer ) {
			$( this.slider.controlsContainer ).append( directionNavScaffold );
			this.slider.directionNav = $(
				'.' + this.namespace + 'direction-nav li a',
				this.slider.controlsContainer
			);
		} else {
			this.append( directionNavScaffold );
			this.slider.directionNav = $(
				'.' + this.namespace + 'direction-nav li a',
				this.slider
			);
		}

		this.directionNav.bind( this ).update();

		this.slider.directionNav.addEventListener(
			this.eventType,
			function ( event ) {
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
			}
		);
	}

	update() {
		console.log( 'updating...' );
		const disabledClass = this.namespace + 'disabled';
		if ( this.slider.pagingCount === 1 ) {
			this.slider.directionNav
				.addClass( disabledClass )
				.attr( 'tabindex', '-1' );
		} else if ( ! this.options.animationLoop ) {
			if ( this.slider.animatingTo === 0 ) {
				this.slider.directionNav
					.removeClass( disabledClass )
					.filter( '.' + this.namespace + 'prev' )
					.addClass( disabledClass )
					.attr( 'tabindex', '-1' );
			} else if ( this.slider.animatingTo === this.slider.last ) {
				this.slider.directionNav
					.removeClass( disabledClass )
					.filter( '.' + this.namespace + 'next' )
					.addClass( disabledClass )
					.attr( 'tabindex', '-1' );
			} else {
				this.slider.directionNav
					.removeClass( disabledClass )
					.prop( 'tabindex', '-1' );
			}
		} else {
			this.slider.directionNav
				.removeClass( disabledClass )
				.prop( 'tabindex', '-1' );
		}
	}
}
