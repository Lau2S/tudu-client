/**
 * @fileoverview Entry point for the Tudu client application.
 * Initializes global styles and starts the client-side router.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import './styles/base.css';
import { initRouter } from './routes/route.js';

/**
 * Initialize the application.
 * Sets up the client-side router to handle hash-based navigation
 * and renders the appropriate view based on the current URL.
 */
initRouter();