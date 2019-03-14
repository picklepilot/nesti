/*
 *  nesti - v0.0.1
 *  A straight forward plugin for adding some very helpful functionalities to nested/tree structure checkbox lists.
 *  http://jkaczmar.com
 *
 *  Made by Justin Kaczmar
 *  Under MIT License
 */
/**
 * The semi-colon before function invocation is a safety net against concatenated
 * scripts and/or other plugins which may not be closed properly.
 */
;( function( $, window, document, undefined ) {

	"use strict";

		/**
		 * undefined is used here as the undefined global variable in ECMAScript 3 is
		 * mutable (ie. it can be changed by someone else). undefined isn't really being
		 * passed in so we can ensure the value of it is truly undefined. In ES5, undefined
		 * can no longer be modified.
		 */

		/**
		 * window and document are passed through as local variables rather than global
		 * as this (slightly) quickens the resolution process and can be more efficiently
		 * minified (especially when both are regularly referenced in your plugin).
		 */

		/**
		 * Create the defaults at once.
		 */
		var pluginName = "nesti",
			defaults = {
				filterable: false,
				filter: {
					css: {
						position: "sticky",
						top: 0,
						width: "100%",
						padding: "6px 10px",
						border: "none",
						boxSizing: "border-box"
					}
				},
				collapse: {
					enabled: false,
					speed: 250,
					collapseTemplate: "<i class=\"fas fa-minus text-smaller position-relative nesti-toggle nesti-toggle-collapse\" style=\"font-size: .6rem;\"></i>",
					expandTemplate: "<i class=\"fas fa-plus text-smaller position-relative nesti-toggle nesti-toggle-expand\" style=\"font-size: .6rem;\"></i>"
				},
				onChange: null
			};

		/**
		 * The actual plugin constructor.
		 * @param element
		 * @param options
		 * @constructor
		 */
		function Plugin ( element, options ) {
			this.element = element;

			/**
			 * jQuery has an extend method which merges the contents of two or
			 * more objects, storing the result in the first object. The first object
			 * is generally empty as we don't want to alter the default options for
			 * future instances of the plugin
			 */
			this.settings = $.extend(true, {}, defaults, options );
			this._defaults = defaults;
			this._name = pluginName;
			this._targetId = this.element.id;

			/**
			 * Builder specific cache.
			 */
			this._html = [];

			/**
			 * Get things going!
			 */
			this.init();

			/***** PUBLIC API METHODS *****/
			this.api = {
				"api.collect": function () {
					return Array.from(this.tree.find("input.leaf:checkbox:checked").map(function () {
						return this.dataset.value;
					}));
				},
				"api.filter": function (str) {
					this.filter(str);
				},
				"api.buildList": function (data, labelsAsValues = false) {
					this.buildList(data, labelsAsValues);
				}
			};

		}

		/**
		 * Help to avoid plugin conflicts.
		 *
		 * Private Functions:
		 * 		initHandlers()
		 * 	 	_makeFilter()
		 * 	 	_lookForward()
		 * 	 	_lookBackward()
		 * 	 	_allChildrenChecked()
		 * 	 	_someChildrenChecked()
		 * 	 	_isLeaf()
		 * 	 	_isRoot()
		 */
		$.extend( Plugin.prototype, {
			init: function()
			{
				/**
				 * Build out the filter bar above the tree structure if desired.
				 */
				if (this.settings.filterable) {
					this._makeFilter();
				}

				/**
				 * Cache the root element as a jQuery object.
				 *
				 * @type {*|jQuery|HTMLElement}
				 */
				this.tree = $(this.element);

				this._dressElement();

				/**
				 * Place initialization logic here. You already have access to the DOM
				 * element and the options via the instance, e.g. this.element and
				 * this.settings you can add more functions like the one below and call
				 * them like the example below.
				 */
				this.initHandlers();
			},

			_dressElement: function ()
			{
				this.tree.css("list-style", "none");
				//this.tree.css("padding-left", 0);
				this.tree.find("ul").css("list-style", "none");
			},

			/**
			 * Handle each interaction with the structure. Essentially there is just one
			 * handler out of the box, which is the change event for checkboxes.
			 */
			initHandlers: function ()
			{
				var _self = this;
				$(_self.element).find("input:checkbox").on("change", function () {

					var currentCheckbox = $(this);
					var currentCheckboxParentLI = currentCheckbox.closest("li");

					/**
					 * Only traverse downwards if this is a root node.
					 */
					if (_self._isRoot(currentCheckboxParentLI)) {
						_self._lookForward(currentCheckboxParentLI);
					}

					/**
					 * Only traverse upwards if this is a leaf node.
					 */
					else if (_self._isLeaf(currentCheckboxParentLI)) {
						_self._lookBackward(currentCheckboxParentLI);
					}

					/**
					 * If a non root/leaf node, do both handlers.
					 */
					else {
						_self._lookForward(currentCheckboxParentLI);
						_self._lookBackward(currentCheckboxParentLI);
					}


					/**
					 * Finally, hook our custom onChange event.
					 */
					if (typeof _self.settings.onChange === "function") {
						_self.settings.onChange.call();
					}
				});

				/**
				 * By default, init the toggle handlers (the plus and minus
				 * signs to collapse and show sub trees).
				 */
				_self._initToggleHandlers();
			},

			_initToggleHandlers: function ()
			{
				var _self = this;

				$(_self.element).find(".nesti-toggle-collapse").on("click", function () {
					var currentCheckboxParentLI = $(this).closest("li");
					_self.collapse(currentCheckboxParentLI);
				});

				$(_self.element).find(".nesti-toggle-expand").on("click", function () {
					var currentCheckboxParentLI = $(this).closest("li");
					_self.expand(currentCheckboxParentLI);
				});
			},

			/**
			 * Super basic method to create a filter text input based on the filterable option.
			 * The other way to do this is if you need to build your own filterer (input) then
			 * feel free. The public API method $(element).nesti('api.filter', str) can just be
			 * used on the fly.
			 * @private
			 */
			_makeFilter: function () {
				var _self = this;
				$("<input type=\"text\" class=\"form-control form-control-sm\" placeholder=\"Find a filter..\" id=\"" + this._targetId + "-filter-input\">")
					.css(_self.settings.filter.css)
					.insertBefore(this.element);
				$("#" + this._targetId + "-filter-input").on("keyup", function () {
					_self.filter($(this).val());
				});
			},

			/**
			 * Traverse all the elements related to the current one as children, performing
			 * the logical three-state update.
			 *
			 * @param {object} $el - The current list item node.
			 * @private
			 */
			_lookForward: function ($currentCheckboxParentLI) {
				var shouldBeChecked = $currentCheckboxParentLI.find("input:checkbox").first().prop("indeterminate")
					? true
					: $currentCheckboxParentLI.find("input:checkbox").first().prop("checked");

				$currentCheckboxParentLI.find("li").each(function (i, childOfSource) {
					$(childOfSource).find("input:checkbox").prop("checked", shouldBeChecked);
				});
			},

			/**
			 * Parental traversal hander. Essentially, we loop all list items that are a
			 * parent to the current element.
			 *
			 * @param {object} $el - The current list item node.
			 * @private
			 */
			_lookBackward: function ($currentCheckboxParentLI) {

				var _self = this;

				$currentCheckboxParentLI.parents("li").each(function (i, parentOfSource) {
					/**
					 * Manage the three states.
					 */
					if (_self._allChildrenChecked($(parentOfSource))) {
						$(parentOfSource).find("input:checkbox").first().prop("checked", true);
						$(parentOfSource).find("input:checkbox").first().prop("indeterminate", false);
					}
					else if (_self._someChildrenChecked($(parentOfSource))) {
						$(parentOfSource).find("input:checkbox").first().prop("indeterminate", true);
					}
					else {
						$(parentOfSource).find("input:checkbox").first().prop("checked", false);
						$(parentOfSource).find("input:checkbox").first().prop("indeterminate", false);
					}

					/**
					 * Check for parent is reverse-terminal ul element and exit the logic. We're done.
					 */
					if ($(parentOfSource).parent().attr("id") === "list") {
						return false;
					}
				});
			},

			/**
			 * Check to see if all children of the current node are checked.
			 *
			 * @param $currentCheckboxParentLI
			 * @return {boolean}
			 * @private
			 */
			_allChildrenChecked: function ($currentCheckboxParentLI) {
				return $currentCheckboxParentLI.find("li").find("input:checkbox:checked").length === $currentCheckboxParentLI.find("li").find("input:checkbox").length;
			},

			/**
			 * Check to see if some children of the current node are checked.
			 *
			 * @param $currentCheckboxParentLI
			 * @return {boolean}
			 * @private
			 */
			_someChildrenChecked: function ($currentCheckboxParentLI) {
				var checkedLength = $currentCheckboxParentLI.find("li").find("input:checkbox:checked").length;
				return checkedLength > 0 && checkedLength !== $currentCheckboxParentLI.find("li").find("input:checkbox").length;
			},

			/**
			 * Is the current node part of a terminal list item?
			 *
			 * @param $el - The current list item element.
			 * @return {boolean}
			 * @private
			 */
			_isLeaf: function ($currentCheckboxParentLI) {
				return $currentCheckboxParentLI.find("li").length < 1;
			},

			/**
			 * Is the current node part of a root-level list item?
			 *
			 * @param $el - The current list item element.
			 * @return {boolean}
			 * @private
			 */
			_isRoot: function ($currentCheckboxParentLI) {
				return $currentCheckboxParentLI.parent("#list").length;
			},

			/**
			 * Very basic filterer. Really only will work on matches agains leaf nodes.
			 *
			 * @param {string} str - The query
			 * @returns void
			 */
			filter: function (str) {
				var entries = this.tree.find("li");
				$(entries).each(function () {
					var entry = $(this).find("label").text();
					if (str === "") {
						$(this).css("visibility", "visible");
						$(this).fadeIn();
					} else if (entry.search(new RegExp(str, "i")) < 0) {
						$(this).css("visibility", "hidden");
						$(this).fadeOut();
					} else {
						$(this).css("visibility", "visible");
						$(this).fadeIn();
					}
				});
			},

			/**
			 * Collapse the first child of the selected toggler.
			 * @param $currentCheckboxParentLI
			 */
			collapse: function ($currentCheckboxParentLI)
			{
				$currentCheckboxParentLI.find("ul").first().slideUp(this.settings.collapse.speed);
				$currentCheckboxParentLI.find(".fa-minus").first().replaceWith(this.settings.collapse.expandTemplate);
				this._initToggleHandlers();
			},

			/**
			 * Expand the first child of the selected toggler.
			 * @param $currentCheckboxParentLI
			 */
			expand: function ($currentCheckboxParentLI)
			{
				$currentCheckboxParentLI.find("ul").first().slideDown(this.settings.collapse.speed);
				$currentCheckboxParentLI.find(".fa-plus").first().replaceWith(this.settings.collapse.collapseTemplate);
				this._initToggleHandlers();
			},

			/**
			 * Take an external formatted data structure and recursively build out the list tree structure needed from that.
			 * {
			 *     label: Foo,
			 *     value: Bar,
			 *     items: {
			 *         label: Foo,
			 *         value: Bar,
			 *         items: {...}
			 *     }
			 * }
			 * @param data
			 */
			buildList: function (data, labelsAsValues = false)
			{
				/**
				 * Make the UL structure.
				 */
				this._makeTier(data, labelsAsValues);

				var newHTML = $(this._html.join(""));
				newHTML.first("ul").attr("id", this.element.id);
				document.getElementById(this.element.id).innerHTML = newHTML.html();
				this._dressElement();
				this.initHandlers();
			},

			_makeTier: function (items, labelsAsValues)
			{
				this._html.push("<ul>");
				items.forEach((child, i) => {
					this._html.push("<li>");
					this._html.push(this._listItemTemplate(child, i, labelsAsValues));
					if (child.items) {
						this._makeTier(child.items, labelsAsValues);
					}
					this._html.push("</li>");
				});
				this._html.push("</ul>");
			},

			_listItemTemplate (child, i, labelsAsValues)
			{
				var html = "<div style=\"display: flex; align-items: center;\">" + (child.items && this.settings.collapse.enabled ? this.settings.collapse.collapseTemplate : "") +
					"<input class=\"" + (!child.items ? "leaf" : "") + "\" id=\"" + this._slugify(child.label) + "-" + i + "\" data-value=\"" + (labelsAsValues ? child.label : child.value) + "\" data-id=\"" + this._slugify(child.label) + "-" + i + "\" type=\"checkbox\" style=\"margin:4px;margin-left:8px;\" />" +
					"<label class=\"text-small\" for=\"" + this._slugify(child.label) + "-" + i + "\">" + child.label + "</label>" + "</div>";
				return html;
			},

			_slugify (text)
			{
				return text.toString().toLowerCase()
					.replace(/\s+/g, "-")           // Replace spaces with -
					.replace(/[^\w\-]+/g, "")       // Remove all non-word chars
					.replace(/\-\-+/g, "-")         // Replace multiple - with single -
					.replace(/^-+/, "")             // Trim - from start of text
					.replace(/-+$/, "");            // Trim - from end of text
			}
		} );

	/**
	 * You don't need to change something below:
	 *
	 * A really lightweight plugin wrapper around the constructor, preventing against multiple
	 * instantiations and allowing any public function (ie. a function whose name doesn't start
	 * with an underscore) to be called via the jQuery plugin,
	 * e.g. $(element).defaultPluginName('functionName', arg1, arg2)
	 */
	$.fn[pluginName] = function ( options ) {
		var args = arguments;

		/**
		 * Is the first parameter an object (options), or was omitted, instantiate a new
		 * instance of the plugin.
		 */
		if (options === undefined || typeof options === "object") {
			return this.each(function () {

				/**
				 * Only allow the plugin to be instantiated once, so we check that the element
				 * has no plugin instantiation yet.
				 */
				if (!$.data(this, "plugin_" + pluginName)) {

					/**
					 * If it has no instance, create a new one, pass options to our plugin constructor,
					 * and store the plugin instance in the elements jQuery data object.
					 */
					$.data(this, "plugin_" + pluginName, new Plugin( this, options ));
				}
			});

			/**
			 * If the first parameter is a string and it doesn"t start with an underscore or "contains"
			 * the `init`-function, treat this as a call to a public method.
			 */
		} else if (typeof options === "string" && options[0] !== "_" && options !== "init") {

			/**
			 * Cache the method call to make it possible to return a value.
			 */
			var returns;

			this.each(function () {
				var instance = $.data(this, "plugin_" + pluginName);

				/**
				 * Tests that there's already a plugin-instance and checks that the requested
				 * public method exists.
				 */
				if (instance instanceof Plugin && typeof instance.api[options] === "function") {

					/**
					 * Call the method of our plugin instance, and pass it the supplied arguments.
					 */
					returns = instance.api[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
				}

				/**
				 * Allow instances to be destroyed via the 'destroy' method.
				 */
				if (options === "destroy") {
					$.data(this, "plugin_" + pluginName, null);
				}
			});

			/**
			 * If the earlier cached method gives a value back return the value, otherwise
			 * return this to preserve chainability.
			 */
			return returns !== undefined ? returns : this;
		}
	};

} )( jQuery, window, document );
