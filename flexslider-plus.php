<?php
/**
 * Plugin Name: flexslider plus
 * Plugin URI: https://github.com/erikyo/flexslider-plus
 * Description: flexslider plus
 * Version: 0.0.1
 * Author: erik
 */

function flexslider_plus_script() {
	wp_dequeue_script( 'flexslider' );

	$asset = include __DIR__ . '/build/flexslider-plus.asset.php';
	wp_enqueue_script( 'flexslider_plus', plugin_dir_url( __FILE__ ) . 'build/flexslider-plus.js', $asset['dependencies'], false, true );

}

add_action( 'wp_enqueue_scripts', 'flexslider_plus_script', 50 );

/**
 * Register and enqueue the flexslider_plus stylesheet
 */
function flexslider_plus_style() {

	wp_register_style( 'flexslider_plus_css', plugin_dir_url( __FILE__ ) . 'build/flexslider-plus.css' );
	wp_enqueue_style( 'flexslider_plus_css' );
}

add_action( 'wp_enqueue_scripts', 'flexslider_plus_style' );
