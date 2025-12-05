module.exports = {
	globDirectory: 'dist',
	globPatterns: [
		'**/*.{js,css,html,png,jpg,jpeg,svg,ico,json}'
	],
	swDest: 'dist/sw.js',
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: [
		{
			// API calls - network first with fallback
			urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
			handler: 'NetworkFirst',
			options: {
				networkTimeoutSeconds: 10,
				cacheName: 'api-cache',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 5 * 60 // 5 minutes
				}
			}
		},
		{
			// Static assets - cache first
			urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'image-cache',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
				}
			}
		},
		{
			// Fonts and other static resources
			urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'static-resources',
				expiration: {
					maxEntries: 60,
					maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
				}
			}
		},
		{
			// Navigation requests
			urlPattern: /^https?:\/\/[^\/]+\/(?!.*\.[a-z]+$)/,
			handler: 'NetworkFirst',
			options: {
				networkTimeoutSeconds: 10,
				cacheName: 'navigation-cache',
				expiration: {
					maxEntries: 20,
					maxAgeSeconds: 24 * 60 * 60 // 24 hours
				}
			}
		}
	]
};
