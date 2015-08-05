/*
 * @author zengshun 第一版
 * @author fuqiang3 第二版重构 -> 保留功能，全部优化+重新设计api
 * @date 20150730
 * @fileoverview 统一h5动画效果工具,不依赖zepto，用于h5 case by case业务
 */

(function(win, doc, undef) {

  var UA = navigator.userAgent;

  var utils = {
    $: function(id) {
      return doc.getElementById(id);
    },
    getByTagName: function(tag, ele) {
      ele = ele || doc;
      return utils.makeElesArray(ele.getElementsByTagName(tag));
    },
    getByClsName: function(cls, ele) {
      ele = ele || doc;
      return utils.makeElesArray(ele.getElementsByClassName(cls));
    },
    makeElesArray: function(eles) {
      return Array.prototype.slice.call(eles);
    },
    attr: function(ele, key, val) {
      if (val !== undef) {
        return ele.setAttribute(key, val);
      } else {
        return ele.getAttribute(key);
      }
    },
    bind: function(ele, eventType, func) {
      ele.addEventListener(eventType, func, false);
    },
    unbind: function(ele, eventType, func) {
      ele.removeEventListener(eventType, func, false);
    },
    viewData: function() {
      var w = win,
        body = doc.body,
        dd = doc.documentElement,
        W = w.innerWidth || dd.clientWidth || body.clientWidth || 0,
        H = w.innerHeight || dd.clientHeight || body.clientHeight || 0;
      return {
        "scrollTop": body.scrollTop || dd.scrollTop || w.pageYOffset,
        "scrollLeft": body.scrollLeft || dd.scrollLeft || w.pageXOffset,
        "documentWidth": Math.max(body.scrollWidth, dd.scrollWidth || 0),
        "documentHeight": Math.max(body.scrollHeight, dd.scrollHeight || 0, H),
        "viewWidth": W,
        "viewHeight": H
      };
    },
    remove: function(nid) {
      //删除某个节点
      if (nid && nid.nodeName) {
        nid.parentNode.removeChild(nid);
      }
    },
    hide: function(ele) {
      ele.style.display = 'none';
    },
    show: function(ele) {
      ele.style.display = 'block';
    },
    hasAttr: function(ele, key) {
      return ele.hasAttribute(key);
    },
    contain: function(ele, cls) {
      while (ele && ele.parentNode) {
        if (utils.hasClass(ele, cls)) {
          return ele;
        }
        ele = ele.parentNode;
      }
      return false;
    },
    hasClass: function(ele, cls) {
      return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    },
    isWeixin: function() {
      return UA.toLowerCase().match(/MicroMessenger/i) === "micromessenger" ? true : false;
    },
    shareWeibo: function(params) {
      var wbTitle = doc.title || params.title;
      var shareImg = params.shareImg || '';
      var weiboreg = /weibo/i;
      if (weiboreg.test(UA)) {
        win.WeiboJSBridge.invoke("openMenu", {}, function() {});
      } else {
        //wb_title为微博分享文案，share_img为分享图
        doc.location.href = 'http://share.sina.cn/callback?vt=4&title=' + encodeURIComponent(wbTitle) + '&pic=' + encodeURIComponent(shareImg) + '&url=' + encodeURIComponent(document.location.href);
      }
    },
    mixin: function(sup, obj) {
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          sup[i] = obj[i];
        }
      }
      return sup;
    }
  };

  var Events = function() {
    this.map = {};
  };

  Events.prototype = {
    constructor: Event,
    trigger: function(eventname, args) {
      if (this.map[eventname]) {
        this.map[eventname].forEach(function(fn) {
          fn.apply(this, args);
        });
      }
    },
    on: function(eventname, callback) {
      if (this.map[eventname]) {
        this.map[eventname].push(callback);
      } else {
        this.map[eventname] = [callback];
      }
    }
  };

  var swipeEvent = function(ele) {
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.isScrollMoving = false;
    this.scrollEle = null;
    Events.call(this);
    this.bindSwipe(ele);
  };

  swipeEvent.prototype = {
    constructor: swipeEvent,
    isScrollContain: function(ele) {
      while (ele && ele.parentNode) {
        if (utils.hasAttr(ele, 'scroll')) {
          return ele;
        }
        ele = ele.parentNode;
      }
      return null;
    },
    bindSwipe: function(ele) {
      utils.bind(ele, "touchstart", this._touchstart.bind(this));
      utils.bind(ele, "touchmove", this._touchmove.bind(this));
      utils.bind(ele, "touchend", this._touchend.bind(this));
    },
    _touchstart: function(e) {
      if (e.touches && e.touches.length > 1) {
        //这里只允许单指操作
        return false;
      }
      this.scrollEle = null;
      this.startX = this.lastX = e.touches[0].pageX;
      this.startY = this.lastY = e.touches[0].pageY;
    },
    _touchmove: function(e) {
      var scrollEle = this.isScrollContain(e.target);
      if (scrollEle) {
        this.scrollEle = scrollEle;
        return false;
      }
      e.preventDefault();

      if (e.touches && e.touches.length > 1) {
        return false;
      }
      this.lastX = e.touches[0].pageX;
      this.lastY = e.touches[0].pageY;
    },
    _touchend: function() {
      if (this.scrollEle) {
        var scrollTop = this.scrollEle.scrollTop;
        var eleH = this.scrollEle.clientHeight;
        var scrollH = this.scrollEle.scrollHeight;
        if (eleH + scrollTop + 10 >= scrollH) {
          this.trigger('swipeY', [1]);
        } else if (scrollTop < 10) {
          this.trigger('swipeY', [-1]);
        }
        return false;
      }

      var absX = Math.abs(this.lastX - this.startX);
      var absY = Math.abs(this.lastY - this.startY);

      var dragDirec = absX > absY ? "x" : "y";

      if ((dragDirec === "x" && absX < 30) || (dragDirec === "y" && absY < 30)) {
        return false;
      }

      if (dragDirec === "y") {
        this.trigger('swipeY', [this.lastY < this.startY ? 1 : -1]);
      } else if (dragDirec === "x") {
        this.trigger('swipeX', [this.lastX < this.startX ? 1 : -1]);
      }
    }
  };

  swipeEvent.prototype = utils.mixin(swipeEvent.prototype, Events.prototype);

  var EasySlide = function(config) {

    this.slides = [];
    this.slidesLen = 0;
    this.curIndex = 0;

    this.curGroups = [];
    this.curGLen = 0;
    this.curGIndex = 0;

    this.subppt = [];
    this.subpptNum = []; //哪些slide是有左右滑动的子ppt的
    this.firstTime = true; //是否是第一次浏览。如果是第一次，不能从第0张直接滑动看最后一张

    var defaultConfig = {
      replay: false,
      wrapAll: ''
    };

    utils.mixin(defaultConfig, config);
    utils.mixin(this, defaultConfig);

    this.wrapAll = utils.$(this.wrapAll);
    swipeEvent.call(this, this.wrapAll);
    this.init();
  };

  EasySlide.STATIC = {
    flayerCls: 'EasySlide-flayer',
    flayerTriggerCls: 'EasySlide-triggerLayer',
    animateCls: 'EasySlide-animate',
    groupCls: 'EasySlide-groups',
    slideCls: 'EasySlide-slides'
  };

  EasySlide.prototype = {
    constructor: EasySlide,
    initSubPPT: function(subpptObjects) {
      var self = this;

      function initSub(index, subpptObj) {
        self.subppt[index] = new EasySlide.Subppt({
          wrapDiv: subpptObj.wrapDiv,
          imgs: subpptObj.imgs
        });
        self.subpptNum.push(subpptObj.parentNum);
      }

      subpptObjects.forEach(function(subpptObj, index) {
        var tTarget = utils.$(subpptObj.wrapDiv);
        tTarget = utils.contain(tTarget, EasySlide.STATIC.flayerCls);
        if (tTarget) {
          var trigger = utils.$(utils.attr(tTarget, EasySlide.STATIC.flayerTriggerCls));
          utils.bind(trigger, "click", function() {
            initSub(index, subpptObj);
          });
        } else {
          initSub(index, subpptObj);
        }
      });
    },
    bindEvent: function() {
      utils.bind(this.wrapAll, "click", this._click.bind(this));
      //绑在touchend上，操作才灵敏
      this.on('swipeY', this.allowSwipeY.bind(this));
      this.on('swipeX', this.allowSwipeX.bind(this));
      utils.bind(win, "load", this.resize.bind(this));
      utils.bind(win, "resize", this.resize.bind(this));
      utils.bind(win, "scroll", function(e) {
        e.preventDefault();
      });
    },
    init: function() {

      this.initSlides(this.wrapAll);

      this.slides = utils.getByClsName(EasySlide.STATIC.slideCls, this.wrapAll);
      this.slidesLen = this.slides.length;
      this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[0]);
      this.curGLen = this.curGroups.length;
      this.showCurSlide();

      this.bindEvent();

      if (this.subpptObjects) {
        this.initSubPPT(this.subpptObjects);
      }

    },
    initSlides: function(wrap) {
      this.vW = utils.viewData().viewWidth;
      this.vH = utils.viewData().viewHeight;
      wrap.style.height = this.vH + "px";
      wrap.style.width = this.vW + "px";
    },
    resize: function() {
      this.initSlides(this.wrapAll);
      this.showCurSlide();
    },
    setYPos: function(el, posY) { //设置slide的竖直方向位置
      el.style["-webkit-transform"] = "translate3d(0," + posY + "px,0)";
    },
    removeAnimation: function(el) {
      el.style['-webkit-animation'] = "";
      el.offsetWidth = el.offsetWidth;
    },
    setAnimation: function(el, animation) {
      el.style["-webkit-animation"] = animation.name + " " + animation.duration + " " + animation.tfunction + " " + animation.delay + " " + animation.iteration + " normal forwards";
    },
    showCurSlide: function() {
      var self = this;
      var attr = utils.attr;

      this.slides.forEach(function(slide) {

        var tIndex = parseInt(utils.attr(slide, "index"), 10);
        var isEnd = self.curIndex === self.slidesLen - 1 && tIndex === 0;
        var isFirst = self.curIndex === 0 && tIndex === self.slidesLen - 1;
        var isCur = tIndex === self.curIndex;
        var isNext = tIndex === self.curIndex + 1;
        var isPrev = tIndex === self.curIndex - 1;
        var y = isCur ? 0 : null;

        if (isNext || isEnd) {
          y = self.vH;
        } else if (isPrev || isFirst) {
          y = -self.vH;
        }


        if (isCur || isNext || isPrev || isEnd || isFirst) {
          self.setYPos(slide, y);
          utils.show(slide);
        } else {
          utils.hide(slide);
        }
        
      });

      this.curGroups.forEach(function(group) {
        var tIndex = parseInt(utils.attr(group, "gIndex"), 10);
        //处理当前slide下面的groups的展示
        if (tIndex === self.curGIndex) {
          utils.show(group);
          var animateDivs = utils.getByClsName(EasySlide.STATIC.animateCls, group);
          if (self.replay) {
            animateDivs.forEach(self.removeAnimation);
          }
          animateDivs.forEach(function(div) {
            self.setAnimation(div, {
              name: attr(div, "in"),
              duration: attr(div, "duration") || ".5s",
              tfunction: attr(div, "tfunction") || "ease",
              delay: attr(div, "delay") || 0,
              iteration: attr(div, "iteration") || 1
            });
          });
        } else {
          //动画执行完毕再隐藏
          utils.hide(group);
        }
      });
      var allowswipe = utils.attr(this.curGroups[this.curGIndex], "allowswipe"); //获得该针是否允许上下滑动
      this.trigger('slide-switchEnd', [allowswipe]);
    },
    allowSwipeY: function(direction) {
      //获得该针是否允许上下滑动
      var allowswipe = utils.attr(this.curGroups[this.curGIndex], "allowswipe"); //获得该针是否允许上下滑动
      if (!allowswipe || allowswipe === "next" || allowswipe === 'prev') {
        this.move(direction);
      }
    },
    allowSwipeX: function(direction) {
      var subindex = this.subpptNum.indexOf(this.curIndex);
      if (subindex !== -1) { //如果此页有子ppt
        this.subppt[subindex].move(direction);
      }
    },
    move: function(direction) {
      var directions = {
        '1': function() {
          if (this.curGIndex < this.curGLen - 1) {
            this.curGIndex++;
          } else {
            this.curIndex++;
            if (this.curIndex >= this.slidesLen) {
              this.curIndex = 0;
            }
            if (this.curIndex === this.slidesLen - 1) {
              this.firstTime = false; //看到最后一页了
            }
            this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[this.curIndex]);
            this.curGLen = this.curGroups.length;
            this.curGIndex = 0;
          }
        },
        '-1': function() {
          if (this.curGIndex > 0) {
            this.curGIndex--;
          } else {
            this.curIndex--;
            if (this.curIndex < 0) {
              if (this.firstTime) {
                this.curIndex = 0;
              } else {
                this.curIndex = this.slidesLen - 1;
              }
            }
            this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[this.curIndex]);
            this.curGLen = this.curGroups.length;
            this.curGIndex = this.curGLen - 1;
          }
        }
      };
      directions[direction].call(this);
      this.showCurSlide();
    },
    _click: function(e) {
      //处理各种逻辑，包括跳转、出浮层、浮层消失等
      var target = e.target;
      while (target && target.parentNode && target !== this.wrapAll) {
        if (utils.hasAttr(target, "goto")) {
          //所有的大frame之间的跳转
          e.stopPropagation();
          var tGoIndex = parseInt(utils.attr(target, "goto"), 10);
          this.goto(tGoIndex);
          break;
        } else if (utils.hasAttr(target, 'layerid')) {
          //所有点击出浮层
          e.stopPropagation();
          var tLayer = utils.$(utils.attr(target, "layerid"));
          utils.show(tLayer);
          break;
        } else if (utils.hasClass(target, EasySlide.STATIC.flayerCls)) {
          //浮层点击消失
          e.stopPropagation();
          utils.hide(target);
          break;
        }
        target = target.parentNode;
      }
    },
    goto: function(index) {
      //直接跳转到某个大slide
      this.curIndex = index;
      //换大的slide了，自然需要换一组新的groups
      this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[this.curIndex]);
      this.curGLen = this.curGroups.length;
      this.curGIndex = 0;
      this.showCurSlide();
    },
    loader: function(resource) {
      //加载资源loading界面
      var self = this,
        timg = [],
        resourceLen = resource.length,
        successCount = 0;
      resource.forEach(function(src, index) {
        timg[index] = new Image();
        timg[index].onload = timg[index].onerror = function() {
          successCount++;
          self.trigger('progress', [(successCount / resourceLen * 100).toFixed(2)]);
          if (successCount === resourceLen) {
            self.trigger('loaded');
          }
        };
        timg[index].src = src;
      });
    }
  };

  EasySlide.prototype = utils.mixin(EasySlide.prototype, swipeEvent.prototype);

  var Subppt = function(obj) {
    this.curIndex = 0;
    this.init(obj);
  };

  Subppt.STATIC = {
    slideCls: 'EasySlide-subppt-slide',
    imgWrapCls: 'EasySlide-subppt-imgWrap'
  };


  Subppt.prototype = {
    init: function(obj) {
      this.wrapDiv = utils.$(obj.wrapDiv);
      this.imgs = obj.imgs;
      this.slidesLen = this.imgs.length;
      this.initSlides(this.wrapDiv);
      this.dotsWrap = utils.$(obj.dotsWrap);
      if (this.dotsWrap) {
        this.createDots();
      }
      utils.bind(win, "resize", this.resize.bind(this));
      this.showCurSlide();
    },
    createDots: function() {
      var tFrag = doc.createDocumentFragment();
      for (var i = 0; i < this.slidesLen; i++) {
        var tSpan = doc.createElement("span");
        tFrag.appendChild(tSpan);
      }
      this.dotsWrap.appendChild(tFrag);
    },
    resize: function() {
      this.initSlides(this.wrapDiv);
      var floorvW = this.floorvW.bind(this);
      var slides = utils.getByClsName(Subppt.STATIC.slideCls, this.wrapDiv);
      slides.forEach(function(slide) {
        slide.style.width = floorvW(0.6) + "px";
      });
      this.showCurSlide();
    },
    setPos: function(el, posX, posY, scale) { //设置slide的水平方向位置
      posX = posX || 0;
      posY = posY || 0;
      var transform = "translate3d(" + posX + "px," + posY + "px,0)";
      if (scale) {
        transform += " scale3d(" + scale + "," + scale + ",1)";
      }
      el.style["-webkit-transform"] = transform;
    },
    createSlide: function(index) {
      var tDiv = doc.createElement("div");
      tDiv.className = Subppt.STATIC.slideCls;
      utils.attr(tDiv, "subindex", index);
      tDiv.style.width = this.floorvW(0.6) + "px";
      tDiv.innerHTML = "<div class='" + Subppt.STATIC.imgWrapCls + "'><img src='" + this.imgs[index] + "' /></div></div>";
      this.wrapDiv.appendChild(tDiv);
      return tDiv;
    },
    showDotes: function() {
      var self = this,
        spans = utils.getByTagName("span", this.dotsWrap);
      spans.forEach(function(span, i) {
        span.className = i === self.curIndex ? "on" : "";
      });
    },
    floorvW: function(num) {
      return Math.floor(this.vW * num);
    },
    showCurSlide: function() {
      var self = this,
        floorvW = self.floorvW.bind(this),
        hasCurEffect = [floorvW(0.2)],
        hasNext1Effect = [floorvW(0.9), floorvW(0.05), 0.8],
        hasNext2Effect = [self.vW + 150, floorvW(0.1), 0.7],
        hasPrev1Effect = [-floorvW(0.38), floorvW(0.05), 0.8],
        hasPrev2Effect = [-self.vW - 150, floorvW(0.1), 0.7],
        slides = utils.getByClsName(Subppt.STATIC.slideCls, this.wrapDiv);

      var last1 = this.slidesLen - 1;
      var last2 = this.slidesLen - 2;
      var next1 = this.curIndex + 1;
      var next2 = this.curIndex + 2;
      var prev1 = this.curIndex - 1;
      var prev2 = this.curIndex - 2;

      var states = {
        hasCur: false,
        hasPrev1: false,
        hasPrev2: false,
        hasNext1: false,
        hasNext2: false
      };

      slides.forEach(function(slide) {

        var tIndex = parseInt(utils.attr(slide, "subindex"), 10);
        var isCur = tIndex === this.curIndex;
        var isNext = tIndex === next1;
        var isLast = (this.curIndex === last1 && tIndex === 0);
        var isNext2 = tIndex === next2;
        var isNextLast2 = (this.curIndex === last1 && tIndex === 1) || (this.curIndex === last2 && tIndex === 0);
        var isPrev = tIndex === prev1;
        var isFirst = (this.curIndex === 0 && tIndex === last1);
        var isPrev2 = tIndex === prev2;
        var isPrevFirst2 = (this.curIndex === 0 && tIndex === last2) || (this.curIndex === 1 && tIndex === last1);

        function setState(states) {
          var posArgs = [];
          for (var state in states) {
            if (states[state] === true) {
              switch (state) {
                case 'hasCur':
                  posArgs = [slide].concat(hasCurEffect);
                  break;
                case 'hasNext1':
                  posArgs = [slide].concat(hasNext1Effect);
                  break;
                case 'hasNext2':
                  posArgs = [slide].concat(hasNext2Effect);
                  break;
                case 'hasPrev1':
                  posArgs = [slide].concat(hasPrev1Effect);
                  break;
                case 'hasPrev2':
                  posArgs = [slide].concat(hasPrev2Effect);
                  break;
              }
              break;
            }
          }
          self.setPos.apply(self, posArgs);
        }

        var hasCur = isCur;
        var hasNext1 = isNext || isLast;
        var hasNext2 = isNext2 || isNextLast2;
        var hasPrev1 = isPrev || isFirst;
        var hasPrev2 = isPrev2 || isPrevFirst2;
        //局部的每次都做动画
        setState({
          hasCur:isCur,
          hasNext1:hasNext1,
          hasNext2:hasNext2,
          hasPrev1:hasPrev1,
          hasPrev2:hasPrev2
        });
        //全局只标记一次
        states.hasCur = states.hasCur ? states.hasCur : hasCur;
        states.hasNext1 = states.hasNext1 ? states.hasNext1 : hasNext1;
        states.hasNext2 = states.hasNext2 ? states.hasNext2 : hasNext2;
        states.hasPrev1 = states.hasPrev1 ? states.hasPrev1 : hasPrev1;
        states.hasPrev2 = states.hasPrev2 ? states.hasPrev2 : hasPrev2;

      }.bind(this));

      function createCur() {
        var tDiv = self.createSlide(self.curIndex);
        self.setPos.apply(self, [tDiv].concat(hasCurEffect));
      }

      function createNext1() {
        var tDiv = self.curIndex < last1 ? self.createSlide(next1) : self.createSlide(0);
        self.setPos.apply(self, [tDiv].concat(hasNext1Effect));
      }

      function createNext2() {
        var tDiv;
        if (self.curIndex < last2) {
          tDiv = self.createSlide(next2);
        } else if (self.curIndex === last2) {
          tDiv = self.createSlide(0);
        } else {
          tDiv = self.createSlide(1);
        }
        self.setPos.apply(self, [tDiv].concat(hasNext2Effect));
      }

      function createPrev1() {
        var tDiv = self.curIndex > 0 ? self.createSlide(prev1) : self.createSlide(last1);
        self.setPos.apply(self, [tDiv].concat(hasPrev1Effect));
      }

      function createPrev2() {
        var tDiv;
        if (self.curIndex > 1) {
          tDiv = self.createSlide(prev2);
        } else if (self.curIndex === 1) {
          tDiv = self.createSlide(last1);
        } else {
          tDiv = self.createSlide(last2);
        }
        self.setPos.apply(self, [tDiv].concat(hasPrev2Effect));
      }

      var createSlide = {
        hasCur:createCur,
        hasNext1:createNext1,
        hasNext2:createNext2,
        hasPrev1:createPrev1,
        hasPrev2:createPrev2
      };

      for(var i in states){
        if(states.hasOwnProperty(i) && !states[i]){
          createSlide[i]();
        }
      }

      if (this.dotsWrap) {
        this.showDotes();
      }

    },
    move: function(direction) {
      var slides = utils.getByClsName(Subppt.STATIC.slideCls, this.wrapDiv);
      for (var i = 0, len = slides.length; i < len; i++) {
        var tIndex = parseInt(utils.attr(slides[i], "subindex"), 10);
        var delta = direction === 1 ? this.curIndex - tIndex : tIndex - this.curIndex;
        delta = delta > 0 ? delta : delta + this.slidesLen;
        if (delta === 2) {
          utils.remove(slides[i]); //删掉最左侧的隐藏slide，否则如果正好5张，动画会重叠，因为此时没有slide是隐藏的
          break;
        }
      }
      if (direction === 1) {
        this.curIndex++;
        if (this.curIndex >= this.slidesLen) {
          this.curIndex = 0;
        }
      } else {
        this.curIndex--;
        if (this.curIndex < 0) {
          this.curIndex = this.slidesLen - 1;
        }
      }
      this.showCurSlide();
    }
  };

  Subppt.prototype.initSlides = EasySlide.prototype.initSlides;

  EasySlide.Subppt = Subppt;

  EasySlide.utils = utils;

  win.EasySlide = EasySlide;

})(window, document);
