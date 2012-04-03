/**
 * DOM树，需要jQuery的支持。
 * @author David Day
 */
function BeginningTree(init) {
	if (!this.isNull(init)) {
		this.data = init.data;
		this.url = init.url;
		this.tag = init.tag;
	}
}

/**
 * data生成DOM树所需数据，data为根节点。
 * data.label 为节点文字；
 * data.icon 为节点图标路径；
 * data.click 为节点点击事件；
 * data.subs 为子节点数组，子节点格式与根节点相同。
 */
BeginningTree.prototype.data = null;

/**
 * ajax读取数据时请求的url
 */
BeginningTree.prototype.url = null;

/**
 * DOM树写入的目标jQuery对象
 */
BeginningTree.prototype.tag = null;

/**
 * 判断对象是否为null
 * @param obj 对象
 * @return 是否为null
 */
BeginningTree.prototype.isNull = function(obj) {
	return undefined == obj || null == obj;
};

/**
 * 判断数组是否为空
 * @param array 数组
 * @return 是否为空
 */
BeginningTree.prototype.isEmpty = function(array) {
	return undefined == array || null == array || array.length == 0;
};

/**
 * 判断字符串是否为空白
 * @param str 字符串
 * @return 是否为空白
 */
BeginningTree.prototype.isBlank = function(str) {
	return undefined == str || null == str || $.trim(str) == "";
};

/**
 * 请求this.url所指链接获取json对象填入this.data中
 * @param func 当请求this.url所指链接成功时所调用的方法。（非必填）
 */
BeginningTree.prototype.load = function(func) {
	var tree = this;
	$.get(this.url, {}, function(data) {
		tree.data = data;
		if (!isNull(func)) {
			func();
		}
	}, "json");
};

/**
 * 把DOM树写入倒HTML中。
 */
BeginningTree.prototype.write = function() {
	if (this.tag.length < 1) {
		throw "jQuery DOM " + this.tag.selector + " not found.";
	}

	this.tag.html("");
	var root = $("<ul class=\"beginning-tree-list\" />");
	root.appendTo(this.tag);
	var objs = $.isArray(this.data) ? this.data : [this.data]
	this.writeNodes(objs, root, 0, []);
};

/**
 * 写多个节点
 * @param objs 数据集合
 * @param parent 父节点
 * @param floor 当前层数
 * @param pads 填充物
 */
BeginningTree.prototype.writeNodes = function(objs, parent, floor, pads) {
	for (var i = 0; i < objs.length; i++) {
		var pos = i == objs.length - 1 ? "bottom" : "middle";
		pads[floor] = i == objs.length - 1 ? "blank" : "line";
		this.writeNode(objs[i], parent, floor, pads, pos);
	}
};

/**
 * 写节点
 * @param obj 数据
 * @param parent 父节点
 * @param floor 当前层数
 * @param pads 填充物
 * @param pos 节点定位
 */
BeginningTree.prototype.writeNode = function(obj, parent, floor, pads, pos) {
	// 创建一个节点标签
	var nodeTag = $("<li category=\"node\" class=\"beginning-tree-node\" />");
	nodeTag.attr("nodeid", obj.id);
	nodeTag.appendTo(parent);
	// 填充层级
	for (var i = 0; i < floor; i++) {
		$("<div class=\"beginning-tree-icon-" + pads[i] + "\">&nbsp;</div>").appendTo(nodeTag);
	}
	// 增加一个展开图标
	var switchTag = $("<div category=\"switch\">&nbsp;</div>");
	switchTag.attr("nodeid", obj.id);
	switchTag.attr("pos", pos);
	if (this.isEmpty(obj.subs)) {
		switchTag.addClass("beginning-tree-icon-" + pos);
	} else {
		switchTag.addClass("beginning-tree-icon-close-" + pos);
		var that = this;
		switchTag.click(function() {
			that.close(obj.id);
		});
	}
	switchTag.appendTo(nodeTag);
	// 增加节点图标
	var iconTag = $("<div category=\"icon\">&nbsp;</div>");
	iconTag.attr("nodeid", obj.id);
	if (this.isBlank(obj.icon)) {
		if (this.isEmpty(obj.subs)) {
			iconTag.addClass("beginning-tree-icon-leaf");
		} else {
			iconTag.addClass("beginning-tree-icon-folder-open");
		}
	} else {
		iconTag.addClass("beginning-tree-icon-" + obj.icon);
	}
	iconTag.appendTo(nodeTag);
	// 增加文字
	var labelTag = $("<span class=\"beginning-tree-label\">" + obj.label + "</span>");
	labelTag.appendTo(nodeTag);
	// 增加提示
	if (!this.isBlank(obj.tooltip)) {
		labelTag.attr("title", obj.tooltip);
	}
	// 增加事件
	if (!this.isNull(obj.click)) {
		switch(typeof obj.click) {
			case "function":
				labelTag.click(obj.click);
				break;
			case "string":
				labelTag.click(function() {
					eval(obj.click);
				});
				break;
		}
	}
	// 增加子节点
	var listNodeTag = $("<li category=\"list\" class=\"beginning-tree-node\" />");
	listNodeTag.attr("nodeid", obj.id);
	listNodeTag.appendTo(parent);
	var listTag = $("<ul class=\"beginning-tree-list\" />");
	listTag.attr("nodeid", obj.id);
	listTag.appendTo(listNodeTag);
	if (!this.isEmpty(obj.subs)) {
		if (pos == "bottom") {
			pads[floor] = "blank";
		}
		this.writeNodes(obj.subs, listTag, floor + 1, pads);
	}
};

/**
 * 打开节点
 * @param id 节点ID
 */
BeginningTree.prototype.open = function(id) {
	// 解除绑定显示子节点事件
	var switchTag = this.tag.find("div[category=switch][nodeid=" + id + "]");
	switchTag.unbind("click");
	var that = this;
	// 显示子节点
	this.tag.find("li[category=list][nodeid=" + id + "]").slideDown(function() {
		// 增加隐藏子节点的事件的绑定
		switchTag.click(function() {
			that.close(id);
		});
	});
	// 改变开关图标样式
	var switchTag = this.tag.find("div[category=switch][nodeid=" + id + "]");
	var pos = switchTag.attr("pos");
	switchTag.removeClass("beginning-tree-icon-open-" + pos);
	switchTag.addClass("beginning-tree-icon-close-" + pos);
	// 改变图标样式
	var iconTag = this.tag.find("div[category=icon][nodeid=" + id + "]");
	iconTag.removeClass("beginning-tree-icon-folder");
	iconTag.addClass("beginning-tree-icon-folder-open");
};

/**
 * 关闭节点
 * @param id 节点ID
 */
BeginningTree.prototype.close = function(id) {
	// 解除绑定隐藏子节点的事件
	var switchTag = this.tag.find("div[category=switch][nodeid=" + id + "]");
	switchTag.unbind("click");
	var that = this;
	// 隐藏子节点
	this.tag.find("li[category=list][nodeid=" + id + "]").slideUp(function() {
		// 增加显示子节点事件的绑定
		switchTag.click(function() {
			that.open(id);
		});
	});
	// 改变开关图标样式
	var switchTag = this.tag.find("div[category=switch][nodeid=" + id + "]");
	var pos = switchTag.attr("pos");
	switchTag.removeClass("beginning-tree-icon-close-" + pos);
	switchTag.addClass("beginning-tree-icon-open-" + pos);
	// 改变图标样式
	var iconTag = this.tag.find("div[category=icon][nodeid=" + id + "]");
	iconTag.removeClass("beginning-tree-icon-folder-open");
	iconTag.addClass("beginning-tree-icon-folder");
};
