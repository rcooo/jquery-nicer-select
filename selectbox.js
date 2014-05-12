;(function ( $, window, document, undefined ) {
    // Create the defaults once
    var pluginName = 'selectbox',
        defaults = {
            onChange: function(value, text, index) {

            },
            renderSelectbox: function() {
                return $('<div class="selectbox"><input type="text" class="selectbox-input" readonly="readonly" /></div>')
            },
            renderList: function(items) {
                return $('<div class="selectbox-list"></div>');
            },
            renderItem: function(item) {
                var $item = $('<div class="selectbox-item"></div>');
                $item.text(item.text);
                return $item;
            }
        };

    /**
     * Selectbox constructor
     * @param element Selectbox element to make it fancier
     * @param options
     * @constructor
     */
    function Selectbox(element, options) {
        this.$element = $(element);
        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Selectbox.prototype = {
        /**
         * Selectbox initialization
         */
        init: function() {
            // Replaced selectbox with input and dropdown arrow
            this.$selectbox = this.options.renderSelectbox();
            // New selectbox input
            this.$input = this.$selectbox.find('.selectbox-input');

            // Hide native selectbox
            this.$element.hide();
            // and replace it with new one
            this.$element.after(this.$selectbox);

            // Selectbox list with items
            this.$list = null;
            // Get items from native selectbox
            this.items = this.getItems();
            // Find selected item and make it selected and focused
            this.focusedItemIndex = this.selectedItemIndex = this.getIndexByValue(this.$element.val());
            this.renderList(this.items);
            this.selectItem(this.selectedItemIndex);

            // Only change event on original selectbox needed
            this.$element
                .bind('change', this.onChange.bind(this))

            // Bind event handlers to new selectbox to make it
            // behave like the native one
            this.$input
                .bind('click', this.onClick.bind(this))
                .bind('focus', this.onFocus.bind(this))
                .bind('blur', this.onBlur.bind(this))
                .bind('keypress', this.onKeypress.bind(this))
                .bind('keydown', this.onKeydown.bind(this))
                .bind('keyup', this.onKeyup.bind(this));

            this.changingElementValue = false;
        },

        /**
         * On change event handler for native selectbox to catch all changes
         * and propagate them to the new one
         * @param e Event object
         */
        onChange: function(e) {
            if(!this.changingElementValue) {
                this.selectItem($(e.target).find('option:selected').index());
            }
        },

        /**
         * On click event for new selectbox. It just toggle the item list.
         * @param e Event object
         */
        onClick: function(e) {
            e.stopPropagation();
            if(this.isListShown()) {
                this.hideList();
            }
            else {
                this.showList();
            }
        },

        /**
         * Nothing here yet
         * @param e Event object
         */
        onFocus: function(e) {
            var _this = this,
                val = this.$input.val();
            if(val != ''){
                setTimeout(function() {
                    _this.$input.val(val);
                }, 1);
            }
        },

        /**
         * Nothing here yet
         * @param e Event object
         */
        onBlur: function(e) {

        },

        /**
         * Nothing here yet
         * @param e Event object
         */
        onKeypress: function(e) {

        },

        /**
         * On keydown event handler for new selectbox. It catches the arrow keys for
         * item select. It selects focused item on tab key pressed.
         * @param e Event object
         */
        onKeydown: function(e) {
            switch(e.which) {
                case 9: // tab
                    if(this.isListShown()) {
                        this.selectItem(this.focusedItemIndex);
                    }
                    break;
                case 38: // up arrow
                    if(this.isListShown()) {
                        this.focusItem(this.getPreviousIndex(this.focusedItemIndex));
                    }
                    else {
                        this.selectItem(this.getPreviousIndex(this.focusedItemIndex));
                    }
                    break;
                case 40: // down arrow
                    if(this.isListShown()) {
                        this.focusItem(this.getNextIndex(this.focusedItemIndex));
                    }
                    else {
                        this.selectItem(this.getNextIndex(this.focusedItemIndex));
                    }
                    break;
            }
        },

        /**
         * On keyup event handler for new selectbox.
         * @param e Event Object
         */
        onKeyup: function(e) {
            switch(e.which) {
                case 13: // enter
                    if(this.isListShown()) {
                        this.selectItem(this.focusedItemIndex);
                    }
                    else {
                        this.showList();
                    }
                    break;
                case 27: // esc
                    if(this.isListShown()) {
                        this.selectItem(this.focusedItemIndex);
                    }
                    break;
            }
        },

        /**
         * Show selectbox list, highlight active and selected item and register
         * function to hide list if clicked outside.
         */
        showList: function() {
            var _this = this;

            this.$list.addClass('active');
            this.scrollToItem(this.selectedItemIndex);

            $('html').one('click', _this.hideList.bind(this));
        },

        /**
         * Hide selectbox list.
         */
        hideList: function() {
            this.$list.removeClass('active');
        },

        /**
         * Determine if list is already shown
         * @returns bool Return true if list is shown, false otherwise
         */
        isListShown: function() {
            return this.$list.is(':visible');
        },

        /**
         * Renders whole selectbox list. Appearence of selectbox and its items
         * is controlled by renderItem and renderList options so it can be overriden
         * by user options
         * @param items Items to render to the list
         */
        renderList: function(items) {
            var _this = this,
                inputOffset = this.$input.offset();

            // If list already exist, hide it and remove
            if(this.$list) {
                this.$list.remove();
            }

            // Create new list
            this.$list = this.options
                .renderList(items)
                .append($.map(items, function(item) {
                    var $item = _this.options.renderItem(item);

                    if(item.index == _this.selectedItemIndex) {
                        $item.addClass('selected');
                    }
                    if(item.index == _this.focusedItemIndex) {
                        $item.addClass('focused');
                    }

                    item.$element = $item;
                    return $item;
                }));

            // Bind click event handler to selectbox for its items
            this.$list
                .on('click', '.selectbox-item', this.onItemClick.bind(this));

            this.$list.width(this.$input.outerWidth()).css({
                top: inputOffset.top + this.$input.outerHeight(),
                left: inputOffset.left
            });

            // Append it to the document
            // TODO: do not append to document, but to the specified parent element
            // example this.$element.closest(options.container).append(this.$list);
            $('body').append(this.$list);
        },

        /**
         * Event handler for item clicked. Just select item and hide the list.
         * @param e Event object
         */
        onItemClick: function(e) {
            this.selectItem($(e.target).index());
        },

        /**
         * Get index of item by its value in <option value="value"></option>
         * @param value Value of item to find
         * @returns int Index of item. If not found return -1
         */
        getIndexByValue: function(value) {
            for(var item, i = 0; i < this.items.length; i++) {
                item = this.items[i];
                if(item.value == value) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * Get items from native selectbox
         * @returns array Array of item objects
         */
        getItems: function() {
            return $.map(this.$element.find('option'), function(option, i) {
                return {
                    index: i,
                    value: $(option).attr('value'),
                    text: $(option).text(),
                    $element: null
                };
            });
        },

        /**
         * Select selectbox item by index
         * @param index Item index to select
         */
        selectItem: function(index) {
            this.selectedItemIndex = index;
            if(index >= 0) {
                this.focusItem(index);
                /*this.$element
                 .val(this.items[index].value);*/
                this.addClassToItem(index, 'selected');
                this.hideList();
                this.changingElementValue = true;
                this.$element.val(this.items[index].value).trigger('change');
                this.$input.val(this.items[index].text);
                this.changingElementValue = false;
            }
            else {
                this.removeClass('selected');
            }
        },

        /**
         * Focus selectbox item by index
         * @param index Item index to focus
         */
        focusItem: function(index) {
            if(index >= 0) {
                this.focusedItemIndex = index;
                this.addClassToItem(index, 'focused');
                this.scrollToItem(index);
            }
            else {
                this.addClassToItem(0, 'focused');
            }
        },

        /**
         * Utility to scroll to item if it's not in the list boundaries
         * @param index Item index to scroll to
         */
        scrollToItem: function(index) {
            var $item = this.items[index].$element,
                listScroll = this.$list.scrollTop(),
                listOffset = this.$list.offset().top,
                listHeight = this.$list.height(),
                itemOffset = $item.offset().top - listOffset + listScroll,
                itemHeight = $item.height();

            // It is above the
            if(itemOffset < listScroll) {
                this.$list.scrollTop(itemOffset);
            }
            else if(itemOffset + itemHeight > listScroll + listHeight) {
                this.$list.scrollTop(itemOffset + itemHeight - listHeight);
            }
        },

        /**
         * Get previous item index without going out of list boundaries
         * @param index
         * @returns int Previous item index
         */
        getPreviousIndex: function(index) {
            return Math.max(index - 1, 0);
        },

        /**
         * Get next item index without going out of list boundaries
         * @param index
         * @returns int Next item index
         */
        getNextIndex: function(index) {
            return Math.min(this.items.length - 1, index + 1);
        },

        /**
         * Remove class from all items in the list
         * @param cls Class name to remove
         */
        removeClass: function(cls) {
            this.$list
                .find('.selectbox-item')
                .removeClass(cls)
        },

        /**
         * Add class to item in the list. Class is active only on one item
         * at the time
         * @param index
         * @param cls
         */
        addClassToItem: function(index, cls) {
            this.removeClass(cls);
            this.$list
                .find('.selectbox-item')
                .eq(index)
                .addClass(cls);
        }
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Selectbox( this, options ));
            }
        });
    };

})( jQuery, window, document );