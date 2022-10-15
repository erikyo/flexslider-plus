export class pausePlay {
	setup() {
		const pausePlayScaffold = $(
			'<div class="' +
				this.namespace +
				'pauseplay"><a href="#"></a></div>'
		);

		// CONTROLSCONTAINER:
		if ( this.slider.controlsContainer ) {
			this.slider.controlsContainer.append( pausePlayScaffold );
			this.slider.pausePlay = $(
				'.' + this.namespace + 'pauseplay a',
				this.slider.controlsContainer
			);
		} else {
			this.append( pausePlayScaffold );
			this.slider.pausePlay = $(
				'.' + this.namespace + 'pauseplay a',
				this.slider
			);
		}

		this.pausePlay.update(
			this.options.slideshow
				? this.namespace + 'pause'
				: this.namespace + 'play'
		);

		this.slider.pausePlay.on( this.eventType, function ( event ) {
			event.preventDefault();

			if (
				this.watchedEvent === '' ||
				this.watchedEvent === event.type
			) {
				if ( $( this ).hasClass( this.namespace + 'pause' ) ) {
					this.slider.manualPause = true;
					this.slider.manualPlay = false;
					this.pause();
				} else {
					this.slider.manualPause = false;
					this.slider.manualPlay = true;
					this.slider.play();
				}
			}

			// setup flags to prevent event duplication
			if ( this.watchedEvent === '' ) {
				this.watchedEvent = event.type;
			}
			this.setToClearWatchedEvent();
		} );
	}

	update( state ) {
		state === 'play'
			? this.slider.pausePlay
					.removeClass( this.namespace + 'pause' )
					.addClass( this.namespace + 'play' )
					.html( this.options.playText )
			: this.slider.pausePlay
					.removeClass( this.namespace + 'play' )
					.addClass( this.namespace + 'pause' )
					.html( this.options.pauseText );
	}
}
