/**
 * @file 定制esui控件，在esui基础上继承
 * @author lizhaoxia(lizhaoxia@baidu.com)
 * @date 2013-11-12
 */

define(function(require) {
    /**
     * 在esui.Select基础上扩展的定制下拉列表
     * 
     * @constructor
     * @extends esui.Select
     */
    function CustomSelect() {
        this.constructor.superClass.constructor.apply(this, arguments);
        this.arrowWidth = this.arrowWidth || 20; //默认下拉箭头宽度为20
    }

    CustomSelect.EMPTY_TEXT = '请选择';
    CustomSelect.MAX_ITEM   = 8;

    /**
     * 绘制控件
     * 联动select不允许渲染直接跳过
     * 模糊匹配select保留datasource并为input绑定事件
     * 
     * @public
     * @param {HTMLElement} main 外部容器
     * @override
     */
    CustomSelect.prototype.render = function () {
        var me = this;

        if (me.getdata && !me.isAllowRender) {
            return;
        }

        var me = this,
            main = me.main,
            value = me.value;

        if (!me._isRendered) {
            esui.InputControl.prototype.render.call(me);

            main.innerHTML  = me._getMainHtml();
            main.onclick    = me._getMainClickHandler();

            // 若需模糊匹配，保留初始datasource，并为input控件绑定事件
            if (me.inputMatch) {
                me.totalDatasource = me.datasource;
                me.mainInput = T.dom.query('input', main)[0];
                me.bindInputEvent();

                if (me.disabled) {
                    me.mainInput.disabled = true;
                    T.dom.addClass(me.mainInput, 'disabled');
                }
            }

            me._isRendered = 1;
        }

        // 绘制浮动层
        me._renderLayer();

        me.width && (main.style.width = me.width + 'px');
        if (!me.value && esui.util.hasValue(me.selectedIndex)) {
            me.setSelectedIndex(me.selectedIndex);
        } else {
            me.setValue(value);
        }
        
        me.setReadOnly (!!me.readOnly);
        me.setDisabled(!!me.disabled);
    };

    /**
     * 获取浮动层关闭的handler
     * 模糊匹配时，调用input输入框blur处理
     * 
     * @private
     * @return {Function}
     * @override
     */
    CustomSelect.prototype._getLayerHideHandler = function () {
        var me = this;
        return function () {
            me.removeState('active');

            if (me.inputMatch) {
                me.repaintInput();

                // 当mainInput被清空后回车时，hide layer前重新设置selected item
                if (me.value) {
                    me._repaintLayer();
                }
            }
        };
    };

    // 主体部分模板
    CustomSelect.prototype._tplMainMatch = '' 
        + '<div id="{0}" class="{1}" value="" style="width:{3}px">'
        +     '<input type="text" value="{2}" />'
        + '</div>'
        + '<div class="{4}" arrow="1"></div>';

    /**
     * 获取主体部分HTML
     * 将原来下拉箭头区域宽度由20px改为30px
     * 
     * @private
     * @return {string}
     * @override
     */
    CustomSelect.prototype._getMainHtml = function () {
        var me = this;

        if (me.inputMatch) {
            return esui.util.format(
                me._tplMainMatch,
                me.__getId('text'),
                me.__getClass('text'),
                me.staticText || me.emptyText,
                me.width - me.arrowWidth,
                me.__getClass('arrow')
            );
        }
        else {
            return esui.util.format(
                me._tplMain,
                me.__getId('text'),
                me.__getClass('text'),
                me.staticText || me.emptyLabel,
                me.width - me.arrowWidth,
                me.__getClass('arrow')
            );
        }
    };

    /**
     * 为需要模糊匹配的input输入框绑定事件
     * 
     * @private
     */
    CustomSelect.prototype.bindInputEvent = function () {
        var me = this;
        var input = me.mainInput;

        // 监听focus事件
        input.onfocus = this._getInputFocusHandler();

        // 监听keyup, paste事件，进行模糊匹配
        input.onkeyup = me._getMatchHandler();
        input.onpaste = function () {
            setTimeout(function () {
                me.datasource = me.getMatchDatasource();
                me._renderLayer();
            }, 100);
        };

        // 监听上下键，回车键，选择下拉选项
        input.onkeydown = me._upAndDownHandler();
    };

    /**
     * 模糊匹配input输入框focus事件处理
     * 
     * @private
     */
    CustomSelect.prototype._getInputFocusHandler = function () {
        var me = this;

        return function () {
            T.dom.removeClass(this, 'empty');
            if (this.value === me.emptyText) {
                this.value = '';
            }
        };
    };

    /**
     * 重设input输入框
     * 
     * @private
     */
    CustomSelect.prototype.repaintInput = function () {
        var mainInput = this.mainInput;
        mainInput.blur();

        if (this.value) {
            mainInput.value = this.name;
            T.dom.removeClass(mainInput, 'empty');
        }
        else {
            mainInput.value = this.emptyText;
            T.dom.addClass(mainInput, 'empty');
        }
    };

    /**
     * 重绘选项列表层
     * 增加模糊匹配，按照index查找不靠谱，改用按value查找
     * 
     * @private
     * @override
     */
    CustomSelect.prototype._repaintLayer = function () {
        var me              = this,
            value           = me.value,
            walker          = me.getLayer().main.firstChild,
            selectedClass   = me.__getClass('item-selected');
            
        while (walker) {
            if (value != null && walker.getAttribute('value') == value) {
                baidu.addClass(walker, selectedClass);
            } else {
                baidu.removeClass(walker, selectedClass);
            }

            walker = walker.nextSibling;
        }
    };

    /**
     * 获取通过键盘keyup事件监听匹配的处理函数
     * 
     * @private
     * @return {Function}
     */
    CustomSelect.prototype._getMatchHandler = function () {
        var me = this;

        return function (e) {
            e = e || window.event;
            var keyCode = T.event.getKeyCode(e);

            if (keyCode == '38' || keyCode == '40') {
                return;
            }

            me.datasource = me.getMatchDatasource();

            // renderLayer前将value清空，禁止渲染item selected样式
            var tmp = me.value;
            me.value = null;
            me._renderLayer();
            me.value = tmp;
        };
    };

    /**
     * 获取下拉浮层滚动到当前位置，可视区域的第一条数据的index
     * 
     * @return {number}
     */
    CustomSelect.prototype.getScollTopIndex = function () {
        var layer = this.getLayer().main;
        var scrollTop = parseInt(layer.scrollTop);
        var itemHeight = parseInt(this.itemHeight);

        return scrollTop / itemHeight;
    };

    /**
     * focus input时，通过键盘上下键及回车键选择选项的处理函数
     * 
     * @private
     * @return {Function}
     */
    CustomSelect.prototype._upAndDownHandler = function () {
        var me = this;

        return function (e) {
            e = e || window.event;
            var keyCode = T.event.getKeyCode(e);
            var datasource = me.datasource;
            var len = datasource.length;

            if (len === 0 && (keyCode === 38 || keyCode === 40)) {
                return;
            }

            var layer = me.getLayer().main;
            var hoverItem = T.dom.q(me.__getClass('item-hover'), layer)[0]
                || T.dom.q(me.__getClass('item-selected'), layer)[0];
            var hoverIndex = hoverItem
                ? parseInt(hoverItem.getAttribute('index')) : -1;
            var targetItem;
            var targetIndex;

            // 上下键
            if (keyCode === 38 || keyCode === 40) {
                var maxItem = me.maxItem;
                var itemHeight = me.itemHeight;
                var scrollTopIndex = me.getScollTopIndex();

                if (keyCode === 38) { // 向上键
                    targetIndex = hoverIndex - 1 < 0
                        ? len - 1 : hoverIndex - 1;

                    if (targetIndex === len - 1) { //到底部
                        layer.scrollTop = itemHeight * len;
                    }
                    else if (
                        targetIndex - scrollTopIndex === 0
                        && scrollTopIndex > 0
                    ) {
                        layer.scrollTop -= itemHeight;
                    }
                }
                else { // 向下键
                    targetIndex = hoverIndex + 1 > len - 1
                    ? 0 : hoverIndex + 1;

                    if (targetIndex === 0) { //回到顶部
                        layer.scrollTop = 0;
                    }
                    else if (
                        targetIndex - scrollTopIndex == maxItem - 1
                        && len > targetIndex + 1
                    ) {
                        layer.scrollTop += itemHeight;
                    }
                }

                targetItem = T.dom.children(layer)[targetIndex];
                me._itemOverHandler(targetItem);

                if (hoverItem) {
                    me._itemOutHandler(hoverItem);
                }

                me.mainInput.value = T.dom.getText(targetItem);
            }
            // 回车键
            else if (keyCode === 13) {
                // 选中某一项
                if (hoverIndex > -1) {
                    me._itemClickHandler(hoverItem);
                }
                else {
                    me.hideLayer();
                }
            }
        };
    };

    /**
     * 将浮层滚动到目标item居中的位置
     * 
     * @param {number} index 目标item的索引
     */
    CustomSelect.prototype.scrollTo = function (index) {
        if (index < 0) {
            return;
        }

        var maxItem = this.maxItem;
        var len = this.datasource.length;

        if (len <= maxItem) {
            return;
        }

        var layer = this.getLayer().main;
        var itemHeight = this.itemHeight;
        var targetIndex = parseInt(maxItem / 2) - 1; // 目标位置

        layer.scrollTop = (index - targetIndex) * itemHeight;
    };

    /**
     * 通过value获取选项索引index
     * 
     * @param {string} value 
     * @return {number} 索引值
     */
    CustomSelect.prototype.getIndexByValue = function (value) {
        var datasource = this.datasource;

        for (var i = datasource.length - 1; i >= 0; i--) {
            var item = datasource[i];

            if (item.value === value) {
                return i;
            }
        }

        return -1;
    };

    /**
     * 重绘浮层
     * 重写浮层高度，设置为单项的整数倍
     * 
     * @private
     * @override
     */
    CustomSelect.prototype._renderLayer = function () {
        this.constructor.superClass._renderLayer.call(this);

        var layerMain = this.getLayer().main;
        var maxItem = this.maxItem;
        var len = this.datasource.length;
        var itemHeight;

        if (layerMain.firstChild) {
            itemHeight = layerMain.firstChild.offsetHeight;
            this.itemHeight = itemHeight;
        }

        if (len > maxItem) {
            layerMain.style.height = maxItem * itemHeight + 'px';
        }
    };

    /**
     * 显示下拉浮层
     * 修正datasource，若有已选择项，将其滚动到浮层中间
     * 
     * @override
     */
    CustomSelect.prototype.showLayer = function () {
        if (this.inputMatch 
            && this.datasource.length < this.totalDatasource.length
        ) {
            this.datasource = this.totalDatasource;
            this._renderLayer();
        }

        this.constructor.superClass.showLayer.call(this);

        var index = this.selectedIndex;
        if (index > -1) {
            this.scrollTo(index);
        }
    };

    /**
     * 获取与当前input输入内容匹配的datasource
     * 
     * @return {Array} 
     */
    CustomSelect.prototype.getMatchDatasource = function () {
        var inputValue = this.mainInput.value;
        var datasource = this.totalDatasource;
        var tempDatasource = [];

        if (inputValue === '') {
            tempDatasource = datasource;
        }
        else {
            T.each(datasource, function (item, index) {
                if (item.name.indexOf(inputValue) > -1) {
                    tempDatasource.push(item);
                }
            });
        }

        return tempDatasource;
    };

    /**
     * 获取浮层html
     * 
     * @private
     * @return {string}
     * @override
     */
    CustomSelect.prototype._getLayerHtml = function () {
        var me = this;

        // 若有模糊匹配功能，且当前匹配数据源为空，显示‘无匹配数据’
        if (me.inputMatch && me.datasource.length === 0) {
            return '<div class="ui-select-item" style="color: red;">'
                +      '无匹配数据'
                +  '</div>';
        }
        else {
            return me.constructor.superClass._getLayerHtml.call(me);
        }
    };

    /**
     * 获取主区域点击处理函数
     * 
     * @private
     * @return {Function} 
     * @override
     */
    CustomSelect.prototype._getMainClickHandler = function () {
        var me = this;

        return function (e) {
            e = e || window.event;
            var tar = e.srcElement || e.target;

            if (!me.readOnly && !me.isDisabled()) {
                // 可模糊匹配的select，点击input时始终显示下拉列表
                if (me.inputMatch && tar.tagName.toLowerCase() === 'input') {
                    me.getLayer()._preventHide();
                    me.showLayer();
                    return;
                }
                if (tar.getAttribute('arrow') || me.onmainclick() !== false) {
                    me.getLayer()._preventHide();
                    me.toggleLayer();
                }
            }
        };
    };

    /**
     * 根据值选择选项
     *
     * @public
     * @param {string} value 值
     */
    CustomSelect.prototype.setValue = function (value) {
        var me = this,
            layer = me.getLayer().main,
            items = layer.getElementsByTagName('div'),
            len,
            i,
            item;

        if (esui.util.hasValue(value)) {
            // 若数据源来自ajax且未渲染下拉列表，则保留value的值
            if (me.getdata && items.length === 0) {
                return;
            }

            for (i = 0, len = items.length; i < len; i++) {
                item = items[ i ].getAttribute('value');
                if (item == value) {
                    me.setSelectedIndex(i);
                    return;
                }
            }
        }

        me.value = null;
        me.setSelectedIndex(-1);
    };

    /**
     * 隐藏层
     * 调用layer的onhide事件
     * 
     * @public
     * @override
     */
    CustomSelect.prototype.hideLayer = function () {
        var layer = this.getLayer();
        layer.hide();
        if (layer.onhide) {
            layer.onhide();
        }
    };

    /**
     * 根据索引选择选项
     * 选择值未改变时，不发送事件
     * 
     * @public
     * @param {number} index 选项的索引序号
     * @param {boolean} isDispatch 是否发送事件
     * @override
     */
    CustomSelect.prototype.setSelectedIndex = function (index, isDispatch) {
        var selected = this.datasource[ index ],
            value;

        if (!selected) {
            value = null;
        } else {
            value = selected.value;
        }

        var preValue = this.value;
        this.selectedIndex = index;
        this.value = value;
        this.name = selected ? selected.name : null;

        if (
            preValue !== value // 选择值未改变时，不发送change事件
            && isDispatch === true 
            && this.changeHandler(value, selected) === false
        ) {
            return;
        }

        if (this.inputMatch) {
            this.repaintInput();

            var datasource = this.datasource;
            var totalDatasource = this.totalDatasource;
            // 若当前datasource不完整，则重置datasource及selectIndex的值
            if (datasource.length < totalDatasource.length) {
                this.datasource = totalDatasource;
                this.selectedIndex = this.getIndexByValue(value);
                this._renderLayer();
            }
            else {
                this._repaintLayer();
            }
        }
        else {
            this._repaint();
        }
    };

    /**
     * 下拉列表change事件处理
     * 
     * @private
     * @param {string|number} value 选中选项的值
     * @param {Object} selected 选中的选项对象{name:**, value:**}
     * @return {boolean}
     */
    CustomSelect.prototype.changeHandler = function (value, selected) {
        // 若有下级联动，则继续向后渲染
        if (this.next) {
            var nextSelect = esui.get(this.next);
            nextSelect.reset();
            nextSelect.disabled = false;
            nextSelect.renderAjaxData(true);
        }

        // 执行配置的change事件
        return this.onchange(value, selected);
    };

    /**
     * 重置select的值
     * 
     * @private
     */
    CustomSelect.prototype.reset = function () {
        this.value = null;
        this.selectedIndex = -1;
    };

    /**
     * 渲染数据源通过ajax请求获得的select
     * 
     * @param {boolean} isReset 是否reset
     */
    CustomSelect.prototype.renderAjaxData = function (isReset) {
        var me = this;
        if (!me.getdata) {
            return;
        }

        // 若存在前置select且未选值，不通过ajax请求数据，
        // 且当前select不可用，后置select不可用
        var previous = me.previous;
        var previousVal;
        if (previous) {
            previousVal = esui.get(previous).value;
            if (previousVal === null) {
                me.isAllowRender = true;
                me.datasource = [];
                me.disabled = true;
                me.render();
                // me.setInputValue();

                if (me.next) {
                    var nextSelect = esui.get(me.next);
                    if (isReset) {
                        nextSelect.reset();
                    }
                    nextSelect.renderAjaxData();
                }
                return;
            }
        }

        // 若无前置select，或前置select已选值，则获取当前select数据源
        var getData = me.getdata;
        var url = getData.url;
        var method = getData.method;
        var data = previous
            ? T.string.format(getData.data, previousVal)
            : getData.data;

        T.ajax.request(url, {
            method: method,
            data: data,
            onsuccess: function (xhr, responseText) {
                var result = T.json.decode(responseText);
                if (0 === result.status) {
                    me.isAllowRender = true;
                    me.datasource = result.data;
                    if (isReset) {
                        me.reset();
                    }
                    me.render();
                    // me.setInputValue();

                    //若存在后置select，则继续向后渲染
                    if(me.next) {
                        var nextSelect = esui.get(me.next);
                        if (isReset) {
                            nextSelect.reset();
                        }
                        nextSelect.renderAjaxData(isReset);
                    }
                }
                else {
                    alert(result.msg);
                }
            },
            onfailure: function () {
                alert('获取数据失败，请刷新重试！');
            }
        });
    };

    // 设置select相关的隐藏表单元素的值
    // CustomSelect.prototype.setInputValue = function () {
    //     var value = this.value? this.value: '';
    //     var selectId = this.id;
    //     // T.g('form-' + selectId.replace('Select', '')).value = value;
    // };

    /**
     * 下拉列表change事件处理
     * 
     * @public
     */
    // CustomSelect.prototype.onchange = function () {
    //     // this.setInputValue();

    //     // 若有下级联动，则继续向后渲染
    //     if (this.next) {
    //         var nextSelect = esui.get(this.next);
    //         nextSelect.reset();
    //         nextSelect.disabled = false;
    //         nextSelect.renderAjaxData(true);
    //     }
    // };

    esui.CustomSelect = CustomSelect;
    T.inherits(esui.CustomSelect, esui.Select);
});