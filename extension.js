import St from 'gi://St';
import Gio from 'gi://Gio';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

class ChromeSearchProvider {
    constructor(extension) {
        this._extension = extension;
        this.providers = {
            'open-link': {
                name: 'Open Link',
                description: 'Open link in browser',
                icon: 'web-browser-symbolic',
                getQuery: function (terms) {
                    return `https://${terms.join(" ")}`;
                }
            },
            'google': {
                name: 'Search Google',
                description: 'Search online with Google',
                icon: 'web-browser-symbolic',
                getQuery: function (terms) {
                    const query = terms.join(" ");
                    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                }
            },
            'duckduckgo': {
                name: 'Search DuckDuckGo',
                description: 'Search online with DuckDuckGo',
                icon: 'web-browser-symbolic',
                getQuery: function (terms) {
                    const query = terms.slice(1).join(" ");
                    return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                }
            },
            'bing': {
                name: 'Search Bing',
                description: 'Search online with Bing',
                icon: 'web-browser-symbolic',
                getQuery: function (terms) {
                    const query = terms.slice(1).join(" ");
                    return `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                }
            },
            'youtube': {
                name: 'Search YouTube',
                description: 'Search online with YouTube',
                icon: 'web-browser-symbolic',
                getQuery: function (terms) {
                    const query = terms.slice(1).join(" ");
                    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                }
            },
        };
    }

    /**
     * The application of the provider.
     *
     * Applications will return a `Gio.AppInfo` representing themselves.
     * Extensions will usually return `null`.
     *
     * @type {Gio.AppInfo}
     */
    get appInfo() {
        return null;
    }

    /**
     * Whether the provider offers detailed results.
     *
     * Applications will return `true` if they have a way to display more
     * detailed or complete results. Extensions will usually return `false`.
     *
     * @type {boolean}
     */
    get canLaunchSearch() {
        return false;
    }

    /**
     * The unique ID of the provider.
     *
     * Applications will return their application ID. Extensions will usually
     * return their UUID.
     *
     * @type {string}
     */
    get id() {
        return this._extension.uuid;
    }

    /**
     * Launch the search result.
     *
     * This method is called when a search provider result is activated.
     *
     * @param {string} result - The result identifier
     * @param {string[]} terms - The search terms
     */
    activateResult(result, terms) {
        const query = this.providers[result].getQuery(terms);

        Gio.AppInfo.launch_default_for_uri(query, null);
    }

    /**
     * Create a result object.
     *
     * This method is called to create an actor to represent a search result.
     *
     * Implementations may return any `Clutter.Actor` to serve as the display
     * result, or `null` for the default implementation.
     *
     * @param {ResultMeta} meta - A result metadata object
     * @returns {Clutter.Actor|null} An actor for the result
     */
    createResultObject(meta) {
        console.debug(`createResultObject(${meta.id})`);

        return null;
    }

    /**
     * Get result metadata.
     *
     * This method is called to get a `ResultMeta` for each identifier.
     *
     * If @cancellable is triggered, this method should throw an error.
     *
     * @async
     * @param {string[]} results - The result identifiers
     * @param {Gio.Cancellable} cancellable - A cancellable for the operation
     * @returns {Promise<ResultMeta[]>} A list of result metadata objects
     */
    getResultMetas(results, cancellable) {
        const { scaleFactor } = St.ThemeContext.get_for_stage(global.stage);

        return new Promise((resolve, reject) => {
            const cancelledId = cancellable.connect(
                () => reject(Error('Operation Cancelled')));

            const resultMetas = [];

            for (const identifier of results) {
                const provider = this.providers[identifier];
                const meta = {
                    id: identifier,
                    name: provider.name,
                    description: provider.description,
                    // clipboardText: 'Content for the clipboard',
                    createIcon: size => {
                        return new St.Icon({
                            icon_name: provider.icon,
                            width: size * scaleFactor,
                            height: size * scaleFactor,
                        });
                    },
                };

                resultMetas.push(meta);
            }

            cancellable.disconnect(cancelledId);
            if (!cancellable.is_cancelled())
                resolve(resultMetas);
        });
    }

    /**
     * Checks if a string is a valid
    * 
    * @param {string} string 
    * @returns 
    */
    isValidUrl(string) {
        const urlPattern = new RegExp(
            '^' +
            // Protocol (optional)
            '(https?:\\/\\/)?' +
            // Domain or IP (optional)
            '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3})?)' +             // OR ip (v4) address
            // Port (optional)
            '(\\:\\d+)?' +
            // Path (optional)
            '(\\/[-a-zA-Z\\d%_.~+]*)*' +
            // Query string (optional)
            '(\\?[;&a-zA-Z\\d%_.~+=-]*)?' +
            // Fragment (optional)
            '(\\#[-a-zA-Z\\d_]*)?$',
            'i'
        );
        return !!urlPattern.test(string);
    }

    /**
     * Initiate a new search.
     *
     * This method is called to start a new search and should return a list of
     * unique identifiers for the results.
     *
     * If @cancellable is triggered, this method should throw an error.
     *
     * @async
     * @param {string[]} terms - The search terms
     * @param {Gio.Cancellable} cancellable - A cancellable for the operation
     * @returns {Promise<string[]>} A list of result identifiers
     */
    getInitialResultSet(terms, cancellable) {
        const identifiers = [];

        if (this.isValidUrl(terms[0])) {
            identifiers.push('open-link')
        }

        switch (terms[0]) {
            case 'd':
                identifiers.push('duckduckgo');
                break;
            case 'b':
                identifiers.push('bing');
                break;
            case 'y':
                identifiers.push('youtube');
                break;
            case 'g':
                identifiers.push('google');
                break;
            default:
                identifiers.push('google')
                break;
        }

        return new Promise((resolve, reject) => {
            const cancelledId = cancellable.connect(
                () => reject(Error('Search Cancelled')));

            cancellable.disconnect(cancelledId);
            if (!cancellable.is_cancelled())
                resolve(identifiers);
        });
    }

    /**
     * Refine the current search.
     *
     * This method is called to refine the current search results with
     * expanded terms and should return a subset of the original result set.
     *
     * Implementations may use this method to refine the search results more
     * efficiently than running a new search, or simply pass the terms to the
     * implementation of `getInitialResultSet()`.
     *
     * If @cancellable is triggered, this method should throw an error.
     *
     * @async
     * @param {string[]} results - The original result set
     * @param {string[]} terms - The search terms
     * @param {Gio.Cancellable} cancellable - A cancellable for the operation
     * @returns {Promise<string[]>}
     */
    getSubsearchResultSet(results, terms, cancellable) {
        if (cancellable.is_cancelled())
            throw Error('Search Cancelled');

        return this.getInitialResultSet(terms, cancellable);
    }

    /**
     * Filter the current search.
     *
     * This method is called to truncate the number of search results.
     *
     * Implementations may use their own criteria for discarding results, or
     * simply return the first n-items.
     *
     * @param {string[]} results - The original result set
     * @param {number} maxResults - The maximum amount of results
     * @returns {string[]} The filtered results
     */
    filterResults(results, maxResults) {
        console.debug(`filterResults([${results}], ${maxResults})`);

        if (results.length <= maxResults)
            return results;

        return results.slice(0, maxResults);
    }
}

export default class ChromeSearchProviderExtension extends Extension {
    enable() {
        this._provider = new ChromeSearchProvider(this);
        Main.overview.searchController.addProvider(this._provider);
    }

    disable() {
        Main.overview.searchController.removeProvider(this._provider);
        this._provider = null;
    }
}
