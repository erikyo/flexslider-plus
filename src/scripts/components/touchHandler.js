export default class touchHandler {
	constructor() {
		this.startX = null;
		this.startY = null;
		this.offset = null;
		this.cwidth = null;
		this.dx = null;
		this.startT = null;
		this.scrolling = false;
		this.localX = 0;
		this.localY = 0;

		this.onTouchStart = null;
		this.onTouchMove = null;
		this.onTouchEnd = null;

		console.log( 'touch Enabled 🎉' );
	}

	onTouchStart = ( e ) => {
		if ( this.slider.animating ) {
			e.preventDefault();
		} else if ( e.touches.length === 1 ) {
			this.pause();
			// CAROUSEL:
			this.cwidth =
				this.options.direction === 'vertical'
					? this.slider.h
					: this.slider.w;
			this.startT = Number( new Date() );
			// CAROUSEL:

			// Local vars for X and Y points.
			this.localX = e.touches[ 0 ].pageX;
			this.localY = e.touches[ 0 ].pageY;

			this.offset =
				this.carousel &&
				this.reverse &&
				this.slider.animatingTo === this.slider.last
					? 0
					: this.carousel && reverse
					? this.slider.limit -
					  ( this.slider.itemW + this.options.itemMargin ) *
							this.slider.move *
							this.slider.animatingTo
					: this.carousel &&
					  this.slider.currentSlide === this.slider.last
					? this.slider.limit
					: this.carousel
					? ( this.slider.itemW + this.options.itemMargin ) *
					  this.slider.move *
					  this.slider.currentSlide
					: reverse
					? ( this.slider.last -
							this.slider.currentSlide +
							this.slider.cloneOffset ) *
					  this.cwidth
					: ( this.slider.currentSlide + this.slider.cloneOffset ) *
					  this.cwidth;
			this.startX =
				this.options.direction === 'vertical'
					? this.localY
					: this.localX;
			this.startY =
				this.options.direction === 'vertical'
					? this.localX
					: this.localY;
			this.el.addEventListener( 'touchmove', this.onTouchMove, false );
			this.el.addEventListener( 'touchend', this.onTouchEnd, false );
		}
	};

	onTouchMove = ( e ) => {
		// Local vars for X and Y points.

		this.localX = e.touches[ 0 ].pageX;
		this.localY = e.touches[ 0 ].pageY;

		this.dx =
			this.options.direction === 'vertical'
				? this.startX - this.localY
				: ( this.options.rtl ? -1 : 1 ) * ( this.startX - this.localX );
		this.scrolling =
			this.options.direction === 'vertical'
				? Math.abs( this.dx ) < Math.abs( this.localX - this.startY )
				: Math.abs( this.dx ) < Math.abs( this.localY - this.startY );
		const fxms = 500;

		if ( ! this.scrolling || Number( new Date() ) - this.startT > fxms ) {
			e.preventDefault();
			if (
				! this.options.animation === 'fade' &&
				this.slider.transitions
			) {
				if ( ! this.options.animationLoop ) {
					this.dx =
						this.dx /
						( ( this.slider.currentSlide === 0 && this.dx < 0 ) ||
						( this.slider.currentSlide === this.slider.last &&
							this.dx > 0 )
							? Math.abs( this.dx ) / this.cwidth + 2
							: 1 );
				}
				this.slider.setProps( offset + this.dx, 'setTouch' );
			}
		}
	};

	onTouchEnd = ( e ) => {
		// finish the touch by undoing the touch session
		this.slider.removeEventListener( 'touchmove', this.onTouchMove, false );

		if (
			this.slider.animatingTo === this.slider.currentSlide &&
			! this.scrolling &&
			! ( this.dx === null )
		) {
			const updateDx = this.reverse ? -this.dx : this.dx,
				target =
					updateDx > 0
						? this.getTarget( 'next' )
						: this.getTarget( 'prev' );

			if (
				this.canAdvance( target ) &&
				( ( Number( new Date() ) - this.startT < 550 &&
					Math.abs( updateDx ) > 50 ) ||
					Math.abs( updateDx ) > this.cwidth / 2 )
			) {
				this.flexAnimate( target, this.options.pauseOnAction );
			} else if ( ! this.options.animation === 'fade' ) {
				this.flexAnimate(
					this.slider.currentSlide,
					this.options.pauseOnAction,
					true
				);
			}
		}
		this.slider.removeEventListener( 'touchend', this.onTouchEnd, false );

		this.startX = null;
		this.startY = null;
		this.dx = null;
		this.offset = null;
	};
}
