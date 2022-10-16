import { eventType } from '../index';

export default class asNav {
	constructor( namespace, slider ) {
		this.namespace = namespace;
		this.slider = slider;
	}
	setup() {
		this.slider.asNav = true;
		this.slider.animatingTo = Math.floor(
			this.slider.currentSlide / this.slider.move
		);
		this.slider.currentItem = this.slider.currentSlide;
		this.slider.slides.classList.remove( this.namespace + 'active-slide' );
		this.slider.slides[ this.slider.currentItem ].classList.add(
			this.namespace + 'active-slide'
		);

		eventType.split( ' ' ).forEach( function ( ev ) {
			this.slider.slides.addEventListener(
				ev,
				( e ) => {
					e.preventDefault();
					const $slide = $( this ),
						target = $slide.index();
					let posFromX;
					if ( this.options.rtl ) {
						posFromX =
							-1 *
							( $slide.offset().right -
								$( this.slider ).scrollLeft() ); // Find position of slide relative to right of slider container
					} else {
						posFromX =
							$slide.offset().left -
							$( this.slider ).scrollLeft(); // Find position of slide relative to left ofthis.slider container
					}
					if (
						posFromX <= 0 &&
						$slide.hasClass( this.namespace + 'active-slide' )
					) {
						this.flexAnimate( this.getTarget( 'prev' ), true );
					} else if (
						! $( this.options.asNavFor ).data( 'flexslider' )
							.animating &&
						! $slide.hasClass( this.namespace + 'active-slide' )
					) {
						this.slider.direction =
							this.slider.currentItem < target ? 'next' : 'prev';
						this.flexAnimate(
							target,
							this.options.pauseOnAction,
							false,
							true,
							true
						);
					}
				},
				false
			);
		} );
	}
}
