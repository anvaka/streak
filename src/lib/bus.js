import eventify from 'ngraph.events';

/**
 * This is a decoupled way of communication between components
 *
 * Bus lives as a singleton, any component that imports a bus, can fire events
 * on it, or listen to it.
 *
 * You can read more about eventify here: https://github.com/anvaka/ngraph.events
 */
export default eventify({});
