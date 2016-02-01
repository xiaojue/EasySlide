/*
 * @author designsor@gmail.com
 * @date 20150730
 * @fileoverview 统一h5动画效果工具,不依赖zepto，用于h5 case by case业务
 */
(function(win, doc, undef) {

  var UA = navigator.userAgent;
  var toString = Object.prototype.toString;

  function isPhone6P(){
    var isIos = /(iPhone|iOS)/i.test(navigator.userAgent);
    var is6P = window.screen.width === 414;
    return isIos && is6P;
  }

  var utils = {
    isPhone6P:isPhone6P(),
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
      if(utils.isPhone6P){
        W = dd.clientWidth; 
      }
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
    addClass: function(ele, cls) {
      if (!this.hasClass(ele, cls)) {
        ele.className += " " + cls;
      }
    },
    removeClass: function(ele, cls) {
      if (this.hasClass(ele, cls)) {
        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
        ele.className = ele.className.replace(reg, ' ');
      }
    },
    isWeixin: function() {
      var match = UA.toLowerCase().match(/MicroMessenger/i);
      return match ? match[0] === "micromessenger" : false;
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
    },
    transitionDurationToMilliseconds: function(duration) {
      var pieces = duration.match(/^([\d\.]+)(\w+)$/),
        time, unit, multiplier;

      if (pieces.length <= 1) {
        return duration;
      }

      time = pieces[1];
      unit = pieces[2];

      switch (unit) {
        case 'ms':
          multiplier = 1;
          break;
        case 's':
          multiplier = 1000;
          break;
      }
      return time * multiplier;
    },
    isArray: function(v) {
      return toString.call(v) === '[object Array]';
    },
    isObject: function(v) {
      return toString.call(v) === '[object Object]';
    },
    isMobile: function() {
      try {
        document.createEvent("TouchEvent");
        return true;
      } catch (e) {
        return false;
      }
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
    },
    off: function(eventname, callback) {
      if (callback) {
        if (this.map[eventname]) {
          this.map[eventname] = this.map[eventname].filter(function(func) {
            return func !== callback;
          });
        }
      } else {
        this.map[eventname] = [];
      }
    }
  };

  var swipeEvent = function(ele) {
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.scrollEle = null;
    this.scrollEleDire = null;
    this.startTime = null;
    this.ele = ele;
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
      if (utils.isMobile()) {
        utils.bind(ele, "touchstart", this._touchstart.bind(this));
        utils.bind(ele, "touchmove", this._touchmove.bind(this));
        utils.bind(ele, "touchend", this._touchend.bind(this));
      } else {
        var mousedown = this._touchstart.bind(this);
        var mousemove = this._touchmove.bind(this);
        var mouseup = this._touchend.bind(this);
        utils.bind(ele, "mousedown",function(e){
          utils.bind(ele, "mousemove", mousemove);
          mousedown(e);
        });
        utils.bind(ele, "mouseup", function(e){
          utils.unbind(ele,"mousemove",mousemove);
          mouseup(e);
        });
      }
    },
    _touchstart: function(e) {
      if (e.touches && e.touches.length > 1) {
        //这里只允许单指操作
        return false;
      }
      this.scrollEle = null;
      this.scrollEleDire = null;
      this.startX = this.lastX = (utils.isMobile() ? e.touches[0].pageX : e.clientX);
      this.startY = this.lastY = (utils.isMobile() ? e.touches[0].pageY : e.clientY);
      this.startTime = Date.now();
      if(this.disabled){
        e.preventDefault(); 
      }
    },
    _touchmove: function(e) {
      var scrollEle = this.isScrollContain(e.target);
      var lastY = this.lastY = utils.isMobile() ? e.touches[0].pageY : e.clientY;
      var lastX = this.lastX = utils.isMobile() ? e.touches[0].pageX : e.clientX;
      if (e.touches && e.touches.length > 1) {
        return false;
      }
      if (scrollEle) {
        this.scrollEle = scrollEle;
        this.scrollEleDire = utils.attr(scrollEle, 'scroll');
        return false;
      }
      var startX = this.startX;
      var startY = this.startY;
      var absX = Math.abs(this.lastX - this.startX);
      var absY = Math.abs(this.lastY - this.startY);
      var moveTime = Date.now() - this.startTime;
      var direc = absX > absY ? "X" : "Y";
      var positive = {
        x: lastX - startX >= 0 ? 1 : -1,
        y: lastY - startY >= 0 ? 1 : -1
      };
      this.trigger('swipeMove', [this.slides, {
        moveTime: moveTime,
        positive: positive,
        direc: direc,
        moveX: absX,
        moveY: absY,
        startX: startX,
        startY: startY,
        lastX: lastX,
        lastY: lastY
      }, e.target]);
      e.preventDefault();
    },
    _touchend: function(e) {

      var target = e.target;
      var absX = Math.abs(this.lastX - this.startX);
      var absY = Math.abs(this.lastY - this.startY);
      var dragDirec = absX > absY ? "x" : "y";
      var of = 20;
      if ((dragDirec === "x" && absX < of) || (dragDirec === "y" && absY < of)) {
        return false;
      }

      if (dragDirec !== this.swipeDirection) {
        this.trigger('dragDirecNotEqual');
      }

      var swipe = dragDirec === 'y' ? 'swipeY' : 'swipeX';
      var direction = dragDirec === 'y' ? (this.lastY < this.startY ? 1 : -1) : (this.lastX < this.startX ? 1 : -1);

      if (this.scrollEle && this.scrollEleDire === dragDirec) {

        var scrollTopLeft = this.scrollEleDire === 'y' ? this.scrollEle.scrollTop : this.scrollEle.scrollLeft;
        var eleHW = this.scrollEleDire === 'y' ? this.scrollEle.clientHeight : this.scrollEle.clientWidth;
        var scrollHW = this.scrollEleDire === 'y' ? this.scrollEle.scrollHeight : this.scrollEle.scrollWidth;

        if (eleHW + scrollTopLeft + 10 >= scrollHW) {
          this.trigger(swipe, [1, target]);
        } else if (scrollTopLeft < 10) {
          this.trigger(swipe, [-1, target]);
        }
        return false;
      }


      var lastY = this.lastY;
      var lastX = this.lastX;
      var startY = this.startY;
      var startX = this.startX;
      this.trigger('swipeEnd',[{
        lastY:lastY,
        startY:startY,
        lastX:lastX,
        startX:startX
      }]);
      if (this.disabled) {
        return false;
      }
      this.trigger(swipe, [direction, target]);
      this.startX = this.startY = this.lastX = this.lastY = 0;
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

    this.disabled = false;

    this.subppt = [];
    this.subpptNum = []; //哪些slide是有左右滑动的子ppt的

    var defaultConfig = {
      margin: 0,
      backgroungMusic: null,
      transition: 'all 0.5s ease',
      firstTime: true,
      animateEffect: 'default',
      swipeDirection: 'y',
      replay: false,
      wrapAll: ''
    };

    utils.mixin(defaultConfig, config);
    utils.mixin(this, defaultConfig);

    this.wrapAll = utils.$(this.wrapAll);
    swipeEvent.call(this, this.wrapAll);
    this.bgMusicPlaying = false;
    this.init();
  };

  EasySlide.STATIC = {
    flayerCls: 'EasySlide-flayer',
    flayerTriggerCls: 'EasySlide-triggerLayer',
    animateCls: 'EasySlide-animate',
    groupCls: 'EasySlide-groups',
    slideCls: 'EasySlide-slides'
  };

  EasySlide.animationEffects = {
    'default': function(ele, axis, offsetEnd, setTransition) {
      if (setTransition) {
        ele.style["-webkit-transition"] = this.transition;
      }
      ele.style["-webkit-transform"] = 'translateZ(0) translate' + axis + '(' + offsetEnd + 'px)';
    }
  };

  EasySlide.prototype = {
    constructor: EasySlide,
    bindEvent: function() {
      utils.bind(this.wrapAll, "click", this._click.bind(this));
      //绑在touchend上，操作才灵敏
      this.on('swipeY', this.allowSwipeY.bind(this));
      this.on('swipeX', this.allowSwipeX.bind(this));
      //会触发2次动画
      //utils.bind(win, "load", this.resize.bind(this));
      utils.bind(win, "resize", this.resize.bind(this));
      utils.bind(win, "scroll", function(e) {
        e.preventDefault();
      });
    },
    renderSlide: function() {
      this.slides = utils.getByClsName(EasySlide.STATIC.slideCls, this.wrapAll);
      this.slidesLen = this.slides.length;
      this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[0]);
      this.curGLen = this.curGroups.length;
      this.showCurSlide();
    },
    init: function() {

      this.initSlides(this.wrapAll);

      this.renderSlide();

      this.bindEvent();

      if (this.subpptObjects) {
        if (!EasySlide.Subppt) {
          throw new Error('must have ppt.js!');
        } else {
          this.initSubPPT(this.subpptObjects);
        }
      }
    },
    initSlides: function(wrap) {
      this.vW = this.width || utils.viewData().viewWidth;
      this.vH = this.height || utils.viewData().viewHeight;
      wrap.style.height = this.vH + "px";
      wrap.style.width = this.vW + "px";
    },
    setBgMusic: function() {
      if (this.backgroungMusic) {
        var url = this.backgroungMusic;
        var audio = doc.createElement('audio');
        audio.loop = "loop";
        this.music = audio;
        this.trigger('beforeMusicStart', [this.music]);
        audio.src = url;
        this.trigger('musicStart', [this.music]);
        doc.body.appendChild(audio);
      }
    },
    bgMusicPlay: function() {
      if (this.music) {
        this.bgMusicPlaying = true;
        this.music.play();
        this.trigger('musicPlay', [this.music]);
      }
    },
    bgMusicPause: function() {
      if (this.music) {
        this.bgMusicPlaying = false;
        this.music.pause();
        this.trigger('musicPause', [this.music]);
      }
    },
    bgMusicSwitch: function() {
      if (this.music) {
        if (!this.bgMusicPlaying) {
          this.bgMusicPlay();
        } else {
          this.bgMusicPause();
        }
      }
    },
    resize: function() {
      var self = this;
      setTimeout(function(){
        self.initSlides(self.wrapAll);
        self.showCurSlide();
      },100);
    },
    getEffects: function(el) {
      return utils.attr(el, 'effect') || this.animateEffect;
    },
    setYPos: function(el, posY) { //设置slide的竖直方向位置
      var effect = this.getEffects(el);
      EasySlide.animationEffects[effect].call(this, el, 'Y', posY, true);
    },
    setXPos: function(el, posX) { //设置slide的竖直方向位置
      var effect = this.getEffects(el);
      EasySlide.animationEffects[effect].call(this, el, 'X', posX, true);
    },
    removeAnimation: function(el) {
      el.style['-webkit-animation'] = "";
      el.offsetWidth = el.offsetWidth;
    },
    setAnimation: function(el, animation) {
      el.style["-webkit-animation"] = animation.name + " " + animation.duration + " " + animation.tfunction + " " + animation.delay + " " + animation.iteration + " normal forwards";
    },
    setAnimationAttr: function(div) {
      var attr = utils.attr,
        style = div.style,
        attrs = {
          'in': attr(div, "in") || style['-webkit-animation-name'] || '',
          duration: attr(div, "duration") || style['-webkit-animation-duration'] || '',
          tfunction: attr(div, "tfunction") || style['-webkit-timing-function'] || '',
          delay: attr(div, "delay") || style['-webkit-animation-delay'] || '',
          iteration: attr(div, "iteration") || style['-webkit-iteration-count'] || ''
        };
      for (var i in attrs) {
        if (attrs[i] !== '' && attrs[i] !== null) {
          attr(div, i, attrs[i]);
        }
      }
    },
    showSlide: function() {
      var self = this;

      this.slides.forEach(function(slide) {

        var tIndex = parseInt(utils.attr(slide, "index"), 10);
        var isEnd = self.curIndex === self.slidesLen - 1 && tIndex === 0;
        var isFirst = self.curIndex === 0 && tIndex === self.slidesLen - 1;
        var isCur = tIndex === self.curIndex;
        var isNext = tIndex === self.curIndex + 1;
        var isPrev = tIndex === self.curIndex - 1;
        var y = isCur ? 0 : null;
        var x = isCur ? 0 : null;

        if (isNext || isEnd) {
          y = self.vH + self.margin;
          x = self.vW + self.margin;
        } else if (isPrev || isFirst) {
          y = -self.vH - self.margin;
          x = -self.vW - self.margin;
        }

        if (isCur || isNext || isPrev || isEnd || isFirst) {
          if (self.swipeDirection === 'y') {
            self.setYPos(slide, y);
          } else if (self.swipeDirection === 'x') {
            self.setXPos(slide, x);
          }
          utils.show(slide);
        } else {
          utils.hide(slide);
        }

      });
    },
    showCurSlide: function() {
      var self = this;
      var attr = utils.attr;

      this.trigger('beforeShowSlide', [allowswipe,this.curGroups]);
      this.showSlide();

      this.curGroups.forEach(function(group) {
        var tIndex = parseInt(utils.attr(group, "gIndex"), 10);
        //处理当前slide下面的groups的展示
        if (tIndex === self.curGIndex) {
          utils.show(group);
          var animateDivs = utils.getByClsName(EasySlide.STATIC.animateCls, group);
          animateDivs.forEach(self.setAnimationAttr);
          if (self.replay) {
            animateDivs.forEach(self.removeAnimation);
          }
          animateDivs.forEach(function(div) {
            //如果webkit-animation有动画需要赋值
            self.setAnimation(div, {
              name: attr(div, "in"),
              duration: attr(div, "duration") || ".5s",
              tfunction: attr(div, "tfunction") || "ease",
              delay: attr(div, "delay") || 0,
              iteration: attr(div, "iteration") || 1
            });
          });
          self.trigger('showCurSlide',[group]);
        } else {
          //动画执行完毕再隐藏
          utils.hide(group);
        }
      });
      var allowswipe = this.getCurAllowSwipe(); //获得该针是否允许上下滑动
      this.trigger('slide-switchEnd', [allowswipe,this.curGroups]);
    },
    getCurAllowSwipe: function() {
      return utils.attr(this.curGroups[this.curGIndex], "allowswipe"); //获得该针是否允许上下滑动
    },
    allowSwipeY: function(direction) {
      this.allowSwipe(direction, 'y');
    },
    allowSwipeX: function(direction, target) {
      var subindex = this.subpptNum.indexOf(this.curIndex);
      if (subindex !== -1 && utils.contain(target, EasySlide.Subppt.STATIC.imgWrapCls)) { //如果此页有子ppt
        this.subppt[subindex].move(direction);
        this.trigger('ppt-switchEnd');
        return;
      }
      this.allowSwipe(direction, 'x');
    },
    allowSwipe: function(direction, swipeDirection) {
      var allowswipe = this.getCurAllowSwipe(); //获得该针是否允许上下滑动
      if ((!allowswipe || allowswipe === "next" || allowswipe === 'prev') && this.swipeDirection === swipeDirection) {
        if ((allowswipe === 'next' && direction === 1) || (allowswipe === 'prev' && direction === -1) || allowswipe === null) {
          this.move(direction);
        }
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
        var tLayer;
        if (utils.hasAttr(target, "goto")) {
          //所有的大frame之间的跳转
          e.stopPropagation();
          var tGoIndex = parseInt(utils.attr(target, "goto"), 10);
          this.goto(tGoIndex);
          break;
        } else if (utils.hasAttr(target, 'flayerbtn')) {
          e.stopPropagation();
          tLayer = utils.$(utils.attr(target, "layerid"));
          if (tLayer) {
            utils.hide(tLayer);
          }
          break;
        } else if (utils.hasAttr(target, "flayer")) {
          e.stopPropagation();
          utils.show(target);
          break;
        } else if (utils.hasAttr(target, 'newhref')) {
          e.stopPropagation();
          var newhref = utils.attr(target, "newhref");
          window.open(newhref);
          break;
        } else if (utils.hasAttr(target, 'layerid')) {
          //所有点击出浮层
          e.stopPropagation();
          tLayer = utils.$(utils.attr(target, "layerid"));
          if (tLayer) {
            utils.show(tLayer);
          }
          break;
        } else if (utils.hasAttr(target, 'musicctrl')) {
          e.stopPropagation();
          this.bgMusicSwitch();
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
    }
  };

  EasySlide.prototype = utils.mixin(EasySlide.prototype, swipeEvent.prototype);

  EasySlide.utils = utils;

  win.EasySlide = EasySlide;

})(window, document);
